import { EventDispatcher } from './utils.js';

function trackClick(logger, config, adId, containerId) {
  logger.log(`Ad click: ${adId} in ${containerId}`);

  EventDispatcher.dispatch('CoAd:click', {
    adId,
    containerId,
    publisherId: config.publisherId,
    timestamp: new Date().toISOString()
  });
}

function trackEvent(logger, config, eventName, eventData = {}) {
  logger.log(`Custom event: ${eventName}`, eventData);

  EventDispatcher.dispatch(`CoAd:${eventName}`, {
    ...eventData,
    publisherId: config.publisherId,
    timestamp: new Date().toISOString()
  });
}

function trackContainerCreated(logger, config, containerId, placement, slotType) {
  return trackEvent(logger, config, 'container:created', {
    containerId,
    placement,
    slotType
  });
}

function trackAdLoadSuccess(logger, config, containerId, adId, loadTime) {
  return trackEvent(logger, config, 'ad:load:success', {
    containerId,
    adId,
    loadTime
  });
}

function trackAdLoadFailure(logger, config, containerId, error, attempt) {
  return trackEvent(logger, config, 'ad:load:failure', {
    containerId,
    error: error.message,
    attempt
  });
}

function trackCatfishInteraction(logger, config, action, containerId) {
  return trackEvent(logger, config, 'catfish:interaction', {
    action, // 'minimize', 'expand', 'close'
    containerId
  });
}

function trackDOMChange(logger, config, changeType, elementsFound) {
  return trackEvent(logger, config, 'dom:change', {
    changeType,
    elementsFound
  });
}

function trackPerformance(logger, config, metric, value, context = {}) {
  return trackEvent(logger, config, 'performance', {
    metric,
    value,
    context
  });
}

export function createAnalytics(logger) {
  return {
    trackClick: (config, adId, containerId) => trackClick(logger, config, adId, containerId),
    trackEvent: (config, eventName, eventData) => trackEvent(logger, config, eventName, eventData),
    trackContainerCreated: (config, containerId, placement, slotType) => trackContainerCreated(logger, config, containerId, placement, slotType),
    trackAdLoadSuccess: (config, containerId, adId, loadTime) => trackAdLoadSuccess(logger, config, containerId, adId, loadTime),
    trackAdLoadFailure: (config, containerId, error, attempt) => trackAdLoadFailure(logger, config, containerId, error, attempt),
    trackCatfishInteraction: (config, action, containerId) => trackCatfishInteraction(logger, config, action, containerId),
    trackDOMChange: (config, changeType, elementsFound) => trackDOMChange(logger, config, changeType, elementsFound),
    trackPerformance: (config, metric, value, context) => trackPerformance(logger, config, metric, value, context)
  };
}
