/**
 * Active Tab Highlighter - Content Script
 *
 * This script adds MRU (Most Recently Used) position indicators to tabs.
 * Shows numbered colored circles: 1=green (current), 2=yellow, 3=orange, 4=red
 */

import { initDebug, log } from "./debug";
import { INDICATORS } from "./types";
import type { MRUPosition, UpdatePositionMessage } from "./types";
import { DEFAULT_BREADCRUMB_COUNT, STORAGE_KEYS } from "./constants";
import { getBreadcrumbCount } from "./storage";

// Initialize debug logging
initDebug();

// Store the original title to restore it when tab loses MRU position
let originalTitle: string = document.title;
let currentPosition: MRUPosition = 0; // 0 = no position, 1-4 = MRU positions
let extensionContextInvalidated: boolean = false; // Track if extension was reloaded
let breadcrumbCount: 1 | 4 = DEFAULT_BREADCRUMB_COUNT;

/**
 * Load breadcrumb count setting from storage
 */
async function loadBreadcrumbCount(): Promise<void> {
  breadcrumbCount = await getBreadcrumbCount();
  log("[Tab Highlighter] Loaded breadcrumb count:", breadcrumbCount);
}

/**
 * Adds the MRU indicator to the title
 */
function setPosition(position: MRUPosition): void {
  if (position < 1 || position > 4) {
    removeIndicator();
    return;
  }

  // In single breadcrumb mode, only show indicator for position 1
  if (breadcrumbCount === 1 && position !== 1) {
    removeIndicator();
    return;
  }

  const indicator = INDICATORS[position as Exclude<MRUPosition, 0>];

  // Check if we need to update (position changed OR title doesn't have the indicator)
  const needsUpdate =
    currentPosition !== position || !document.title.startsWith(indicator);

  if (needsUpdate) {
    // Save the old position before updating
    const oldPosition = currentPosition;

    // Store original title if switching from no-position to position
    if (oldPosition === 0) {
      originalTitle = document.title;
    } else if (currentPosition !== position) {
      // Remove old indicator from current title to get original (only if position changed)
      const oldIndicator = INDICATORS[oldPosition as Exclude<MRUPosition, 0>];
      if (document.title.startsWith(oldIndicator)) {
        originalTitle = document.title.substring(oldIndicator.length);
      }
    } else {
      // Position same but indicator missing - title was changed externally
      // Extract the current title as the new original (removing any stray indicators)
      let title = document.title;
      for (const ind of Object.values(INDICATORS)) {
        if (title.startsWith(ind)) {
          title = title.substring(ind.length);
          break;
        }
      }
      originalTitle = title;
    }

    // Update to new position
    currentPosition = position;

    // Add new indicator at the beginning (position is guaranteed to be 1-4 here)
    document.title = indicator + originalTitle;

    log(`[Tab Highlighter] Set position ${position} with ${indicator}`);
  }
}

/**
 * Removes the indicator from the page title
 */
function removeIndicator(): void {
  if (currentPosition > 0) {
    log(`[Tab Highlighter] Removing position ${currentPosition} indicator`);

    // Restore original title
    document.title = originalTitle;
    currentPosition = 0;
  }
}

/**
 * Observes changes to the document title
 * If the page changes its own title, we need to update our indicator
 */
const titleObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList" && currentPosition > 0) {
      // Title changed while we have a position (currentPosition is 1-4 here)
      const currentTitle = document.title;
      const currentIndicator =
        INDICATORS[currentPosition as Exclude<MRUPosition, 0>];

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
    const updateMessage = message as UpdatePositionMessage;
    const position = updateMessage.position;
    const mruStack = updateMessage.mruStack || [];
    const timestamp = updateMessage.timestamp || Date.now();

    log(
      `[Tab Highlighter] UPDATE_POSITION: ${position}, MRU stack: ${mruStack}, timestamp: ${timestamp}`,
    );

    // Respect breadcrumb count setting
    if (position >= 1 && position <= 4) {
      if (breadcrumbCount === 1 && position === 1) {
        // Single breadcrumb mode: only show for position 1
        setPosition(position);
      } else if (breadcrumbCount === 4) {
        // Four breadcrumb mode: show for positions 1-4
        setPosition(position);
      } else {
        // Position beyond breadcrumb count
        removeIndicator();
      }
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

  // Stop all observers to avoid further errors
  titleObserver.disconnect();

  // Remove any indicators we currently have (clean up visual state)
  if (currentPosition > 0) {
    document.title = originalTitle;
    currentPosition = 0;
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
    log("[Tab Highlighter] Tab became visible, verifying position...");
    // Call verifyPosition and catch any unhandled rejections
    // (errors are already handled inside verifyPosition)
    verifyPosition().catch(() => {
      // Silently ignore - error handling is done inside verifyPosition()
    });
  }
});

/**
 * Listen for window focus to restore indicators after switching virtual desktops
 * This handles the case where Chrome suspends content scripts when window is off-screen
 */
window.addEventListener("focus", () => {
  // When window regains focus, re-apply our indicator if we have a position
  if (currentPosition > 0) {
    // currentPosition is 1-4 here
    const currentIndicator =
      INDICATORS[currentPosition as Exclude<MRUPosition, 0>];
    if (!document.title.startsWith(currentIndicator)) {
      log("[Tab Highlighter] Window focused, restoring indicator...");
      document.title = currentIndicator + originalTitle;
    }
  }
});

/**
 * Initialize the extension
 */
async function init(): Promise<void> {
  log("[Tab Highlighter] Initializing extension (MRU mode)");

  // Load breadcrumb count setting
  await loadBreadcrumbCount();

  // Clean up any leftover indicators from previous session
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

  log("[Tab Highlighter] Extension initialized successfully");
}

/**
 * Listen for storage changes to update breadcrumb count
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[STORAGE_KEYS.BREADCRUMB_COUNT]) {
    const newCount = changes[STORAGE_KEYS.BREADCRUMB_COUNT].newValue;
    log("[Tab Highlighter] Breadcrumb count changed to:", newCount);
    breadcrumbCount = newCount ?? DEFAULT_BREADCRUMB_COUNT;

    // If we have a position, re-evaluate whether to show indicator
    if (currentPosition > 0) {
      if (breadcrumbCount === 1 && currentPosition !== 1) {
        // Single breadcrumb mode but we're not position 1 - remove indicator
        removeIndicator();
      } else if (currentPosition > breadcrumbCount) {
        // Position beyond new breadcrumb count - remove indicator
        removeIndicator();
      }
    }
  }
});

// Start the extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
