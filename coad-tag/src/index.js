import {
  COAD_TAG_VERSION,
  CONTAINER_CREATION_MAX_RETRIES,
  CONTAINER_INITIAL_RETRY_DELAY,
  CONTAINER_MAX_RETRY_DELAY,
  AD_REQUEST_TIMEOUT,
  AD_MAX_LOAD_RETRIES,
  AD_INITIAL_RETRY_DELAY,
  createConfig
} from './config.js';
import {
  createLogger,
  EventDispatcher,
  RetryHelper,
  URLUtils
} from './utils.js';
import { createAPIClient } from './api-client.js';
import { createAnalytics } from './analytics.js';
import { createAdRenderer } from './ad-renderer.js';
import { createContainerManager } from './container-manager.js';

// State management
let tagConfig = null;
let logger = null;
let apiClient = null;
let analytics = null;
let adRenderer = null;
let containerManager = null;
let adContainers = new Map();
let loadedAds = new Map();
let isInitialized = false;
let initStartTime = null;

const setupCoAdTag = (config) => {
  // Get publisher ID from script URL parameter if not provided in config
  const publisherIdFromURL = URLUtils.getPublisherIdFromScriptURL();

  // Merge config with publisherId from URL (URL takes precedence)
  const mergedConfig = {
    ...config,
    ...(publisherIdFromURL && { publisherId: publisherIdFromURL })
  };

  tagConfig = createConfig(mergedConfig);
  logger = createLogger(tagConfig);
  apiClient = createAPIClient(logger);
  analytics = createAnalytics(logger);
  adRenderer = createAdRenderer(logger, analytics);
  containerManager = createContainerManager(logger, analytics);

  if (publisherIdFromURL) {
    logger.log('Publisher ID extracted from script URL:', publisherIdFromURL);
  }
  logger.log('Configuration setup complete', tagConfig);
};

// Initialize Tag with error handling and retry logic
const startInitialization = () => {
  initCoAdTag().catch(error => {
    console.error('[CoAd Tag] Initialization failed:', error);
    console.error('[CoAd Tag] Error details:', error.message);

    // If it's a publisher ID error, show helpful message
    if (error.message.includes('Publisher ID is required')) {
      console.warn('[CoAd Tag] To fix this: Ensure your script tag includes the publisherId parameter');
      console.warn('[CoAd Tag] Example: <script src="http://localhost:4001/src/index.js?publisherId=your-publisher-id" type="module" async></script>');
      console.warn('[CoAd Tag] Get your publisher ID from the CoAd Publisher Dashboard');
    } else if (error.message.includes('not found')) {
      console.warn('[CoAd Tag] Publisher configuration not found. Please check your publisher ID or register at the CoAd publisher dashboard');
    }

    // Don't retry for configuration errors
    if (!error.message.includes('Publisher ID is required') && !error.message.includes('not found')) {
      setTimeout(() => startInitialization(), 2000);
    }
  });
};

const initCoAdTag = async () => {
  if (isInitialized) {
    logger.log('Already initialized');
    return;
  }

  initStartTime = Date.now();

  try {
    await apiClient.checkConnectivity(tagConfig);

    if (!tagConfig.publisherId) {
      throw new Error('Publisher ID is required. Please ensure the script tag includes ?publisherId=your-publisher-id parameter.');
    }

    logger.log(`Publisher ID provided: ${tagConfig.publisherId}, fetching publisher config by id...`);
    const apiConfig = await apiClient.fetchPublisherConfigById(tagConfig);

    Object.assign(tagConfig, apiConfig);

    if (!tagConfig.publisherId) {
      throw new Error('Unable to determine Publisher ID. Please register this website in the CoAd Publisher Dashboard');
    }

    logger.log('Publisher config loaded:', tagConfig);

    await createAdContainersWithRetry();
    setupAdRefresh();
    containerManager.injectStyles();
    containerManager.setupDOMObserver(
      tagConfig,
      () => createAdContainers(),
      () => loadAds()
    );

    isInitialized = true;
    logger.log('CoAd Tag initialized successfully');

    analytics.trackInitialization(tagConfig, true, Date.now() - initStartTime);
    EventDispatcher.dispatch('CoAd:initialized', {
      coadTag: {
        init: initCoAdTag,
        refresh: refreshAds,
        forceReinit: forceReinitialize,
        getStatus: getCoAdTagStatus,
        destroy: destroyCoAdTag
      }
    });
  } catch (error) {
    analytics.trackInitialization(tagConfig, false, Date.now() - initStartTime, error);
    logger.error('Failed to initialize:', error);
    throw error;
  }
};

const createAdContainersWithRetry = async () => {
  try {
    await RetryHelper.withRetry(
      (attempt) => {
        logger.log(`Creating ad containers (attempt ${attempt}/${CONTAINER_CREATION_MAX_RETRIES})`);

        containerManager.createAdContainers(tagConfig, adContainers);

        if (adContainers.size > 0) {
          logger.log(`Successfully created ${adContainers.size} ad containers`);
          return Promise.resolve();
        } else {
          throw new Error('No containers created');
        }
      },
      CONTAINER_CREATION_MAX_RETRIES,
      CONTAINER_INITIAL_RETRY_DELAY,
      CONTAINER_MAX_RETRY_DELAY
    );

    await loadAds();
  } catch (error) {
    logger.error(`Failed to create ad containers after ${CONTAINER_CREATION_MAX_RETRIES} attempts`);
  }
};

const createAdContainers = () => {
  containerManager.createAdContainers(tagConfig, adContainers);
};

const loadAds = async () => {
  const loadPromises = Array.from(adContainers.keys()).map(containerId =>
    loadAdForContainer(containerId)
  );

  try {
    await Promise.all(loadPromises);
    logger.log('All ads loaded successfully');
  } catch (error) {
    logger.error('Some ads failed to load:', error);
  }
};

const loadAdForContainer = async (containerId, retryCount = 0) => {
  const container = adContainers.get(containerId);

  if (!container) {
    logger.error(`Container not found: ${containerId}`);
    return;
  }

  const retryDelay = AD_INITIAL_RETRY_DELAY * (retryCount + 1);

  try {
    container.element.innerHTML = '<div class="CoAd-ad-loading">Loading ad...</div>';
    logger.log(`Loading ad for container: ${containerId} (attempt ${retryCount + 1}/${AD_MAX_LOAD_RETRIES + 1})`);

    // TODO: no need to call api here, the adData should already fetched from the api after healthcheck (only call 2 apis: 1 healthcheck, 1 fetch config with ads data)
    // TODO: check if cookie is generated from CoAd Analysis (similar to GA), attach cookie to the Api request to fetch config (if not found, still proceed)
    const adData = await apiClient.loadAd(tagConfig, containerId, container, AD_REQUEST_TIMEOUT);
    logger.log(`Passing to renderAd:`, adData.ad);

    adRenderer.renderAd(tagConfig, containerId, adData.ad, adContainers);
    loadedAds.set(containerId, adData);
    logger.log(`Ad successfully loaded for container: ${containerId}`);

  } catch (error) {
    logger.error(`Failed to load ad for container ${containerId} (attempt ${retryCount + 1}):`, error);

    if (retryCount < AD_MAX_LOAD_RETRIES) {
      logger.log(`Retrying in ${retryDelay}ms...`);
      container.element.innerHTML = `<div class="CoAd-ad-loading">Loading ad... (retry ${retryCount + 1}/${AD_MAX_LOAD_RETRIES})</div>`;

      setTimeout(() => {
        loadAdForContainer(containerId, retryCount + 1);
      }, retryDelay);
    } else {
      container.element.innerHTML = `<div class="CoAd-ad-error">
        Ad failed to load after ${AD_MAX_LOAD_RETRIES + 1} attempts<br>
        <small>Error: ${error.message}</small>
      </div>`;
    }
  }
};

// TODO: remove this logic
const setupAdRefresh = () => {
  if (tagConfig.refreshInterval > 0) {
    setInterval(() => {
      logger.log('Refreshing ads...');
      loadAds();
    }, tagConfig.refreshInterval);
  }
};

// Public API methods
const refreshAds = () => {
  logger.log('Manual ad refresh triggered');
  loadAds();
};

const forceReinitialize = () => {
  logger.log('Force re-initialization triggered');
  isInitialized = false;
  adContainers.clear();
  loadedAds.clear();
  initCoAdTag();
};

const getCoAdTagStatus = () => {
  return {
    initialized: isInitialized,
    containers: adContainers.size,
    loadedAds: loadedAds.size,
    config: tagConfig
  };
};

const destroyCoAdTag = () => {
  logger.log('Destroying CoAd Tag...');

  containerManager.destroy();

  adContainers.forEach((container) => {
    container.element.remove();
  });

  adContainers.clear();
  loadedAds.clear();
  isInitialized = false;
};

(function() {
  'use strict';

  // TODO: 2 mode for production/debug
  window.CoAd = window.CoAd || {};

  // Setup configuration and services
  const config = window.CoAdConfig || {};
  setupCoAdTag(config);

  // Strategy 1: DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInitialization);
  } else if (document.readyState === 'interactive') {
    // Strategy 2: DOM is interactive but not fully loaded
    setTimeout(startInitialization, 500);
  } else {
    // Strategy 3: DOM is fully loaded
    startInitialization();
  }

  // Strategy 4: Window load event (fallback for React apps)
  window.addEventListener('load', () => {
    if (!getCoAdTagStatus().initialized) {
      startInitialization();
    }
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    if (!getCoAdTagStatus().initialized) {
      startInitialization();
    }
  }, 1000);

  // TODO: remove in production
  // Expose Tag methods globally
  window.CoAd.tag = {
    init: initCoAdTag,
    refresh: refreshAds,
    forceReinit: forceReinitialize,
    getStatus: getCoAdTagStatus,
    destroy: destroyCoAdTag
  };

  // TODO: remove in production
  // Expose Tag factory for manual initialization
  window.CoAd.setupCoAdTag = setupCoAdTag;
  window.CoAd.version = COAD_TAG_VERSION;
})();
