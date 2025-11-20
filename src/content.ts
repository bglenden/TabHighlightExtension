/**
 * Active Tab Highlighter - Content Script
 *
 * This script adds a visual indicator (🟢) to the end of the active tab's title
 * and replaces the favicon with a green circle when the tab is active.
 */

// The indicator to append to the title
const INDICATOR = ' 🟢';

// Green circle favicon as data URI (16x16 PNG)
const GREEN_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="%234CAF50"/></svg>';

// Store the original title and favicon to restore them when tab becomes inactive
let originalTitle: string = document.title;
let originalFavicon: string | null = null;
let isIndicatorActive: boolean = false;
let faviconCheckInterval: number | null = null;

/**
 * Gets all favicon link elements
 */
function getAllFaviconElements(): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
  );
}

/**
 * Gets the current favicon link element or creates one if it doesn't exist
 */
function getFaviconElement(): HTMLLinkElement {
  let favicon = document.querySelector<HTMLLinkElement>(
    'link[rel*="icon"]'
  );

  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  return favicon;
}

/**
 * Replaces ALL favicons with a green circle
 */
function setGreenFavicon(): void {
  // Get all existing favicon elements
  const allFavicons = getAllFaviconElements();

  // Store original favicon if not already stored
  if (originalFavicon === null && allFavicons.length > 0) {
    originalFavicon = allFavicons[0].href || '';
  }

  // Remove all existing favicons
  allFavicons.forEach(fav => fav.remove());

  // Create our green favicon
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = GREEN_FAVICON;
  favicon.type = 'image/svg+xml';
  favicon.setAttribute('data-tab-highlighter', 'true');
  document.head.appendChild(favicon);
}

/**
 * Restores the original favicon
 */
function restoreOriginalFavicon(): void {
  // Remove our green favicon
  const ourFavicon = document.querySelector('link[data-tab-highlighter="true"]');
  if (ourFavicon) {
    ourFavicon.remove();
  }

  // Remove any other existing favicons
  const allFavicons = getAllFaviconElements();
  allFavicons.forEach(fav => fav.remove());

  // Restore the original favicon if we have one
  if (originalFavicon !== null && originalFavicon !== '') {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = originalFavicon;
    document.head.appendChild(favicon);
  }
}

/**
 * Starts periodic checking to enforce green favicon on stubborn sites
 */
function startFaviconEnforcement(): void {
  // Check every 500ms to re-apply green favicon if site changes it
  if (faviconCheckInterval === null) {
    faviconCheckInterval = window.setInterval(() => {
      if (isIndicatorActive && !document.hidden) {
        // Check if our favicon still exists
        const ourFavicon = document.querySelector('link[data-tab-highlighter="true"]');
        const allFavicons = getAllFaviconElements();

        // If our favicon is missing or there are other favicons, re-apply
        if (!ourFavicon || allFavicons.length > 1 ||
            (allFavicons.length === 1 && allFavicons[0].href !== GREEN_FAVICON)) {
          setGreenFavicon();
        }
      }
    }, 500);
  }
}

/**
 * Stops periodic favicon checking
 */
function stopFaviconEnforcement(): void {
  if (faviconCheckInterval !== null) {
    clearInterval(faviconCheckInterval);
    faviconCheckInterval = null;
  }
}

/**
 * Adds the indicator to the end of the page title and changes favicon
 */
function addIndicator(): void {
  if (!isIndicatorActive && !document.title.endsWith(INDICATOR)) {
    originalTitle = document.title;
    document.title = document.title + INDICATOR;
    setGreenFavicon();
    startFaviconEnforcement();
    isIndicatorActive = true;
  }
}

/**
 * Removes the indicator from the page title and restores favicon
 */
function removeIndicator(): void {
  if (isIndicatorActive) {
    // Set this to false FIRST to prevent faviconObserver from re-applying green favicon
    isIndicatorActive = false;

    // Remove indicator from title if it exists, otherwise just restore original
    if (document.title.endsWith(INDICATOR)) {
      document.title = originalTitle;
    } else {
      // Title was changed by the page, just restore what we have
      document.title = originalTitle;
    }

    stopFaviconEnforcement();
    restoreOriginalFavicon();
  }
}

/**
 * Handles visibility changes (tab becomes active/inactive)
 */
function handleVisibilityChange(): void {
  if (document.hidden) {
    // Tab is now hidden/inactive
    removeIndicator();
  } else {
    // Tab is now visible/active
    addIndicator();
  }
}

/**
 * Observes changes to the document title
 * If the page changes its own title, we need to update our indicator
 */
const titleObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && !document.hidden) {
      // Title changed while tab is active
      const currentTitle = document.title;

      // If the title doesn't have our indicator but should (tab is visible)
      if (!currentTitle.endsWith(INDICATOR)) {
        originalTitle = currentTitle;
        addIndicator();
      } else if (currentTitle.endsWith(INDICATOR)) {
        // Update our stored original title
        originalTitle = currentTitle.substring(0, currentTitle.length - INDICATOR.length);
      }
    }
  }
});

/**
 * Observes changes to favicon elements in the <head>
 * Some sites (like x.com) dynamically update their favicon, so we need to re-apply ours
 */
const faviconObserver = new MutationObserver((mutations) => {
  if (document.hidden || !isIndicatorActive) return;

  for (const mutation of mutations) {
    // Check if any favicon link elements were modified or added
    if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
      const target = mutation.target as HTMLLinkElement;
      if (target.rel && target.rel.includes('icon') && target.href !== GREEN_FAVICON) {
        // Site changed the favicon, re-apply our green circle
        setGreenFavicon();
      }
    } else if (mutation.type === 'childList') {
      // Check if new favicon elements were added
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'LINK') {
          const link = node as HTMLLinkElement;
          if (link.rel && link.rel.includes('icon') && link.href !== GREEN_FAVICON) {
            setGreenFavicon();
          }
        }
      });
    }
  }
});

/**
 * Initialize the extension
 */
function init(): void {
  // Store original favicon
  const favicon = getFaviconElement();
  originalFavicon = favicon.href || '';

  // Add indicator if tab is currently visible
  if (!document.hidden) {
    addIndicator();
  }

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Observe title changes
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleObserver.observe(titleElement, {
      childList: true,
      subtree: true,
    });
  }

  // Observe favicon changes in the <head> element
  // This handles sites that dynamically update their favicons (like x.com)
  faviconObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });
}

// Start the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
