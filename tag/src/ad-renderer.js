const renderAd = (logger, analytics, config, containerId, adData, adContainers) => {
  const container = adContainers.get(containerId);

  if (!container || !adData) {
    return;
  }

  const width = adData.width || 300;
  const height = adData.height || 250;
  const slotType = adData.slotType || container.slotType || 'custom';

  logger.log(`Rendering ad for slot type: ${slotType}, dimensions: ${width}x${height}`);
  logger.log(`Checking ad data properties:`, {
    hasImageUrl: !!adData.imageUrl,
    hasTitle: !!adData.title,
    hasClickUrl: !!adData.clickUrl,
    imageUrl: adData.imageUrl,
    title: adData.title,
    clickUrl: adData.clickUrl
  });

  const iframe = createAdIframe(adData, width, height);
  const adContent = createAdContent(adData, width, height);

  iframe.addEventListener('load', () => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(adContent);
    iframeDoc.close();

    iframeDoc.addEventListener('click', () => {
      analytics.trackClick(config, adData.id, containerId);
    });
  });

  container.element.innerHTML = '';
  container.element.appendChild(iframe);

  if (slotType === 'catfish') {
    logger.log('Adding toggle button to catfish ad after rendering');
    addCatfishToggleButton(logger, analytics, config, container.element);
  }
};

const createAdIframe = (adData, width, height) => {
  const iframe = document.createElement('iframe');
  iframe.className = 'CoAd-ad-iframe';
  iframe.setAttribute('data-ad-id', adData.id);
  iframe.setAttribute('data-ad-type', adData.type || 'banner');
  iframe.setAttribute('width', width.toString());
  iframe.setAttribute('height', height.toString());
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('title', adData.title || 'Advertisement');
  iframe.setAttribute('loading', 'lazy');

  iframe.style.cssText = `
    width: ${width}px;
    height: ${height}px;
    border: none;
    display: block;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 100%;
  `;

  return iframe;
};

const createAdContent = (adData, width, height) => {
  const trackingPixelHtml = adData.trackingPixel
    ? `<img src="${adData.trackingPixel}" width="1" height="1" style="display:none;" alt="." />`
    : '';

  // TODO: check if the body, head tag can be removed
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }
        .ad-container {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ad-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .ad-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          color: white;
          padding: 8px 12px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
        .ad-container:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
        .ad-info-icon {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: bold;
          color: #333;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.2s ease;
          border: 2px solid rgba(0,0,0,0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .ad-info-icon:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body onclick="handleAdClick(event)">
      <div class="ad-container">
        <img src="${adData.imageUrl}" alt="${adData.title}" class="ad-image">
        <div class="ad-overlay">${adData.title}</div>
        <div class="ad-info-icon" onclick="toggleInfo(event)">i</div>
      </div>
      ${trackingPixelHtml}

      <script>
        function toggleInfo(event) {
          event.stopPropagation();
          alert('Advertisement by CoAd\\n\\nThis ad helps support the website you\\'re visiting.');
        }

        function handleAdClick(event) {
          if (event.target.closest('.ad-info-icon')) {
            return;
          }
          window.open('${adData.clickUrl}', '_blank');
        }
      </script>
    </body>
    </html>
  `;
}

/*
The behavior of each ad types:
TODO: CatFish should open the target advertiser websites when first click on minimize
The instruction should be defined by API (number of seconds, delay, ...)
 */
const addCatfishToggleButton = (logger, analytics, config, container) => {
  logger.log('Creating catfish toggle button for container:', container.id);
  let isMinimized = false;

  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '▼';
  toggleBtn.className = 'CoAd-catfish-toggle-btn';

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isMinimized) {
      container.style.transition = 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.bottom = '-110px';
      toggleBtn.innerHTML = '▲';
      toggleBtn.style.background = 'rgba(69, 183, 209, 0.9)';
      isMinimized = true;
      analytics.trackCatfishInteraction(config, 'minimize', container.id);
      logger.log('Catfish ad minimized by user');
    } else {
      container.style.transition = 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.bottom = '0';
      toggleBtn.innerHTML = '▼';
      toggleBtn.style.background = 'rgba(0, 0, 0, 0.8)';
      isMinimized = false;
      analytics.trackCatfishInteraction(config, 'expand', container.id);
      logger.log('Catfish ad expanded by user');
    }
  });

  toggleBtn.addEventListener('mouseenter', () => {
    if (!isMinimized) {
      toggleBtn.style.backgroundColor = 'rgba(0, 0, 0, 1)';
    } else {
      toggleBtn.style.backgroundColor = 'rgba(69, 183, 209, 1)';
    }
  });

  toggleBtn.addEventListener('mouseleave', () => {
    if (!isMinimized) {
      toggleBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    } else {
      toggleBtn.style.backgroundColor = 'rgba(69, 183, 209, 0.9)';
    }
  });

  container.style.position = 'relative';
  container.appendChild(toggleBtn);

  logger.log('Catfish toggle button added successfully');
}

export const createAdRenderer = (logger, analytics) => {
  return {
    renderAd: (config, containerId, adData, adContainers) => renderAd(logger, analytics, config, containerId, adData, adContainers),
    createAdIframe: createAdIframe,
    createAdContent: createAdContent,
    addCatfishToggleButton: (config, container) => addCatfishToggleButton(logger, analytics, config, container)
  };
};
