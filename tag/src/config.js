export const COAD_TAG_VERSION = import.meta.env.VITE_COAD_TAG_VERSION || '0.1';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const DEFAULT_CONFIG = {
  publisherId: null,
  website: null,
  placements: [],
  apiUrl: API_BASE_URL,
  debug: false
};

export const createConfig = (userConfig = {}) => {
  return {
    ...DEFAULT_CONFIG,
    website: userConfig.website || (typeof window !== 'undefined' ? window.location.origin : null),
    ...userConfig
  };
};
