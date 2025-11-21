/**
 * Active Tab Highlighter - Background Service Worker
 *
 * Tracks the Most Recently Used (MRU) order of tabs to create a breadcrumb trail.
 * Maintains a list of the last 4 active tabs and broadcasts their positions.
 */

import { initDebug, log, warn } from "./debug";
import type {
  ExtensionMessage,
  MRUPosition,
  UpdatePositionMessage,
} from "./types";
import { MAX_MRU_STACK_SIZE } from "./types";

// Initialize debug logging
initDebug();

// MRU stack: most recent tab IDs in order [current, 1 back, 2 back, 3 back]
let mruStack: number[] = [];
let previousMruStack: number[] = [];

/**
 * Check if a tab URL is trackable (can run content scripts)
 * Uses allowlist approach: only http:// and https:// URLs can run content scripts
 */
function isTrackableUrl(url: string | undefined): boolean {
  if (!url) return false;

  // Only allow http and https URLs - these are the only schemes where content scripts reliably run
  // This excludes: chrome://, chrome-extension://, edge://, about:, data:, blob:, javascript:, file://, devtools://, etc.
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Sends a message to a tab's content script with error handling
 * Returns true if successful, false if tab wasn't ready
 */
async function sendMessageToTab(
  tabId: number,
  message: ExtensionMessage,
): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    log(`[Tab Highlighter BG] ✓ Successfully sent to tab ${tabId}`);
    return true;
  } catch {
    // Tab might not have content script loaded yet, or be a chrome:// page
    // This is normal and not an error
    log(
      `[Tab Highlighter BG] ⓘ Tab ${tabId} not ready (content script not loaded yet - this is normal)`,
    );
    return false;
  }
}

/**
 * Updates the MRU stack when a tab becomes active
 */
async function updateMRU(tabId: number): Promise<void> {
  log("[Tab Highlighter BG] Tab activated:", tabId);

  // Get tab info to check if it's trackable
  try {
    const tab = await chrome.tabs.get(tabId);

    if (!isTrackableUrl(tab.url)) {
      log(
        `[Tab Highlighter BG] Tab ${tabId} has untrackable URL: ${tab.url}, skipping MRU update`,
      );
      return;
    }
  } catch (error) {
    warn(
      `[Tab Highlighter BG] Failed to get tab ${tabId} info:`,
      error,
    );
    return;
  }

  // Save previous stack to detect tabs that fell off
  previousMruStack = [...mruStack];

  // Remove tabId if it already exists in the stack
  mruStack = mruStack.filter((id) => id !== tabId);

  // Add to the front
  mruStack.unshift(tabId);

  // Keep only last N tabs
  if (mruStack.length > MAX_MRU_STACK_SIZE) {
    mruStack = mruStack.slice(0, MAX_MRU_STACK_SIZE);
  }

  log("[Tab Highlighter BG] Updated MRU stack:", mruStack);

  // Find tabs that were in the previous stack but not in the new one
  const removedTabs = previousMruStack.filter((id) => !mruStack.includes(id));
  if (removedTabs.length > 0) {
    log("[Tab Highlighter BG] Tabs removed from MRU:", removedTabs);
  }

  // Broadcast updated positions to all tabs
  broadcastPositions(removedTabs);
}

/**
 * Broadcasts MRU position to each tab's content script
 */
async function broadcastPositions(removedTabs: number[] = []): Promise<void> {
  log("[Tab Highlighter BG] Broadcasting positions to tabs...");

  // Send positions to tabs in the MRU stack
  for (let index = 0; index < mruStack.length; index++) {
    const tabId = mruStack[index];
    const position = (index + 1) as MRUPosition; // 1-based: 1=current, 2=1 back, 3=2 back, 4=3 back

    log(
      `[Tab Highlighter BG] Sending position ${position} to tab ${tabId}`,
    );

    const message: UpdatePositionMessage = {
      type: "UPDATE_POSITION",
      position: position,
      mruStack: [...mruStack],
      timestamp: Date.now(),
    };

    await sendMessageToTab(tabId, message);
  }

  // Tell tabs that were removed from MRU to clear their indicators
  for (const tabId of removedTabs) {
    log(
      `[Tab Highlighter BG] Telling tab ${tabId} to remove indicator (fell off MRU stack)`,
    );

    const message: UpdatePositionMessage = {
      type: "UPDATE_POSITION",
      position: 0, // 0 means remove indicator
      mruStack: [...mruStack],
      timestamp: Date.now(),
    };

    await sendMessageToTab(tabId, message);
  }

  log("[Tab Highlighter BG] Broadcast complete");
}

/**
 * Removes a tab from the MRU stack when it's closed
 */
function removeFromMRU(tabId: number): void {
  log("[Tab Highlighter BG] Tab closed:", tabId);
  mruStack = mruStack.filter((id) => id !== tabId);
  log("[Tab Highlighter BG] Updated MRU stack:", mruStack);

  // Rebroadcast positions to update remaining tabs (no removed tabs in this case since tab is closed)
  broadcastPositions([]);
}

// Listen for tab activation (this will wake up the service worker)
chrome.tabs.onActivated.addListener((activeInfo) => {
  log("[Tab Highlighter BG] onActivated event fired");
  updateMRU(activeInfo.tabId);
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  log("[Tab Highlighter BG] onRemoved event fired");
  removeFromMRU(tabId);
});

// Listen for tab updates (e.g., navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only update MRU if the tab is currently active
  if (tab.active && changeInfo.status === "complete") {
    log("[Tab Highlighter BG] onUpdated event fired for active tab");
    updateMRU(tabId);
  }
});

// Listen for window focus changes (helps wake up service worker and restore suspended tabs)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    log(
      "[Tab Highlighter BG] Window focus changed, updating MRU and rebroadcasting to all tabs",
    );

    // Update MRU with currently active tab
    const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tabs[0]) {
      await updateMRU(tabs[0].id!);
    }

    // Force rebroadcast to all tabs to restore indicators that may have been
    // lost while window was on another virtual desktop or in background
    // This is important because suspended tabs might not have processed previous messages
    log(
      "[Tab Highlighter BG] Force rebroadcasting positions to restore any lost indicators",
    );
    await broadcastPositions([]);
  }
});

/**
 * Clears all stale indicators from all tabs and initializes MRU with active tab
 */
async function initializeMRU(): Promise<void> {
  log(
    "[Tab Highlighter BG] Initializing - clearing stale indicators from all tabs",
  );

  // Get ALL tabs and clear any stale indicators
  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (tab.id) {
      const message: UpdatePositionMessage = {
        type: "UPDATE_POSITION",
        position: 0, // Clear all indicators
        mruStack: [],
        timestamp: Date.now(),
      };
      await sendMessageToTab(tab.id, message);
    }
  }

  log(
    "[Tab Highlighter BG] Cleared stale indicators, now initializing with active tab",
  );

  // Now initialize with currently active tab
  const activeTabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs[0]) {
    updateMRU(activeTabs[0].id!);
  }
}

/**
 * Message handler for content scripts to query their position
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_MY_POSITION" && sender.tab?.id) {
    const tabId = sender.tab.id;
    const position = mruStack.indexOf(tabId);

    if (position >= 0 && position < MAX_MRU_STACK_SIZE) {
      // Tab is in MRU stack at position (0-indexed)
      sendResponse({
        success: true,
        position: (position + 1) as MRUPosition, // Convert to 1-indexed
        mruStack: [...mruStack],
      });
    } else {
      // Tab is not in MRU stack
      sendResponse({
        success: true,
        position: 0 as MRUPosition,
        mruStack: [...mruStack],
      });
    }

    return true; // Keep channel open for async response
  }
});

// Service worker startup
chrome.runtime.onStartup.addListener(() => {
  log("[Tab Highlighter BG] Browser startup detected");
  initializeMRU();
});

// Service worker install/update
chrome.runtime.onInstalled.addListener(() => {
  log("[Tab Highlighter BG] Extension installed/updated");
  initializeMRU();
});

// Initialize on service worker first load
log("[Tab Highlighter BG] Background worker script loaded");
initializeMRU();
