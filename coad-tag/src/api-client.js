async function checkConnectivity(logger, config) {
  try {
    logger.log('Health checking Ad Serving Engine...');
    const response = await fetch(`${config.apiUrl.replace('/api', '')}/health`, {
      method: 'OPTIONS',
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

export function createAPIClient(logger) {
  return {
    checkConnectivity: (config) => checkConnectivity(logger, config),
    fetchPublisherConfigById: (config) => fetchPublisherConfigById(logger, config),
  };
}
