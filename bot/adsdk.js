/**
 * COAD AdSDK - Version 1.0.0
 * Advanced advertising SDK for publisher websites
 */

(function() {
  'use strict';

  // SDK Configuration
  const SDK_VERSION = '1.0.0';
  const API_BASE_URL = 'http://localhost:8080/api';
  const DEFAULT_REFRESH_INTERVAL = 10000; // 10 seconds

  // Global COAD namespace
  window.COAD = window.COAD || {};

  class COADAdSDK {
    constructor(config) {
      this.config = {
        publisherId: config.publisherId || null,
        website: config.website || window.location.origin,
        placements: config.placements || [],
        apiUrl: config.apiUrl || API_BASE_URL,
        refreshInterval: config.refreshInterval || DEFAULT_REFRESH_INTERVAL,
        debug: config.debug || true,
        ...config
      };

      this.adContainers = new Map();
      this.loadedAds = new Map();
      this.isInitialized = false;

      this.log('COAD AdSDK initialized', this.config);
    }

    // Initialize the SDK
    async init() {
      if (this.isInitialized) {
        this.log('SDK already initialized');
        return;
      }

      try {
        this.log('Initializing COAD AdSDK...');

        // Check API connectivity first
        await this.checkAPIConnectivity();

        // Auto-detect publisher configuration if no publisherId provided
        if (!this.config.publisherId) {
          this.log('No Publisher ID provided, attempting auto-detection...');
          await this.autoDetectPublisherConfig();
        } else {
          this.log('Using provided Publisher ID:', this.config.publisherId);
          // Load publisher configuration from API using provided ID
          await this.loadPublisherConfig();
        }

        // Validate that we have a publisher ID after detection/loading
        if (!this.config.publisherId) {
          throw new Error('Unable to determine Publisher ID. Please register this website in the COAD publisher dashboard.');
        }

        // Create ad containers for specified placements with retry logic
        await this.createAdContainersWithRetry();

        // Set up refresh interval
        this.setupRefreshInterval();

        // Add CSS styles
        this.injectStyles();

        // Set up DOM observer for dynamic content
        this.setupDOMObserver();

        this.isInitialized = true;
        this.log('COAD AdSDK initialized successfully');

        // Dispatch initialization event
        this.dispatchEvent('coad:initialized', { sdk: this });

      } catch (error) {
        this.error('Failed to initialize SDK:', error);
        throw error;
      }
    }

    // Check API connectivity
    async checkAPIConnectivity() {
      try {
        this.log('Checking API connectivity...');
        const response = await fetch(`${this.config.apiUrl.replace('/api', '')}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          this.log('✅ API connectivity verified');
        } else {
          throw new Error(`API health check failed: ${response.status}`);
        }
      } catch (error) {
        this.error('❌ API connectivity check failed:', error);
        throw new Error(`Cannot connect to COAD API at ${this.config.apiUrl}`);
      }
    }

    // Auto-detect publisher configuration by domain
    async autoDetectPublisherConfig() {
      try {
        this.log('Auto-detecting publisher configuration...');
        this.log('Current domain:', window.location.hostname);
        this.log('Current URL:', window.location.origin);

        // Try to get config by domain first
        const params = new URLSearchParams({
          domain: window.location.hostname,
          url: window.location.origin
        });

        const response = await fetch(`${this.config.apiUrl}/bot/config-by-domain?${params}`);

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json();
            throw new Error(`Website not registered: ${errorData.error}. ${errorData.suggestion || ''}`);
          }
          throw new Error(`Failed to auto-detect publisher config: ${response.status}`);
        }

        const config = await response.json();

        // Merge API config with local config
        this.config = { ...this.config, ...config };

        this.log('✅ Publisher configuration auto-detected:', config);
        this.log(`✅ Matched by: ${config.matchedBy}, Publisher ID: ${config.publisherId}`);

      } catch (error) {
        this.error('❌ Failed to auto-detect publisher configuration:', error);
        throw error;
      }
    }

    // Load publisher configuration from API
    async loadPublisherConfig() {
      try {
        this.log('Loading publisher configuration...');
        const response = await fetch(`${this.config.apiUrl}/bot/config/${this.config.publisherId}`);

        if (!response.ok) {
          throw new Error(`Failed to load publisher config: ${response.status}`);
        }

        const config = await response.json();

        // Merge API config with local config
        this.config = { ...this.config, ...config };

        this.log('✅ Publisher configuration loaded:', config);
      } catch (error) {
        this.error('❌ Failed to load publisher configuration:', error);
        this.log('Continuing with local configuration...');
        // Continue with local configuration
      }
    }

    // Create ad containers with retry logic for React apps
    async createAdContainersWithRetry(maxRetries = 5, delay = 1000) {
      let attempt = 0;

      while (attempt < maxRetries) {
        attempt++;
        this.log(`Creating ad containers (attempt ${attempt}/${maxRetries})`);

        this.createAdContainers();

        if (this.adContainers.size > 0) {
          this.log(`Successfully created ${this.adContainers.size} ad containers`);
          // Load ads after successful container creation
          await this.loadAds();
          return;
        }

        if (attempt < maxRetries) {
          this.log(`No containers created, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          // Increase delay for next attempt
          delay = Math.min(delay * 1.5, 5000);
        }
      }

      this.error(`Failed to create ad containers after ${maxRetries} attempts`);
    }

    // Create ad containers for each placement
    createAdContainers() {
      this.config.placements.forEach((placement, index) => {
        try {
          const elements = document.querySelectorAll(placement);

          this.log(`Looking for placement: ${placement}, found ${elements.length} elements`);

          if (elements.length === 0) {
            this.log(`Warning: No elements found for selector "${placement}"`);
            return;
          }

          elements.forEach((element, elementIndex) => {
            const containerId = `coad-ad-${this.config.publisherId}-${index}-${elementIndex}`;

            // Check if container already exists
            if (this.adContainers.has(containerId)) {
              this.log(`Container ${containerId} already exists, skipping`);
              return;
            }

            // Create ad container
            const adContainer = document.createElement('div');
            adContainer.id = containerId;
            adContainer.className = 'coad-ad-container';
            adContainer.setAttribute('data-placement', placement);
            adContainer.setAttribute('data-publisher', this.config.publisherId);

            // Insert the ad container AFTER the target element as a sibling
            this.log(`Inserting ad container AFTER element:`, element);
            this.log(`Target element tag:`, element.tagName);
            this.log(`Target element class:`, element.className);
            this.log(`Target element parent:`, element.parentElement);

            element.insertAdjacentElement('afterend', adContainer);

            this.log(`Ad container inserted. Container parent:`, adContainer.parentElement);
            this.log(`Container next sibling:`, adContainer.nextElementSibling);
            this.log(`Container previous sibling:`, adContainer.previousElementSibling);

            this.adContainers.set(containerId, {
              element: adContainer,
              placement: placement,
              targetElement: element
            });

            this.log(`Created ad container: ${containerId} for placement: ${placement}`);
          });
        } catch (error) {
          this.error(`Failed to create container for placement ${placement}:`, error);
        }
      });
    }

    // Load ads for all containers
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

    // Load ad for specific container with retry logic
    async loadAdForContainer(containerId, retryCount = 0) {
      const container = this.adContainers.get(containerId);

      if (!container) {
        this.error(`Container not found: ${containerId}`);
        return;
      }

      const maxRetries = 3;
      const retryDelay = 1000 * (retryCount + 1); // Exponential backoff

      try {
        // Show loading state
        container.element.innerHTML = '<div class="coad-ad-loading">Loading ad...</div>';

        this.log(`Loading ad for container: ${containerId} (attempt ${retryCount + 1}/${maxRetries + 1})`);

        // Build request URL
        const adUrl = `${this.config.apiUrl}/ads?publisherId=${encodeURIComponent(this.config.publisherId)}&placement=${encodeURIComponent(container.placement)}`;
        this.log(`Fetching ad from: ${adUrl}`);

        // Fetch ad from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

        // Render the ad
        this.renderAd(containerId, adData.ad);

        // Store loaded ad data
        this.loadedAds.set(containerId, adData);

        this.log(`✅ Ad successfully loaded for container: ${containerId}`);

      } catch (error) {
        this.error(`❌ Failed to load ad for container ${containerId} (attempt ${retryCount + 1}):`, error);

        // Retry logic
        if (retryCount < maxRetries) {
          this.log(`Retrying in ${retryDelay}ms...`);
          container.element.innerHTML = `<div class="coad-ad-loading">Loading ad... (retry ${retryCount + 1}/${maxRetries})</div>`;

          setTimeout(() => {
            this.loadAdForContainer(containerId, retryCount + 1);
          }, retryDelay);
        } else {
          // Show final error state
          container.element.innerHTML = `<div class="coad-ad-error">
            Ad failed to load after ${maxRetries + 1} attempts<br>
            <small>Error: ${error.message}</small>
          </div>`;
        }
      }
    }

    // Render ad content
    renderAd(containerId, adData) {
      const container = this.adContainers.get(containerId);
      
      if (!container || !adData) {
        return;
      }

      // Create ad wrapper
      const adWrapper = document.createElement('div');
      adWrapper.className = 'coad-ad-wrapper';
      adWrapper.setAttribute('data-ad-id', adData.id);
      adWrapper.setAttribute('data-ad-type', adData.type);

      // Set ad content
      adWrapper.innerHTML = adData.content;

      // Add click tracking
      adWrapper.addEventListener('click', () => {
        this.trackAdClick(adData.id, containerId);
      });

      // Replace container content
      container.element.innerHTML = '';
      container.element.appendChild(adWrapper);

      // Track ad impression
      this.trackAdImpression(adData.id, containerId);
    }

    // Track ad impression
    trackAdImpression(adId, containerId) {
      this.log(`Ad impression: ${adId} in ${containerId}`);
      
      // In a real implementation, send tracking data to analytics
      this.dispatchEvent('coad:impression', {
        adId,
        containerId,
        publisherId: this.config.publisherId,
        timestamp: new Date().toISOString()
      });
    }

    // Track ad click
    trackAdClick(adId, containerId) {
      this.log(`Ad click: ${adId} in ${containerId}`);
      
      // In a real implementation, send tracking data to analytics
      this.dispatchEvent('coad:click', {
        adId,
        containerId,
        publisherId: this.config.publisherId,
        timestamp: new Date().toISOString()
      });
    }

    // Set up DOM observer for dynamic content changes
    setupDOMObserver() {
      if (!window.MutationObserver) {
        this.log('MutationObserver not supported, skipping DOM observation');
        return;
      }

      this.domObserver = new MutationObserver((mutations) => {
        let shouldCheckForNewElements = false;

        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any of our target elements were added
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.config.placements.forEach((placement) => {
                  if (node.matches && node.matches(placement)) {
                    shouldCheckForNewElements = true;
                  }
                  // Also check if the added node contains our target elements
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

      // Start observing
      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      this.log('DOM observer set up for dynamic content detection');
    }

    // Set up automatic ad refresh
    setupRefreshInterval() {
      if (this.config.refreshInterval > 0) {
        setInterval(() => {
          this.log('Refreshing ads...');
          this.loadAds();
        }, this.config.refreshInterval);
      }
    }

    // Inject CSS styles
    injectStyles() {
      const styles = `
        .coad-ad-container {
          margin: 20px 0;
          text-align: center;
          min-height: 50px;
          position: relative;
          z-index: 999999;
          clear: both;
        }

        .coad-ad-wrapper {
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

        .coad-ad-wrapper:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .coad-ad-loading {
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

        .coad-ad-error {
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

        @media (max-width: 768px) {
          .coad-ad-container {
            margin: 15px 0;
          }
        }

        /* Debug mode styles */
        .coad-debug .coad-ad-container {
          border: 2px dashed #2563eb;
          background: rgba(37, 99, 235, 0.05);
        }

        .coad-debug .coad-ad-container::before {
          content: 'COAD Ad Container: ' attr(data-placement);
          position: absolute;
          top: -20px;
          left: 0;
          font-size: 10px;
          color: #2563eb;
          background: white;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #2563eb;
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);

      // Add debug class to body if debug mode is enabled
      if (this.config.debug) {
        document.body.classList.add('coad-debug');
        this.log('Debug mode enabled - ad containers will be highlighted');
      }
    }

    // Dispatch custom events
    dispatchEvent(eventName, detail) {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    }

    // Logging utility
    log(...args) {
      if (this.config.debug) {
        console.log('[COAD SDK]', ...args);
      }
    }

    // Error logging utility
    error(...args) {
      console.error('[COAD SDK ERROR]', ...args);
    }

    // Public API methods
    refresh() {
      this.log('Manual ad refresh triggered');
      this.loadAds();
    }

    // Force re-initialization (useful for debugging)
    forceReinit() {
      this.log('Force re-initialization triggered');
      this.isInitialized = false;
      this.adContainers.clear();
      this.loadedAds.clear();
      this.init();
    }

    // Get current status
    getStatus() {
      return {
        initialized: this.isInitialized,
        containers: this.adContainers.size,
        loadedAds: this.loadedAds.size,
        config: this.config
      };
    }

    destroy() {
      this.log('Destroying COAD SDK...');

      // Stop DOM observer
      if (this.domObserver) {
        this.domObserver.disconnect();
        this.domObserver = null;
      }

      // Remove ad containers
      this.adContainers.forEach((container) => {
        container.element.remove();
      });

      this.adContainers.clear();
      this.loadedAds.clear();
      this.isInitialized = false;
    }
  }

  // Auto-initialize with or without configuration
  const config = window.COADConfig || {};
  const sdk = new COADAdSDK(config);

  // Multiple initialization strategies for different scenarios
  const initializeSDK = () => {
    sdk.init().catch(error => {
      console.error('[COAD SDK] Initialization failed:', error);
      console.error('[COAD SDK] Error details:', error.message);

      // If it's a registration error, show helpful message
      if (error.message.includes('not registered')) {
        console.warn('[COAD SDK] 💡 To fix this: Register your website at the COAD publisher dashboard');
        console.warn('[COAD SDK] 💡 Current domain:', window.location.hostname);
        console.warn('[COAD SDK] 💡 Current URL:', window.location.origin);
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
      console.log('[COAD SDK] Fallback initialization on window load');
      initializeSDK();
    }
  });

  // Strategy 5: Delayed initialization for React apps
  setTimeout(() => {
    if (!sdk.isInitialized) {
      console.log('[COAD SDK] Delayed initialization for React apps');
      initializeSDK();
    }
  }, 1000);

  // Expose SDK instance globally
  window.COAD.sdk = sdk;

  // Expose SDK class for manual initialization
  window.COAD.AdSDK = COADAdSDK;
  window.COAD.version = SDK_VERSION;

})();
