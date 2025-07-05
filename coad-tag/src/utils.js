function logMessage(config, ...args) { // TODO: remove in production, check whether we need this for production? 2 version of coad tag for debug on publisher's website
  if (config.debug) {
    console.log('[CoAd SDK]', ...args);
  }
}

function logError(...args) { // TODO: log error to api /log (fetch ad, ad impressions) -> statistic impact error only logs
  console.error('[CoAd SDK ERROR]', ...args);
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
