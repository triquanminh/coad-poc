(function() {
  'use strict';

  const SDK_VERSION = '0.1';
  const API_BASE_URL = 'http://localhost:8080/api'; // TODO: Update Ad Serving Engine API url
  
  const CONTAINER_CREATION_MAX_RETRIES = 5;
  const CONTAINER_INITIAL_RETRY_DELAY = 1000;
  const CONTAINER_MAX_RETRY_DELAY = 5000;

  const AD_REFRESH_INTERVAL = 10000; // TODO: Update ad refresh interval
  const AD_REQUEST_TIMEOUT = 5000;
  const AD_MAX_LOAD_RETRIES = 3;
  const AD_INITIAL_RETRY_DELAY = 1000;

  window.CoAd = window.CoAd || {};

  class CoAdSDK {
    constructor(config) {
      this.config = {
        publisherId: config.publisherId || null,
        website: config.website || window.location.origin,
        placements: config.placements || [],
        apiUrl: config.apiUrl || API_BASE_URL,
        refreshInterval: config.refreshInterval || AD_REFRESH_INTERVAL,
        debug: config.debug || false,
        ...config
      };

      this.adContainers = new Map();
      this.loadedAds = new Map();
      this.isInitialized = false;

      this.log('Initialized', this.config);
    }

    async init() {
      if (this.isInitialized) {
        this.log('Already initialized');
        return;
      }

      try {
        this.log('Initializing...');
        await this.checkAPIConnectivity();

        if (!this.config.publisherId) {
          this.log('No Publisher ID provided, fetching publisher config by domain...');
          await this.fetchPublisherConfigByDomain();
        } else {
          this.log(`Publisher ID provided: ${this.config.publisherId}, fetching publisher config by id...`);
          await this.fetchPublisherConfigById();
        }

        if (!this.config.publisherId) {
          throw new Error('Unable to determine Publisher ID. Please register this website in the CoAd Publisher Dashboard');
        }

        await this.createAdContainersWithRetry();
        this.setupAdRefresh();
        this.injectStyles();
        this.setupDOMObserver();

        this.isInitialized = true;
        this.log('Initialized successfully');

        this.dispatchEvent('CoAd:initialized', { sdk: this });
      } catch (error) {
        this.error('Failed to initialize:', error);
        throw error;
      }
    }

    async checkAPIConnectivity() {
      try {
        this.log('Checking API connectivity...');
        // TODO: Update Ad Serving Engine health check endpoint
        const response = await fetch(`${this.config.apiUrl.replace('/api', '')}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          this.log('Health check Ad Serving Engine success');
        } else {
          throw new Error(`Health check Ad Serving Engine success failed: ${response.status}`);
        }
      } catch (error) {
        this.error('Health check Ad Serving Engine failed:', error);
        throw new Error(`Cannot connect to Ad Serving Engine at ${this.config.apiUrl}`);
      }
    }

    async fetchPublisherConfigByDomain() {
      try {
        this.log('Fetching publisher config by domain...');
        this.log('Current domain:', window.location.hostname);
        this.log('Current URL:', window.location.origin);

        // TODO: Update query params to call Ad Serving Engine API
        const params = new URLSearchParams({
          domain: window.location.hostname,
          url: window.location.origin
        });

        // TODO: Update Ad Serving Engine API path to get publisher's config by domain
        const response = await fetch(`${this.config.apiUrl}/bot/config-by-domain?${params}`);

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json();
            throw new Error(`Website not registered: ${errorData.error}. ${errorData.suggestion || ''}`);
          }
          throw new Error(`Failed to fetch publisher config by domain: ${response.status}`);
        }

        const config = await response.json();
        this.config = { ...this.config, ...config };

        this.log('Publisher config:', config);
        this.log(`Matched by: ${config.matchedBy}, Publisher ID: ${config.publisherId}`);

      } catch (error) {
        this.error('Failed to fetch publisher config by domain:', error);
        throw error;
      }
    }

    async fetchPublisherConfigById() {
      try {
        this.log('Fetching publisher config by id...');
        // TODO: Update Ad Serving Engine API path to get publisher's config by id
        const response = await fetch(`${this.config.apiUrl}/bot/config/${this.config.publisherId}`);

        if (!response.ok) {
          throw new Error(`Failed to load publisher config: ${response.status}`);
        }

        const config = await response.json();
        this.config = { ...this.config, ...config };

        this.log('Publisher config:', config);
      } catch (error) {
        this.error('Failed to fetch publisher config by id:', error);
      }
    }

    async createAdContainersWithRetry(maxRetries = CONTAINER_CREATION_MAX_RETRIES, delay = CONTAINER_INITIAL_RETRY_DELAY) {
      let attempt = 0;

      while (attempt < maxRetries) {
        attempt++;
        this.log(`Creating ad containers (attempt ${attempt}/${maxRetries})`);

        this.createAdContainers();

        if (this.adContainers.size > 0) {
          this.log(`Successfully created ${this.adContainers.size} ad containers`);
          await this.loadAds();
          return;
        }

        if (attempt < maxRetries) {
          this.log(`No containers created, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, CONTAINER_MAX_RETRY_DELAY);
        }
      }

      this.error(`Failed to create ad containers after ${maxRetries} attempts`);
    }

    createAdContainers() {
      const placements = this.config.placementDetails || this.config.placements.map(p => ({ selector: p }));

      this.log('Processing placements:', placements);

      placements.forEach((placementDetail, placementIndex) => {
        try {
          const slotType = placementDetail.slot_type;

          if (slotType === 'catfish') {
            this.createCatfishAd(placementDetail, placementIndex);
            return;
          }

          const placement = placementDetail.selector || placementDetail;
          const elements = document.querySelectorAll(placement);
          this.log(`Looking for placement: ${placement}, found ${elements.length} elements`);

          if (elements.length === 0) {
            this.log(`No elements found for selector "${placement}"`);
            return;
          }

          elements.forEach((element, elementIndex) => {
            const containerId = `CoAd-ad-${this.config.publisherId}-${placementIndex}-${elementIndex}`;

            if (this.adContainers.has(containerId)) {
              this.log(`Container ${containerId} already exists, skipping`);
              return;
            }

            const adContainer = document.createElement('div');
            adContainer.id = containerId;
            adContainer.className = 'CoAd-ad-container';
            adContainer.setAttribute('data-placement', placement);
            adContainer.setAttribute('data-publisher', this.config.publisherId);

            if (placementDetail.slot_type) {
              adContainer.setAttribute('data-slot-type', placementDetail.slot_type);
            }

            this.applySlotStyling(adContainer, placementDetail);
            this.insertAdContainer(adContainer, element, placementDetail);
            this.adContainers.set(containerId, {
              element: adContainer,
              placement: placement,
              targetElement: element,
              slotType: placementDetail.slot_type,
              placementDetail: placementDetail
            });

            this.log(`Created ad container: ${containerId} for placement: ${placement} (slot: ${placementDetail.slot_type || 'custom'})`);
          });
        } catch (error) {
          this.error(`Failed to create container for placement ${placementDetail.selector || placementDetail}:`, error);
        }
      });
    }

    createCatfishAd(placementDetail, placementIndex) {
      const containerId = `CoAd-catfish-${this.config.publisherId}`;

      if (this.adContainers.has(containerId)) {
        this.log('Catfish ad already exists, skipping');
        return;
      }

      this.log('Creating catfish ad overlay');

      const adContainer = document.createElement('div');
      adContainer.id = containerId;
      adContainer.className = 'CoAd-ad-container CoAd-catfish';
      adContainer.setAttribute('data-placement', 'catfish-overlay');
      adContainer.setAttribute('data-publisher', this.config.publisherId);
      adContainer.setAttribute('data-slot-type', 'catfish');

      this.applySlotStyling(adContainer, placementDetail);

      document.body.appendChild(adContainer);

      this.adContainers.set(containerId, {
        element: adContainer,
        placement: 'catfish-overlay',
        targetElement: document.body,
        slotType: 'catfish',
        placementDetail: placementDetail
      });

      this.log(`Created catfish ad container: ${containerId}`);
    }

    applySlotStyling(container, placementDetail) {
      const slotType = placementDetail.slot_type;

      if (placementDetail.width && placementDetail.height) {
        container.style.width = `${placementDetail.width}px`;
        container.style.height = `${placementDetail.height}px`;
        container.style.minWidth = `${placementDetail.width}px`;
        container.style.minHeight = `${placementDetail.height}px`;
        container.style.maxWidth = `${placementDetail.width}px`;
        container.style.maxHeight = `${placementDetail.height}px`;

        this.log(`Applied slot dimensions: ${placementDetail.width}x${placementDetail.height} for slot type: ${slotType}`);
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

    insertAdContainer(container, targetElement, placementDetail) {
      const slotType = placementDetail.slot_type;

      if (slotType === 'catfish') {
        this.log('Catfish container already appended to body');
      } else {
        targetElement.insertAdjacentElement('afterend', container);
      }
    }



    async loadAds() {
      const loadPromises = Array.from(this.adContainers.keys()).map(containerId => 
        this.loadAdForContainer(containerId)
      );

      try {
        await Promise.all(loadPromises);
        this.log('All ads loaded successfully');
      } catch (error) {
        this.error('Some ads failed to load:', error);
      }
    }

    async loadAdForContainer(containerId, retryCount = 0) {
      const container = this.adContainers.get(containerId);

      if (!container) {
        this.error(`Container not found: ${containerId}`);
        return;
      }

      const retryDelay = AD_INITIAL_RETRY_DELAY * (retryCount + 1);

      try {
        container.element.innerHTML = '<div class="CoAd-ad-loading">Loading ad...</div>';
        this.log(`Loading ad for container: ${containerId} (attempt ${retryCount + 1}/${AD_MAX_LOAD_RETRIES + 1})`);

        // TODO: Update Ad Serving Engine API path to get ads
        const adUrl = `${this.config.apiUrl}/ads?publisherId=${encodeURIComponent(this.config.publisherId)}&placement=${encodeURIComponent(container.placement)}`;
        this.log(`Fetching ad from: ${adUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AD_REQUEST_TIMEOUT);

        const response = await fetch(adUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        this.log(`Ad request response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const adData = await response.json();
        if (!adData.success || !adData.ad) {
          throw new Error('Invalid ad data received');
        }
        this.log(`Ad data received:`, adData);
        this.log(`Passing to renderAd:`, adData.ad);

        this.renderAd(containerId, adData.ad);
        this.loadedAds.set(containerId, adData);
        this.log(`Ad successfully loaded for container: ${containerId}`);

      } catch (error) {
        this.error(`Failed to load ad for container ${containerId} (attempt ${retryCount + 1}):`, error);

        if (retryCount < AD_MAX_LOAD_RETRIES) {
          this.log(`Retrying in ${retryDelay}ms...`);
          container.element.innerHTML = `<div class="CoAd-ad-loading">Loading ad... (retry ${retryCount + 1}/${AD_MAX_LOAD_RETRIES})</div>`;

          setTimeout(() => {
            this.loadAdForContainer(containerId, retryCount + 1);
          }, retryDelay);
        } else {
          container.element.innerHTML = `<div class="CoAd-ad-error">
            Ad failed to load after ${AD_MAX_LOAD_RETRIES + 1} attempts<br>
            <small>Error: ${error.message}</small>
          </div>`;
        }
      }
    }

    renderAd(containerId, adData) {
      const container = this.adContainers.get(containerId);

      if (!container || !adData) {
        return;
      }

      const width = adData.width || 300;
      const height = adData.height || 250;
      const slotType = adData.slotType || container.slotType || 'custom';

      this.log(`Rendering ad for slot type: ${slotType}, dimensions: ${width}x${height}`);
      this.log(`Ad data received:`, adData);
      this.log(`Checking ad data properties:`, {
        hasImageUrl: !!adData.imageUrl,
        hasTitle: !!adData.title,
        hasClickUrl: !!adData.clickUrl,
        imageUrl: adData.imageUrl,
        title: adData.title,
        clickUrl: adData.clickUrl
      });

      const iframe = this.createAdIframe(adData, width, height);
      const adContent = this.createAdContent(adData, slotType, width, height);

      iframe.addEventListener('load', () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(adContent);
        iframeDoc.close();

        iframeDoc.addEventListener('click', () => {
          this.trackAdClick(adData.id, containerId);
        });
      });

      container.element.innerHTML = '';
      container.element.appendChild(iframe);

      if (slotType === 'catfish') {
        this.log('Adding toggle button to catfish ad after rendering');
        this.addCatfishToggleButton(container.element);
      }

      // TODO: remove this logic, replace Ad impression with pixel tracking in ad's iframe
      this.trackAdImpression(adData.id, containerId);
    }

    addCatfishToggleButton(container) {
      this.log('Creating catfish toggle button for container:', container.id);
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
          this.log('Catfish ad minimized by user');
        } else {
          container.style.transition = 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          container.style.bottom = '0';
          toggleBtn.innerHTML = '▼';
          toggleBtn.style.background = 'rgba(0, 0, 0, 0.8)';
          isMinimized = false;
          this.log('Catfish ad expanded by user');
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

      // Ensure container can hold positioned elements
      container.style.position = 'relative';
      container.appendChild(toggleBtn);

      this.log('Catfish toggle button added successfully');
    }

    createAdIframe(adData, width, height) {
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
    }

    createAdContent(adData, slotType, width, height) {
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



    showAdInfo() {
      alert('Advertisement by CoAd\n\nThis ad helps support the website you\'re visiting. Click here to provide feedback about this ad.');
    }

    trackAdImpression(adId, containerId) {
      this.log(`Ad impression: ${adId} in ${containerId}`);
      
      this.dispatchEvent('CoAd:impression', {
        adId,
        containerId,
        publisherId: this.config.publisherId,
        timestamp: new Date().toISOString()
      });
    }

    // TODO: update this logic to properly handle ad clicks
    trackAdClick(adId, containerId) {
      this.log(`Ad click: ${adId} in ${containerId}`);
      
      this.dispatchEvent('CoAd:click', {
        adId,
        containerId,
        publisherId: this.config.publisherId,
        timestamp: new Date().toISOString()
      });
    }

    // Watches for new elements being added to the page that might match ad placement selectors
    setupDOMObserver() {
      if (!window.MutationObserver) {
        this.log('MutationObserver not supported, skipping DOM observation');
        return;
      }

      this.domObserver = new MutationObserver((mutations) => {
        let shouldCheckForNewElements = false;

        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.config.placements.forEach((placement) => {
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
          this.log('DOM changes detected, checking for new ad placement opportunities');
          setTimeout(() => {
            this.createAdContainers();
            this.loadAds();
          }, 100);
        }
      });

      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      this.log('DOM observer set up for dynamic content detection');
    }

    setupAdRefresh() {
      if (this.config.refreshInterval > 0) {
        setInterval(() => {
          this.log('Refreshing ads...');
          this.loadAds();
        }, this.config.refreshInterval);
      }
    }

    injectStyles() {
      const styles = `
        .CoAd-ad-container {
          margin: 0;
          text-align: center;
          min-height: 50px;
          position: relative;
          z-placementIndex: 999999;
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
          z-placementIndex: 999999;
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
          z-placementIndex: 999999;
        }

        .CoAd-ad-error {
          padding: 15px;
          color: #e74c3c;
          font-size: 12px;
          background: #ffeaea;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          position: relative;
          z-placementIndex: 999999;
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
          z-index: 99999 !important;
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

        .CoAd-toggle-btn {
          position: absolute !important;
          top: 8px !important;
          left: 8px !important;
          width: 28px !important;
          height: 28px !important;
          background: rgba(0, 0, 0, 0.6) !important;
          color: white !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 50% !important;
          font-size: 12px !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          z-index: 100000 !important;
          transition: all 0.3s ease !important;
        }

        .CoAd-toggle-btn:hover {
          transform: scale(1.1) !important;
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

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    dispatchEvent(eventName, detail) {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    }

    log(...args) {
      if (this.config.debug) {
        console.log('[CoAd SDK]', ...args);
      }
    }

    error(...args) {
      console.error('[CoAd SDK ERROR]', ...args);

      // Send error to logging API
      this.sendErrorToAPI(...args);
    }

    async sendErrorToAPI(...args) {
      try {
        // Don't send logs if we don't have API URL or if this is a logging error to prevent infinite loops
        if (!this.config.apiUrl || args.some(arg =>
          typeof arg === 'string' && arg.includes('Failed to send error log')
        )) {
          return;
        }

        // Extract error information
        let errorMessage = '';
        let stackTrace = '';
        let errorType = 'SDK_ERROR';
        let additionalData = {};

        // Process arguments to extract error details
        args.forEach((arg, index) => {
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

        // Prepare error log data
        const errorLogData = {
          publisherId: this.config.publisherId || null,
          errorType,
          errorMessage: errorMessage.trim(),
          stackTrace,
          url: window.location.href,
          userAgent: navigator.userAgent,
          sdkConfig: {
            apiUrl: this.config.apiUrl,
            publisherId: this.config.publisherId,
            debug: this.config.debug,
            initialized: this.isInitialized,
            containersCount: this.adContainers.size,
            loadedAdsCount: this.loadedAds.size
          },
          additionalData: {
            timestamp: new Date().toISOString(),
            windowSize: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            ...additionalData
          }
        };

        // Send to logging endpoint
        const response = await fetch(`${this.config.apiUrl}/log`, {
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
          if (this.config.debug) {
            console.log('[CoAd SDK] Error logged with ID:', result.errorLogId);
          }
        }

      } catch (logError) {
        // Don't log this error to prevent infinite loops
        console.warn('[CoAd SDK] Failed to send error log:', logError.message);
      }
    }

    // Public API methods
    refresh() {
      this.log('Manual ad refresh triggered');
      this.loadAds();
    }

    forceReinit() {
      this.log('Force re-initialization triggered');
      this.isInitialized = false;
      this.adContainers.clear();
      this.loadedAds.clear();
      this.init();
    }

    getStatus() {
      return {
        initialized: this.isInitialized,
        containers: this.adContainers.size,
        loadedAds: this.loadedAds.size,
        config: this.config
      };
    }

    destroy() {
      this.log('Destroying CoAd SDK...');

      if (this.domObserver) {
        this.domObserver.disconnect();
        this.domObserver = null;
      }

      this.adContainers.forEach((container) => {
        container.element.remove();
      });

      this.adContainers.clear();
      this.loadedAds.clear();
      this.isInitialized = false;
    }
  }

  // Auto-initialize with or without configuration
  const config = window.CoAdConfig || {};
  const sdk = new CoAdSDK(config);

  // Multiple initialization strategies for different scenarios
  const initializeSDK = () => {
    sdk.init().catch(error => {
      console.error('[CoAd SDK] Initialization failed:', error);
      console.error('[CoAd SDK] Error details:', error.message);

      // If it's a registration error, show helpful message
      if (error.message.includes('not registered')) {
        console.warn('[CoAd SDK] To fix this: Register your website at the CoAd publisher dashboard');
        console.warn('[CoAd SDK] Current domain:', window.location.hostname);
        console.warn('[CoAd SDK] Current URL:', window.location.origin);
      }

      // Don't retry for registration errors
      if (!error.message.includes('not registered')) {
        setTimeout(() => initializeSDK(), 2000);
      }
    });
  };

  // Strategy 1: DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSDK);
  } else if (document.readyState === 'interactive') {
    // Strategy 2: DOM is interactive but not fully loaded
    setTimeout(initializeSDK, 500);
  } else {
    // Strategy 3: DOM is fully loaded
    initializeSDK();
  }

  // Strategy 4: Window load event (fallback for React apps)
  window.addEventListener('load', () => {
    if (!sdk.isInitialized) {
      initializeSDK();
    }
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    if (!sdk.isInitialized) {
      initializeSDK();
    }
  }, 1000);

  // TODO: remove in production
  // Expose SDK instance globally
  window.CoAd.sdk = sdk;

  // TODO: remove in production
  // Expose SDK class for manual initialization
  window.CoAd.AdSDK = CoAdSDK;
  window.CoAd.version = SDK_VERSION;

  // Console usage: 
  // window.CoAd.sdk.refresh()
  // window.CoAd.sdk.destroy()
  // window.CoAd.sdk.getStatus()
  // window.CoAd.sdk.forceReinit()
})();
