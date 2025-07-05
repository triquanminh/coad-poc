function logMessage(config, ...args) {
  if (config.debug) {
    console.log('[CoAd Tag]', ...args);
  }
}

function logError(...args) { // TODO: log error to api /log (fetch ad, ad impressions) -> statistic impact error only logs
  console.error('[CoAd Tag ERROR]', ...args);
}

export function createLogger(config) {
  return {
    log: (...args) => logMessage(config, ...args),
    error: logError
  };
}

export class EventDispatcher {
  static dispatch(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }
}

export class RetryHelper {
  static async withRetry(fn, maxRetries, initialDelay, maxDelay) {
    let attempt = 0;
    let delay = initialDelay;

    while (attempt < maxRetries) {
      attempt++;

      try {
        return await fn(attempt);
      } catch (error) {
        if (attempt >= maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, maxDelay);
      }
    }
  }
}

export class DOMUtils {
  static createElement(tag, attributes = {}, styles = {}) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    Object.entries(styles).forEach(([key, value]) => {
      element.style[key] = value;
    });

    return element;
  }

  static injectStyles(css) {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);
  }
}

export class URLUtils {
  static buildQueryString(params) {
    return new URLSearchParams(params).toString();
  }

  static getCurrentDomain() {
    return window.location.hostname;
  }

  static getCurrentOrigin() {
    return window.location.origin;
  }

  static getCurrentURL() {
    return window.location.href;
  }

  static getScriptSrcURL() {
    // Find the current script tag that loaded this module
    const scripts = document.querySelectorAll('script[src*="index.js"], script[src*="adsdk.js"], script[src*="coad-tag"]');

    // Look for the script that contains our tag
    for (const script of scripts) {
      const src = script.getAttribute('src');
      if (src && (src.includes('index.js') || src.includes('adsdk.js') || src.includes('coad-tag'))) {
        return src;
      }
    }

    // Fallback: try to get from import.meta.url if available
    try {
      if (import.meta && import.meta.url) {
        return import.meta.url;
      }
    } catch (error) {
      // import.meta not available in this context
    }

    return null;
  }

  static getPublisherIdFromScriptURL() {
    const scriptSrc = this.getScriptSrcURL();

    if (!scriptSrc) {
      return null;
    }

    try {
      const url = new URL(scriptSrc, window.location.origin);
      return url.searchParams.get('publisherId');
    } catch (error) {
      console.warn('[CoAd SDK] Failed to parse script URL:', error);
      return null;
    }
  }
}

export class BrowserUtils {
  static supportsMutationObserver() {
    return typeof window.MutationObserver !== 'undefined';
  }

  static getUserAgent() {
    return navigator.userAgent;
  }

  static getWindowSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
}
