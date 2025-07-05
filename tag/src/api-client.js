const checkConnectivity = async (logger, config) => {
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
};

const fetchPublisherConfigById = async (logger, config) => {
  logger.log('Fetching publisher config by id...');
  const response = await fetch(`${config.apiUrl}/bot/config/${config.publisherId}`);

  if (!response.ok) {
    throw new Error(`Failed to load publisher config: ${response.status}`);
  }

  const apiConfig = await response.json();
  logger.log('Publisher config:', apiConfig);

  return apiConfig;
};

const sendErrorLog = async (logger, config, errorMessage) => {
  try {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      publisherId: config.publisherId || null,
      errorMessage: errorMessage
    };

    const response = await fetch(`${config.apiUrl}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    });

    if (!response.ok) {
      logger.error('Failed to send error to API:', response.status, response.statusText);
      return false;
    }

    logger.log('Error successfully sent to API');
    return true;
  } catch (apiError) {
    logger.error('Error logging to API failed:', apiError.message);
    return false;
  }
};

export const createAPIClient = (logger) => {
  return {
    checkConnectivity: (config) => checkConnectivity(logger, config),
    fetchPublisherConfigById: (config) => fetchPublisherConfigById(logger, config),
    sendErrorLog: (config, errorMessage) => sendErrorLog(logger, config, errorMessage)
  };
};
