import {
  COAD_TAG_VERSION,
  createConfig
} from './config.js';
import {
  createLogger,
  EventDispatcher,
  URLUtils
} from './utils.js';
import { createAPIClient } from './api-client.js';
import { createAnalytics } from './analytics.js';
import { createAdRenderer } from './ad-renderer.js';
import { createContainerManager } from './container-manager.js';

let tagConfig = null;
let logger = null;
let apiClient = null;
let analytics = null;
let adRenderer = null;
let containerManager = null;
let adContainers = new Map();
let loadedAds = new Map();
let isInitialized = false;
let initializationAttempted = false;
let initStartTime = null;

const setupCoAdTag = (config) => {
  const publisherIdFromURL = URLUtils.getPublisherIdFromScriptURL();
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

  logger.log('Configuration setup complete', tagConfig);
};

const initCoAdTag = async () => {
  if (isInitialized) {
    logger.log('Already initialized');
    return;
  }

  initStartTime = Date.now();

  await apiClient.checkConnectivity(tagConfig);
  if (!tagConfig.publisherId) {
    throw new Error('Publisher ID is required. Please ensure the script tag includes ?publisherId=your-publisher-id parameter.');
  }

  const apiConfig = await apiClient.fetchPublisherConfigById(tagConfig);
  Object.assign(tagConfig, apiConfig);
  if (!tagConfig.publisherId) {
    throw new Error('Unable to get Publisher ID. Please register this website in the CoAd Publisher Dashboard');
  }

  await createAdContainers();
  containerManager.injectStyles();
  containerManager.setupDOMObserver(
    tagConfig,
    () => containerManager.createAdContainers(tagConfig, adContainers),
    () => loadAds()
  );

  isInitialized = true;
  logger.log('CoAd Tag initialized successfully');

  EventDispatcher.dispatch('CoAd:initialized', {
    coadTag: {
      init: initCoAdTag,
      forceReinit: forceReinitialize,
      getStatus: getCoAdTagStatus,
      destroy: destroyCoAdTag
    }
  });
};

const createAdContainers = async () => {
  logger.log('Creating ad containers');
  containerManager.createAdContainers(tagConfig, adContainers);

  if (adContainers.size > 0) {
    logger.log(`Successfully created ${adContainers.size} ad containers`);
    await loadAds();
  } else {
    throw new Error('No containers created');
  }
};

const loadAds = async () => {
  const loadPromises = Array.from(adContainers.keys()).map(containerId =>
    loadAdForContainer(containerId)
  );

  await Promise.all(loadPromises);
  logger.log('All ads loaded successfully');
};

const loadAdForContainer = async (containerId) => {
  const container = adContainers.get(containerId);
  if (!container) {
    throw new Error(`Container not found: ${containerId}`);
  }

  // Keep try-catch here for individual ad loading - we want to handle ad failures gracefully
  // without breaking the entire initialization process
  try {
    container.element.innerHTML = '<div class="CoAd-ad-loading">Loading ad...</div>';
    const adData = tagConfig.adsData && tagConfig.adsData[container.placement];
    if (!adData) {
      throw new Error(`No ad data found for placement: ${container.placement}`);
    }

    adRenderer.renderAd(tagConfig, containerId, adData, adContainers);
    loadedAds.set(containerId, { ad: adData, success: true });
    logger.log(`Ad successfully loaded for container: ${containerId}`);
  } catch (error) {
    // Individual ad failures should be handled gracefully
    logger.error(`Failed to load ad for container ${containerId}:`, error);
    analytics.trackAdLoadFailure(tagConfig, containerId, error);

    container.element.innerHTML = `<div class="CoAd-ad-error">
      Ad failed to load<br>
      <small>Error: ${error.message}</small>
    </div>`;
  }
};

const forceReinitialize = async () => {
  logger.log('Force re-initialization triggered');
  isInitialized = false;
  initializationAttempted = false; // Reset the attempt flag for force reinit
  adContainers.clear();
  loadedAds.clear();

  try {
    await initCoAdTag();
  } catch (error) {
    logger.error('Force re-initialization failed:', error);

    // Send error to API if possible
    if (apiClient && tagConfig) {
      try {
        await apiClient.sendErrorLog(tagConfig, error.message);
      } catch (logError) {
        logger.error('Failed to send error log:', logError);
      }
    }
  }
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

(() => {
  'use strict';

  // Centralized error handling wrapper
  const safeInitialize = async () => {
    // Prevent multiple initialization attempts
    if (isInitialized || initializationAttempted) {
      return;
    }

    initializationAttempted = true;

    try {
      await initCoAdTag();
    } catch (error) {
      logger.error('CoAd Tag initialization failed:', error);

      // Send error to API if possible
      if (apiClient && tagConfig) {
        try {
          await apiClient.sendErrorLog(tagConfig, error.message);
        } catch (logError) {
          logger.error('Failed to send error log:', logError);
        }
      }
    }
  };

  // TODO: 2 mode for production/debug
  window.CoAd = window.CoAd || {};

  const config = window.CoAdConfig || {};
  setupCoAdTag(config);

  // Strategy 1: DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialize);
  } else if (document.readyState === 'interactive') {
    // Strategy 2: DOM is interactive but not fully loaded
    setTimeout(safeInitialize, 500);
  } else {
    // Strategy 3: DOM is fully loaded
    safeInitialize();
  }

  // Strategy 4: Window load event (fallback for React apps)
  window.addEventListener('load', () => {
    safeInitialize();
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    safeInitialize();
  }, 1000);

  // TODO: remove in production
  // Expose Tag methods globally
  window.CoAd.tag = {
    init: initCoAdTag,
    forceReinit: forceReinitialize,
    getStatus: getCoAdTagStatus,
    destroy: destroyCoAdTag
  };

  // TODO: remove in production
  // Expose Tag factory for manual initialization
  window.CoAd.setupCoAdTag = setupCoAdTag;
  window.CoAd.version = COAD_TAG_VERSION;
})();
