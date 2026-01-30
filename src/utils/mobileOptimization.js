// Mobile detection and optimization utilities
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isSlowNetwork = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return false;

  const effectiveType = connection.effectiveType;
  return effectiveType === '3g' || effectiveType === '4g' || effectiveType === 'slow-2g' || effectiveType === '2g';
};

export const getOptimizedImageSize = () => {
  if (typeof window === 'undefined') return 'medium';
  
  const width = window.innerWidth;
  if (width < 640) return 'small';
  if (width < 1024) return 'medium';
  return 'large';
};

// Debounce hook for mobile events
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Request Idle Callback polyfill for mobile
export const requestIdleCallback = (() => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback;
  }
  return (cb) => setTimeout(cb, 1);
})();

// Cache management
export const getMobileCache = (key) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const item = localStorage.getItem(`mobile_cache_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

export const setMobileCache = (key, value) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`mobile_cache_${key}`, JSON.stringify(value));
  } catch (e) {
    // Cache full or unavailable
  }
};
