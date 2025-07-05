import { URLUtils, BrowserUtils } from './utils.js';

async function checkConnectivity(logger, config) {
  try {
    logger.log('Health checking Ad Serving Engine...');
    // TODO: Update Ad Serving Engine health check endpoint
    const response = await fetch(`${config.apiUrl.replace('/api', '')}/health`, {
      method: 'GET', // TODO: change to OPTION
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      logger.log('Health check Ad Serving Engine success');
    } else {
      throw new Error(`Health check Ad Serving Engine failed: ${response.status}`);
    }
  } catch (error) {
    logger.error('Health check Ad Serving Engine failed:', error);
    throw new Error(`Cannot connect to Ad Serving Engine at ${config.apiUrl}`);
  }
}

async function fetchPublisherConfigById(logger, config) {
  try {
    logger.log('Fetching publisher config by id...');
    // TODO: Update Ad Serving Engine API path to get publisher's config by id
    const response = await fetch(`${config.apiUrl}/bot/config/${config.publisherId}`);

    if (!response.ok) {
      throw new Error(`Failed to load publisher config: ${response.status}`);
    }

    const apiConfig = await response.json();
    logger.log('Publisher config:', apiConfig);

    return apiConfig;
  } catch (error) {
    logger.error('Failed to fetch publisher config by id:', error);
    throw error;
  }
}

// Note: loadAd function removed - ads data is now fetched as part of fetchPublisherConfigById
// This eliminates the need for separate API calls for each ad placement

async function sendErrorLog(config, errorArgs, sdkInstance) {
  try {
    if (!config.apiUrl || errorArgs.some(arg =>
      typeof arg === 'string' && arg.includes('Failed to send error log')
    )) {
      return;
    }

    let errorMessage = '';
    let stackTrace = '';
    let errorType = 'SDK_ERROR';
    let additionalData = {};

    errorArgs.forEach((arg, index) => {
      if (typeof arg === 'string') {
        if (index === 0) {
          errorMessage = arg;
        } else {
          errorMessage += ' ' + arg;
        }
      } else if (arg instanceof Error) {
        errorMessage += ' ' + arg.message;
        stackTrace = arg.stack || '';
        errorType = arg.name || 'Error';
      } else if (typeof arg === 'object') {
        additionalData = { ...additionalData, ...arg };
      }
    });

    const errorLogData = {
      publisherId: config.publisherId || null,
      errorType,
      errorMessage: errorMessage.trim(),
      stackTrace,
      url: URLUtils.getCurrentURL(),
      userAgent: BrowserUtils.getUserAgent(),
      sdkConfig: {
        apiUrl: config.apiUrl,
        publisherId: config.publisherId,
        debug: config.debug,
        initialized: sdkInstance.isInitialized,
        containersCount: sdkInstance.adContainers.size,
        loadedAdsCount: sdkInstance.loadedAds.size
      },
      additionalData: {
        timestamp: new Date().toISOString(),
        windowSize: BrowserUtils.getWindowSize(),
        ...additionalData
      }
    };

    const response = await fetch(`${config.apiUrl}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(errorLogData)
    });

    if (!response.ok) {
      console.warn('[CoAd SDK] Failed to send error log:', response.status, response.statusText);
    } else {
      const result = await response.json();
      if (config.debug) {
        console.log('[CoAd SDK] Error logged with ID:', result.errorLogId);
      }
    }

  } catch (logError) {
    console.warn('[CoAd SDK] Failed to send error log:', logError.message);
  }
}

export function createAPIClient(logger) {
  return {
    checkConnectivity: (config) => checkConnectivity(logger, config),
    fetchPublisherConfigById: (config) => fetchPublisherConfigById(logger, config),
    sendErrorLog: sendErrorLog
  };
}
