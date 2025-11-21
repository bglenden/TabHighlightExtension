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
 * Persist the current MRU stack so it can be restored if the service worker restarts
 */
async function persistMRUStack(): Promise<void> {
  try {
    await chrome.storage.local.set({ mruStack });
    log("[Tab Highlighter BG] Persisted MRU stack:", mruStack);
  } catch (error) {
    warn("[Tab Highlighter BG] Failed to persist MRU stack:", error);
  }
}

/**
 * Attempt to restore the MRU stack from storage.
 * Returns true if we restored at least one valid tab.
 */
async function restoreMRUStackFromStorage(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get("mruStack");
    const savedStack = Array.isArray(result.mruStack)
      ? (result.mruStack as number[])
      : [];

    if (savedStack.length === 0) {
      log("[Tab Highlighter BG] No saved MRU stack found in storage");
      return false;
    }

    const restoredStack: number[] = [];
    for (const tabId of savedStack) {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (isTrackableUrl(tab.url)) {
          restoredStack.push(tabId);
        } else {
          log(
            `[Tab Highlighter BG] Skipping saved tab ${tabId} with untrackable URL ${tab.url}`,
          );
        }
      } catch {
        log(
          `[Tab Highlighter BG] Saved tab ${tabId} no longer exists, skipping`,
        );
      }

      if (restoredStack.length >= MAX_MRU_STACK_SIZE) {
        break;
      }
    }

    if (restoredStack.length === 0) {
      log("[Tab Highlighter BG] Saved MRU stack contained no valid tabs");
      return false;
    }

    mruStack = restoredStack;
    log("[Tab Highlighter BG] Restored MRU stack from storage:", mruStack);
    await persistMRUStack(); // Clean up any invalid entries
    return true;
  } catch (error) {
    warn("[Tab Highlighter BG] Failed to restore MRU stack:", error);
    return false;
  }
}

/**
 * Ensures we have a current active tab in the MRU stack by querying Chrome for
 * the most relevant trackable active tab.
 */
async function seedStackWithActiveTab(): Promise<void> {
  const findFirstTrackable = (tabs: chrome.tabs.Tab[]): chrome.tabs.Tab | undefined =>
    tabs.find((tab) => Boolean(tab.id) && isTrackableUrl(tab.url));

  let activeTabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  let candidate = findFirstTrackable(activeTabs);

  if (!candidate) {
    log(
      "[Tab Highlighter BG] No trackable tab in last-focused window, searching all windows",
    );
    activeTabs = await chrome.tabs.query({ active: true });
    candidate = findFirstTrackable(activeTabs);
  }

  if (candidate?.id) {
    await updateMRU(candidate.id);
  } else {
    warn(
      "[Tab Highlighter BG] Could not find any active trackable tab to seed MRU stack",
    );
  }
}

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

  await persistMRUStack();

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
async function removeFromMRU(tabId: number): Promise<void> {
  log("[Tab Highlighter BG] Tab closed:", tabId);
  mruStack = mruStack.filter((id) => id !== tabId);
  await persistMRUStack();
  log("[Tab Highlighter BG] Updated MRU stack:", mruStack);

  // Rebroadcast positions to update remaining tabs (no removed tabs in this case since tab is closed)
  await broadcastPositions([]);
}

// Listen for tab activation (this will wake up the service worker)
chrome.tabs.onActivated.addListener((activeInfo) => {
  log("[Tab Highlighter BG] onActivated event fired");
  updateMRU(activeInfo.tabId);
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  log("[Tab Highlighter BG] onRemoved event fired");
  void removeFromMRU(tabId);
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
 * Initialize MRU state when the service worker starts.
 * - Try to restore the saved stack from storage.
 * - If nothing to restore (first run/clean state), clear all indicators to avoid stale badges.
 * - Re-seed with the current active tab and broadcast positions.
 */
async function initializeMRU(): Promise<void> {
  log("[Tab Highlighter BG] Initializing MRU state");

  const restored = await restoreMRUStackFromStorage();

  // Only do a global clear when we have no persisted stack (first run or storage empty).
  if (!restored) {
    log(
      "[Tab Highlighter BG] No MRU stack restored; clearing stale indicators from all tabs",
    );

    const allTabs = await chrome.tabs.query({});
    for (const tab of allTabs) {
      if (tab.id) {
        const message: UpdatePositionMessage = {
          type: "UPDATE_POSITION",
          position: 0, // Clear stale indicators
          mruStack: [],
          timestamp: Date.now(),
        };
        await sendMessageToTab(tab.id, message);
      }
    }
  } else {
    log(
      "[Tab Highlighter BG] MRU stack restored; skipping global clear to avoid wiping indicators",
    );

    // We have a restored stack—rebroadcast it immediately to refresh indicators.
    await broadcastPositions([]);
  }

  // Ensure the currently active tab is at the front of the stack
  await seedStackWithActiveTab();
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
