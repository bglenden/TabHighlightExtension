/**
 * Active Tab Highlighter - Content Script
 *
 * This script adds MRU (Most Recently Used) position indicators to tabs.
 * Shows numbered colored circles: 1=green (current), 2=yellow, 3=orange, 4=red
 */

import { initDebug, log } from "./debug";

// Initialize debug logging
initDebug();

// MRU Position Favicons (SVG with number inside, black text)
const FAVICONS: Record<number, string> = {
  1: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="%234CAF50"/><text x="8" y="12" font-size="10" fill="%23000000" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">1</text></svg>',
  2: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="%23FFD700"/><text x="8" y="12" font-size="10" fill="%23000000" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">2</text></svg>',
  3: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="%23FF8C00"/><text x="8" y="12" font-size="10" fill="%23000000" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">3</text></svg>',
  4: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="%23F44336"/><text x="8" y="12" font-size="10" fill="%23000000" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">4</text></svg>',
};

// MRU Position Emojis for title
const INDICATORS: Record<number, string> = {
  1: " 🟢",
  2: " 🟡",
  3: " 🟠",
  4: " 🔴",
};

// Store the original title and favicon to restore them when tab loses MRU position
let originalTitle: string = document.title;
let originalFavicon: string | null = null;
let currentPosition: number = 0; // 0 = no position, 1-4 = MRU positions
let faviconCheckInterval: number | null = null;
let extensionContextInvalidated: boolean = false; // Track if extension was reloaded

/**
 * Logs debug information about current favicon state
 */
function logFaviconState(context: string): void {
  const allFavicons = getAllFaviconElements();
  const ourFavicon = document.querySelector(
    'link[data-tab-highlighter="true"]',
  );

  log(`[Tab Highlighter] ${context}`, {
    currentPosition,
    documentHidden: document.hidden,
    documentTitle: document.title,
    originalTitle,
    originalFavicon,
    faviconCount: allFavicons.length,
    hasOurFavicon: !!ourFavicon,
    faviconDetails: allFavicons.map((f) => ({
      href: f.href.substring(0, 50) + (f.href.length > 50 ? "..." : ""),
      rel: f.rel,
      isOurs: f.hasAttribute("data-tab-highlighter"),
    })),
    intervalActive: faviconCheckInterval !== null,
  });
}

/**
 * Gets all favicon link elements
 */
function getAllFaviconElements(): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]'),
  );
}

/**
 * Gets the current favicon link element or creates one if it doesn't exist
 */
function getFaviconElement(): HTMLLinkElement {
  let favicon = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  return favicon;
}

/**
 * Replaces ALL favicons with an MRU position favicon
 */
function setPositionFavicon(position: number): void {
  // Temporarily disconnect observer to prevent our changes from triggering it
  faviconObserver.disconnect();

  // Get all existing favicon elements
  const allFavicons = getAllFaviconElements();

  // Store original favicon if not already stored
  if (originalFavicon === null && allFavicons.length > 0) {
    originalFavicon = allFavicons[0].href || "";
  }

  // Remove all existing favicons
  allFavicons.forEach((fav) => fav.remove());

  // Create our MRU position favicon
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = FAVICONS[position];
  favicon.type = "image/svg+xml";
  favicon.setAttribute("data-tab-highlighter", "true");
  favicon.setAttribute("data-mru-position", position.toString());
  document.head.appendChild(favicon);

  // Reconnect observer after our changes are complete
  faviconObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
}

/**
 * Restores the original favicon
 */
function restoreOriginalFavicon(): void {
  // Temporarily disconnect observer to prevent our changes from triggering it
  faviconObserver.disconnect();

  // Remove our MRU favicon
  const ourFavicon = document.querySelector(
    'link[data-tab-highlighter="true"]',
  );
  if (ourFavicon) {
    ourFavicon.remove();
  }

  // Remove any other existing favicons
  const allFavicons = getAllFaviconElements();
  allFavicons.forEach((fav) => fav.remove());

  // Restore the original favicon if we have one
  if (originalFavicon !== null && originalFavicon !== "") {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = originalFavicon;
    document.head.appendChild(favicon);
  }

  // Reconnect observer after our changes are complete
  faviconObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
}

/**
 * Starts periodic checking to enforce MRU favicon on stubborn sites
 */
function startFaviconEnforcement(): void {
  // Check every 500ms to re-apply position favicon if site changes it
  if (faviconCheckInterval === null && currentPosition > 0) {
    faviconCheckInterval = window.setInterval(() => {
      if (currentPosition > 0 && !document.hidden) {
        // Check if our favicon still exists
        const ourFavicon = document.querySelector(
          'link[data-tab-highlighter="true"]',
        );
        const allFavicons = getAllFaviconElements();

        // If our favicon is missing or there are other favicons, re-apply
        if (
          !ourFavicon ||
          allFavicons.length > 1 ||
          (allFavicons.length === 1 &&
            allFavicons[0].href !== FAVICONS[currentPosition])
        ) {
          setPositionFavicon(currentPosition);
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
 * Adds the MRU indicator to the title and changes favicon
 */
function setPosition(position: number): void {
  if (position < 1 || position > 4) {
    removeIndicator();
    return;
  }

  // If position changed, update everything
  if (currentPosition !== position) {
    // Save the old position before updating
    const oldPosition = currentPosition;

    // Store original title if switching from no-position to position
    if (oldPosition === 0) {
      originalTitle = document.title;
    } else {
      // Remove old indicator from current title to get original
      const oldIndicator = INDICATORS[oldPosition];
      if (document.title.startsWith(oldIndicator)) {
        originalTitle = document.title.substring(oldIndicator.length);
      }
    }

    // Update to new position
    currentPosition = position;

    // Add new indicator at the beginning
    document.title = INDICATORS[position] + originalTitle;

    // Set position favicon
    setPositionFavicon(position);
    startFaviconEnforcement();

    log(
      `[Tab Highlighter] Set position ${position} with ${INDICATORS[position]}`,
    );
    logFaviconState(`After setPosition(${position})`);
  }
}

/**
 * Removes the indicator from the page title and restores favicon
 */
function removeIndicator(): void {
  if (currentPosition > 0) {
    log(
      `[Tab Highlighter] Removing position ${currentPosition} indicator`,
    );

    // Restore original title
    document.title = originalTitle;

    currentPosition = 0;
    stopFaviconEnforcement();
    restoreOriginalFavicon();

    logFaviconState("After removeIndicator()");
  }
}

/**
 * Observes changes to the document title
 * If the page changes its own title, we need to update our indicator
 */
const titleObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList" && currentPosition > 0) {
      // Title changed while we have a position
      const currentTitle = document.title;
      const currentIndicator = INDICATORS[currentPosition];

      // If the title doesn't have our indicator but should
      if (!currentTitle.startsWith(currentIndicator)) {
        // Extract original title (remove any old indicator)
        let title = currentTitle;
        for (const indicator of Object.values(INDICATORS)) {
          if (title.startsWith(indicator)) {
            title = title.substring(indicator.length);
            break;
          }
        }
        originalTitle = title;
        document.title = currentIndicator + title;
      }
    }
  }
});

/**
 * Observes changes to favicon elements in the <head>
 * Some sites (like x.com) dynamically update their favicon, so we need to re-apply ours
 */
const faviconObserver = new MutationObserver((mutations) => {
  if (document.hidden || currentPosition === 0) return;

  for (const mutation of mutations) {
    // Check if any favicon link elements were modified or added
    if (mutation.type === "attributes" && mutation.attributeName === "href") {
      const target = mutation.target as HTMLLinkElement;
      if (
        target.rel &&
        target.rel.includes("icon") &&
        target.href !== FAVICONS[currentPosition]
      ) {
        // Site changed the favicon, re-apply our position favicon
        log(
          "[Tab Highlighter] Site modified favicon href, re-applying position favicon",
        );
        setPositionFavicon(currentPosition);
      }
    } else if (mutation.type === "childList") {
      // Check if new favicon elements were added
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "LINK") {
          const link = node as HTMLLinkElement;
          if (
            link.rel &&
            link.rel.includes("icon") &&
            link.href !== FAVICONS[currentPosition]
          ) {
            log(
              "[Tab Highlighter] Site added new favicon element, re-applying position favicon",
            );
            setPositionFavicon(currentPosition);
          }
        }
      });
    }
  }
});

/**
 * Handles messages from the background service worker
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // If extension context is invalidated, ignore all messages
  if (extensionContextInvalidated) {
    return false;
  }

  log("[Tab Highlighter] Received message:", message);
  log("[Tab Highlighter] Current state before update:", {
    currentPosition,
    documentTitle: document.title,
    documentHidden: document.hidden,
  });

  if (message.type === "UPDATE_POSITION") {
    const position = message.position;
    const mruStack = message.mruStack || [];
    const timestamp = message.timestamp || Date.now();

    log(
      `[Tab Highlighter] UPDATE_POSITION: ${position}, MRU stack: ${mruStack}, timestamp: ${timestamp}`,
    );

    if (position >= 1 && position <= 4) {
      setPosition(position);
    } else {
      removeIndicator();
    }

    log("[Tab Highlighter] Position update complete:", {
      newPosition: currentPosition,
      documentTitle: document.title,
    });

    sendResponse({
      success: true,
      currentPosition,
      documentTitle: document.title,
    });
  }

  return true; // Keep message channel open for async response
});

/**
 * Checks if the extension context is still valid
 */
function isExtensionContextValid(): boolean {
  // If we already know it's invalidated, return false
  if (extensionContextInvalidated) return false;

  // Check if chrome.runtime is still accessible
  try {
    // Force evaluation by assigning to variables - this will throw if context is invalidated
    const runtimeId = chrome.runtime.id;
    const manifest = chrome.runtime.getManifest();

    // Check if the values are actually valid
    if (!runtimeId || !manifest) {
      extensionContextInvalidated = true;
      handleContextInvalidation();
      return false;
    }

    return true;
  } catch {
    // Context is invalidated, set the flag immediately and clean up
    extensionContextInvalidated = true;
    handleContextInvalidation();
    return false;
  }
}

/**
 * Handles extension context invalidation by cleaning up
 */
function handleContextInvalidation(): void {
  if (extensionContextInvalidated) return; // Already handled

  extensionContextInvalidated = true;
  log(
    "[Tab Highlighter] Extension was reloaded. This content script will stop. Please refresh the page to get the new version.",
  );

  // Stop all intervals and observers to avoid further errors
  stopFaviconEnforcement();
  titleObserver.disconnect();
  faviconObserver.disconnect();

  // Remove any indicators we currently have (clean up visual state)
  if (currentPosition > 0) {
    document.title = originalTitle;
    currentPosition = 0;
    restoreOriginalFavicon();
  }
}

/**
 * Query and verify position when tab becomes visible (self-healing)
 */
async function verifyPosition(): Promise<void> {
  // FIRST: Check if we already know the context is invalidated
  // This prevents multiple attempts that would each log an error
  if (extensionContextInvalidated) {
    return;
  }

  // SECOND: Check if extension context is still valid
  if (!isExtensionContextValid()) {
    // handleContextInvalidation is already called in isExtensionContextValid
    return;
  }

  // THIRD: Try to send the message
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_MY_POSITION",
    });

    if (response && response.success) {
      const correctPosition = response.position;

      // If our position doesn't match what it should be, correct it
      if (currentPosition !== correctPosition) {
        log(
          `[Tab Highlighter] Position mismatch detected: have ${currentPosition}, should be ${correctPosition}. Correcting...`,
        );

        if (correctPosition >= 1 && correctPosition <= 4) {
          setPosition(correctPosition);
        } else {
          removeIndicator();
        }
      } else {
        log(
          `[Tab Highlighter] Position verified: ${currentPosition} is correct`,
        );
      }
    }
  } catch {
    // Any error from chrome.runtime.sendMessage is likely due to context invalidation
    // This happens when the extension is reloaded while content scripts are still running
    // Set flag immediately to prevent other concurrent calls from logging errors
    extensionContextInvalidated = true;
    handleContextInvalidation();
  }
}

/**
 * Listen for visibility changes to self-heal stale indicators
 */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    log(
      "[Tab Highlighter] Tab became visible, verifying position...",
    );
    // Call verifyPosition and catch any unhandled rejections
    // (errors are already handled inside verifyPosition)
    verifyPosition().catch(() => {
      // Silently ignore - error handling is done inside verifyPosition()
    });
  }
});

/**
 * Initialize the extension
 */
function init(): void {
  log("[Tab Highlighter] Initializing extension (MRU mode)");

  // Store original favicon
  const favicon = getFaviconElement();
  originalFavicon = favicon.href || "";

  logFaviconState("INIT - Initial state");

  // Clean up any leftover indicators from previous session
  // (Browser may have cached old favicons/titles from before restart)
  removeIndicator();
  log(
    "[Tab Highlighter] Cleaned up any cached indicators from previous session",
  );

  // Don't set position here - wait for background worker to tell us our position
  // The background worker will send UPDATE_POSITION message

  // Observe title changes
  const titleElement = document.querySelector("title");
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
    attributeFilter: ["href"],
  });

  log("[Tab Highlighter] Extension initialized successfully");
}

// Start the extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
