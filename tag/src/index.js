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
  try {
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
  } catch (error) {
    logger.error('Failed to initialize:', error);
  }
};

const createAdContainers = async () => {
  try {
    logger.log('Creating ad containers');
    containerManager.createAdContainers(tagConfig, adContainers);

    if (adContainers.size > 0) {
      logger.log(`Successfully created ${adContainers.size} ad containers`);
      await loadAds();
    } else {
      logger.error('No containers created');
    }
  } catch (error) {
    logger.error('Failed to create ad containers:', error);
  }
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

const loadAdForContainer = async (containerId) => {
  const container = adContainers.get(containerId);
  if (!container) {
    logger.error(`Container not found: ${containerId}`);
    return;
  }

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
    logger.error(`Failed to load ad for container ${containerId}:`, error);
    analytics.trackAdLoadFailure(tagConfig, containerId, error);

    container.element.innerHTML = `<div class="CoAd-ad-error">
      Ad failed to load<br>
      <small>Error: ${error.message}</small>
    </div>`;
  }
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

(() => {
  'use strict';

  // TODO: 2 mode for production/debug
  window.CoAd = window.CoAd || {};

  const config = window.CoAdConfig || {};
  setupCoAdTag(config);

  // Strategy 1: DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoAdTag);
  } else if (document.readyState === 'interactive') {
    // Strategy 2: DOM is interactive but not fully loaded
    setTimeout(initCoAdTag, 500);
  } else {
    // Strategy 3: DOM is fully loaded
    initCoAdTag();
  }

  // Strategy 4: Window load event (fallback for React apps)
  window.addEventListener('load', () => {
    if (!getCoAdTagStatus().initialized) {
      initCoAdTag();
    }
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    if (!getCoAdTagStatus().initialized) {
      initCoAdTag();
    }
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
