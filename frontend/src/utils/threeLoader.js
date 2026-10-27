let threePromise = null;

export const loadThree = () => {
  if (window.THREE) {
    return Promise.resolve(window.THREE);
  }
  if (threePromise) {
    return threePromise;
  }

  threePromise = new Promise((resolve, reject) => {
    // Check if script already exists in document
    const existing = document.querySelector('script[src*="three"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => resolve(window.THREE);
    script.onerror = () => {
      // Fallback CDN if cloudflare fails
      const fallback = document.createElement('script');
      fallback.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
      fallback.async = true;
      fallback.onload = () => resolve(window.THREE);
      fallback.onerror = reject;
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });

  return threePromise;
};
