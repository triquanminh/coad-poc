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
  RetryHelper
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

function initializeCoAdTag(config) {
  tagConfig = createConfig(config);
  logger = createLogger(tagConfig);
  apiClient = createAPIClient(logger);
  analytics = createAnalytics(logger);
  adRenderer = createAdRenderer(logger, analytics);
  containerManager = createContainerManager(logger, analytics);

  logger.log('Initialized', tagConfig);
}

async function initCoAdTag() {
  if (isInitialized) {
    logger.log('Already initialized');
    return;
  }

  initStartTime = Date.now();

  try {
    await apiClient.checkConnectivity(tagConfig);

    let apiConfig;
    // TODO: get publisher ID based on params of coad tag's URL instead
    if (!tagConfig.publisherId) {
      logger.log('No Publisher ID provided, fetching publisher config by domain...');
      apiConfig = await apiClient.fetchPublisherConfigByDomain(tagConfig);
    } else {
      logger.log(`Publisher ID provided: ${tagConfig.publisherId}, fetching publisher config by id...`);
      apiConfig = await apiClient.fetchPublisherConfigById(tagConfig);
    }

    Object.assign(tagConfig, apiConfig);

    if (!tagConfig.publisherId) {
      throw new Error('Unable to determine Publisher ID. Please register this website in the CoAd Publisher Dashboard');
    }

    logger.log('Publisher config:', tagConfig);

    await createAdContainersWithRetry();
    setupAdRefresh();
    containerManager.injectStyles();
    containerManager.setupDOMObserver(
      tagConfig,
      () => createAdContainers(),
      () => loadAds()
    );

    isInitialized = true;
    logger.log('Initialized successfully');

    analytics.trackInitialization(tagConfig, true, Date.now() - initStartTime);
    EventDispatcher.dispatch('CoAd:initialized', { coadTag: getCoAdTagAPI() });
  } catch (error) {
    analytics.trackInitialization(tagConfig, false, Date.now() - initStartTime, error);
    logger.error('Failed to initialize:', error);
    throw error;
  }
}

async function createAdContainersWithRetry() {
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
}

function createAdContainers() {
  containerManager.createAdContainers(tagConfig, adContainers);
}

async function loadAds() {
  const loadPromises = Array.from(adContainers.keys()).map(containerId =>
    loadAdForContainer(containerId)
  );

  try {
    await Promise.all(loadPromises);
    logger.log('All ads loaded successfully');
  } catch (error) {
    logger.error('Some ads failed to load:', error);
  }
}

async function loadAdForContainer(containerId, retryCount = 0) {
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
}

// TODO: remove this logic
function setupAdRefresh() {
  if (tagConfig.refreshInterval > 0) {
    setInterval(() => {
      logger.log('Refreshing ads...');
      loadAds();
    }, tagConfig.refreshInterval);
  }
}

// Public API methods
function refreshAds() {
  logger.log('Manual ad refresh triggered');
  loadAds();
}

function forceReinitialize() {
  logger.log('Force re-initialization triggered');
  isInitialized = false;
  adContainers.clear();
  loadedAds.clear();
  initCoAdTag();
}

function getCoAdTagStatus() {
  return {
    initialized: isInitialized,
    containers: adContainers.size,
    loadedAds: loadedAds.size,
    config: tagConfig
  };
}

function destroyCoAdTag() {
  logger.log('Destroying CoAd Tag...');

  containerManager.destroy();

  adContainers.forEach((container) => {
    container.element.remove();
  });

  adContainers.clear();
  loadedAds.clear();
  isInitialized = false;
}

function getCoAdTagAPI() {
  return {
    init: initCoAdTag,
    refresh: refreshAds,
    forceReinit: forceReinitialize,
    getStatus: getCoAdTagStatus,
    destroy: destroyCoAdTag
  };
}

(function() {
  'use strict';

  // TODO: 2 mode for production/debug
  window.CoAd = window.CoAd || {};

  // Auto-initialize with or without configuration
  const config = window.CoAdConfig || {};
  initializeCoAdTag(config);
  const coadTag = getCoAdTagAPI();

  // Initialize Tag with error handling and retry logic
  const initializeTag = () => {
    coadTag.init().catch(error => {
      console.error('[CoAd Tag] Initialization failed:', error);
      console.error('[CoAd Tag] Error details:', error.message);

      // If it's a registration error, show helpful message
      if (error.message.includes('not registered')) {
        console.warn('[CoAd Tag] To fix this: Register your website at the CoAd publisher dashboard');
        console.warn('[CoAd Tag] Current domain:', window.location.hostname);
        console.warn('[CoAd Tag] Current URL:', window.location.origin);
      }

      // Don't retry for registration errors
      if (!error.message.includes('not registered')) {
        setTimeout(() => initializeTag(), 2000);
      }
    });
  };

  // Strategy 1: DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTag);
  } else if (document.readyState === 'interactive') {
    // Strategy 2: DOM is interactive but not fully loaded
    setTimeout(initializeTag, 500);
  } else {
    // Strategy 3: DOM is fully loaded
    initializeTag();
  }

  // Strategy 4: Window load event (fallback for React apps)
  window.addEventListener('load', () => {
    if (!coadTag.getStatus().initialized) {
      initializeTag();
    }
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    if (!coadTag.getStatus().initialized) {
      initializeTag();
    }
  }, 1000);

  // TODO: remove in production
  // Expose Tag instance globally
  window.CoAd.tag = coadTag;

  // TODO: remove in production
  // Expose Tag factory for manual initialization
  window.CoAd.initializeCoAdTag = initializeCoAdTag;
  window.CoAd.version = COAD_TAG_VERSION;
})();
