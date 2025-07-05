import { DOMUtils, BrowserUtils } from './utils.js';

function createAdContainers(logger, analytics, config, adContainers) {
  const placements = config.placementDetails || config.placements.map(p => ({ selector: p }));
  logger.log('Processing placements:', placements);

  placements.forEach((placementDetail, placementIndex) => {
    try {
      const slotType = placementDetail.slot_type;
      if (slotType === 'catfish') {
        createCatfishAd(logger, analytics, config, placementDetail, adContainers);
        return;
      }

      const placement = placementDetail.selector || placementDetail;
      const elements = document.querySelectorAll(placement);
      logger.log(`Looking for placement: ${placement}, found ${elements.length} elements`);

      if (elements.length === 0) {
        logger.log(`No elements found for selector "${placement}"`);
        return;
      }

      // TODO: TBU on whether we will mount to all matched selector
      elements.forEach((element, elementIndex) => {
        const containerId = `CoAd-ad-${config.publisherId}-${placementIndex}-${elementIndex}`;
        if (adContainers.has(containerId)) {
          logger.log(`Container ${containerId} already exists, skipping`);
          return;
        }

        const adContainer = DOMUtils.createElement('div', {
          id: containerId,
          class: 'CoAd-ad-container',
          'data-placement': placement,
          'data-publisher': config.publisherId,
          ...(placementDetail.slot_type && { 'data-slot-type': placementDetail.slot_type })
        });

        applySlotStyling(logger, adContainer, placementDetail);
        insertAdContainer(logger, adContainer, element, placementDetail);
        adContainers.set(containerId, {
          element: adContainer,
          placement: placement,
          targetElement: element,
          slotType: placementDetail.slot_type,
          placementDetail: placementDetail
        });

        analytics.trackContainerCreated(config, containerId, placement, placementDetail.slot_type);
        logger.log(`Created ad container: ${containerId} for placement: ${placement} (slot: ${placementDetail.slot_type || 'custom'})`);
      });
    } catch (error) {
      logger.error(`Failed to create container for placement ${placementDetail.selector || placementDetail}:`, error);
    }
  });
}

function createCatfishAd(logger, analytics, config, placementDetail, adContainers) {
  const containerId = `CoAd-catfish-${config.publisherId}`;
  if (adContainers.has(containerId)) {
    logger.log('Catfish ad already exists, skipping');
    return;
  }
  logger.log('Creating catfish ad overlay');

  const adContainer = DOMUtils.createElement('div', {
    id: containerId,
    class: 'CoAd-ad-container CoAd-catfish',
    'data-placement': 'catfish-overlay',
    'data-publisher': config.publisherId,
    'data-slot-type': 'catfish'
  });

  applySlotStyling(logger, adContainer, placementDetail);
  document.body.appendChild(adContainer);
  adContainers.set(containerId, {
    element: adContainer,
    placement: 'catfish-overlay',
    targetElement: document.body,
    slotType: 'catfish',
    placementDetail: placementDetail
  });

  analytics.trackContainerCreated(config, containerId, 'catfish-overlay', 'catfish');
  logger.log(`Created catfish ad container: ${containerId}`);
}

function applySlotStyling(logger, container, placementDetail) {
  const slotType = placementDetail.slot_type;

  if (placementDetail.width && placementDetail.height) {
    container.style.width = `${placementDetail.width}px`;
    container.style.height = `${placementDetail.height}px`;
    container.style.minWidth = `${placementDetail.width}px`;
    container.style.minHeight = `${placementDetail.height}px`;
    container.style.maxWidth = `${placementDetail.width}px`;
    container.style.maxHeight = `${placementDetail.height}px`;
    logger.log(`Applied slot dimensions: ${placementDetail.width}x${placementDetail.height} for slot type: ${slotType}`);
  }

  if (slotType === 'catfish') {
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '9999';
    container.style.boxShadow = '0 -4px 20px rgba(0, 0, 0, 0.15)';
    container.style.backgroundColor = '#ffffff';
    container.style.border = '1px solid #e0e0e0';
    container.style.borderBottom = 'none';
    container.style.pointerEvents = 'auto';
  } else if (slotType === 'top') {
    container.style.display = 'block';
    container.style.margin = '10px auto';
    container.style.textAlign = 'center';
  } else if (slotType === 'sidebar') {
    container.style.display = 'block';
    container.style.margin = '10px 0';
  } else if (slotType === 'logo') {
    container.style.display = 'inline-block';
    container.style.verticalAlign = 'middle';
    container.style.margin = '0 10px';
  }

  if (!slotType || slotType !== 'catfish') {
    container.style.backgroundColor = '#f8f9fa';
    container.style.border = '1px solid #dee2e6';
  }
  container.style.borderRadius = '4px';
  container.style.overflow = 'hidden';
  container.style.boxSizing = 'border-box';
}

function insertAdContainer(logger, container, targetElement, placementDetail) {
  const slotType = placementDetail.slot_type;
  if (slotType === 'catfish') {
    logger.log('Catfish container already appended to body');
  } else {
    // TODO: receive insert position from config/api
    targetElement.insertAdjacentElement('afterend', container);
  }
}

function setupDOMObserver(logger, analytics, config, createContainersCallback, loadAdsCallback, domObserver) {
  // TODO: check on document ready instead, ignore dynamic content
  if (!BrowserUtils.supportsMutationObserver()) {
    logger.log('MutationObserver not supported, skipping DOM observation');
    return null;
  }

  const observer = new MutationObserver((mutations) => {
    let shouldCheckForNewElements = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            config.placements.forEach((placement) => {
              if (node.matches && node.matches(placement)) {
                shouldCheckForNewElements = true;
              }
              if (node.querySelector && node.querySelector(placement)) {
                shouldCheckForNewElements = true;
              }
            });
          }
        });
      }
    });

    if (shouldCheckForNewElements) {
      logger.log('DOM changes detected, checking for new ad placement opportunities');
      analytics.trackDOMChange(config, 'new_elements', shouldCheckForNewElements);
      setTimeout(() => {
        createContainersCallback();
        loadAdsCallback();
      }, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  logger.log('DOM observer set up for dynamic content detection');
  return observer;
}

function injectStyles() {
  const styles = `
    .CoAd-ad-container {
      margin: 0;
      text-align: center;
      min-height: 50px;
      position: relative;
      z-index: 999999;
      clear: both;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .CoAd-ad-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 100%;
      margin: 0 auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
      position: relative;
      z-index: 999999;
      background: white;
    }

    .CoAd-ad-wrapper iframe {
      display: block;
      margin: 0 auto;
    }

    .CoAd-ad-wrapper:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .CoAd-ad-loading {
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
      border-radius: 8px;
      border: 2px dashed #ccc;
      animation: pulse 2s infinite;
      position: relative;
      z-index: 999999;
    }

    .CoAd-ad-error {
      padding: 15px;
      color: #e74c3c;
      font-size: 12px;
      background: #ffeaea;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      position: relative;
      z-index: 999999;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    .CoAd-catfish {
      position: fixed !important;
      bottom: 0;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 9999999 !important;
      margin: 0 !important;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2) !important;
      background-color: #ffffff !important;
      border: 1px solid #e0e0e0 !important;
      border-bottom: none !important;
      border-radius: 8px 8px 0 0 !important;
      max-width: 90vw !important;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease !important;
    }

    .CoAd-catfish .CoAd-ad-wrapper {
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    .CoAd-catfish .CoAd-ad-wrapper:hover {
      transform: none !important;
    }

    .CoAd-catfish-toggle-btn {
      position: absolute !important;
      top: 8px !important;
      left: 8px !important;
      width: 32px !important;
      height: 32px !important;
      background: rgba(0, 0, 0, 0.8) !important;
      color: white !important;
      border: 2px solid rgba(255, 255, 255, 0.7) !important;
      border-radius: 50% !important;
      font-size: 14px !important;
      font-weight: bold !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      z-index: 100001 !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4) !important;
      font-family: Arial, sans-serif !important;
      transition: all 0.3s ease !important;
    }

    .CoAd-catfish-toggle-btn:hover {
      transform: scale(1.1) !important;
    }

    @media (max-width: 768px) {
      .CoAd-ad-container {
        margin: 15px 0;
      }

      .CoAd-catfish {
        max-width: 95vw !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
      }
    }
  `;

  DOMUtils.injectStyles(styles);
}

function destroyDOMObserver(domObserver) {
  if (domObserver) {
    domObserver.disconnect();
    return null;
  }
  return domObserver;
}

export function createContainerManager(logger, analytics) {
  let domObserver = null;

  return {
    createAdContainers: (config, adContainers) => createAdContainers(logger, analytics, config, adContainers),
    createCatfishAd: (config, placementDetail, adContainers) => createCatfishAd(logger, analytics, config, placementDetail, adContainers),
    applySlotStyling: (container, placementDetail) => applySlotStyling(logger, container, placementDetail),
    insertAdContainer: (container, targetElement, placementDetail) => insertAdContainer(logger, container, targetElement, placementDetail),
    setupDOMObserver: (config, createContainersCallback, loadAdsCallback) => {
      domObserver = setupDOMObserver(logger, analytics, config, createContainersCallback, loadAdsCallback, domObserver);
    },
    injectStyles: injectStyles,
    destroy: () => {
      domObserver = destroyDOMObserver(domObserver);
    }
  };
}
