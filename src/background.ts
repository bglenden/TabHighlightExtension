/**
 * Active Tab Highlighter - Background Service Worker
 *
 * Tracks the Most Recently Used (MRU) order of tabs to create a breadcrumb trail.
 * Maintains a list of the last 4 active tabs and broadcasts their positions.
 */

// MRU stack: most recent tab IDs in order [current, 1 back, 2 back, 3 back]
let mruStack: number[] = [];
let previousMruStack: number[] = [];

/**
 * Updates the MRU stack when a tab becomes active
 */
function updateMRU(tabId: number): void {
  console.log("[Tab Highlighter BG] Tab activated:", tabId);

  // Save previous stack to detect tabs that fell off
  previousMruStack = [...mruStack];

  // Remove tabId if it already exists in the stack
  mruStack = mruStack.filter((id) => id !== tabId);

  // Add to the front
  mruStack.unshift(tabId);

  // Keep only last 4 tabs
  if (mruStack.length > 4) {
    mruStack = mruStack.slice(0, 4);
  }

  console.log("[Tab Highlighter BG] Updated MRU stack:", mruStack);

  // Find tabs that were in the previous stack but not in the new one
  const removedTabs = previousMruStack.filter((id) => !mruStack.includes(id));
  if (removedTabs.length > 0) {
    console.log("[Tab Highlighter BG] Tabs removed from MRU:", removedTabs);
  }

  // Broadcast updated positions to all tabs
  broadcastPositions(removedTabs);
}

/**
 * Broadcasts MRU position to each tab's content script
 */
async function broadcastPositions(removedTabs: number[] = []): Promise<void> {
  console.log("[Tab Highlighter BG] Broadcasting positions to tabs...");

  // Send positions to tabs in the MRU stack
  for (let index = 0; index < mruStack.length; index++) {
    const tabId = mruStack[index];
    const position = index + 1; // 1-based: 1=current, 2=1 back, 3=2 back, 4=3 back

    console.log(
      `[Tab Highlighter BG] Sending position ${position} to tab ${tabId}`,
    );

    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "UPDATE_POSITION",
        position: position,
        mruStack: [...mruStack], // Include full stack for debugging
        timestamp: Date.now(),
      });
      console.log(`[Tab Highlighter BG] ✓ Successfully sent to tab ${tabId}`);
    } catch {
      // Tab might not have content script loaded yet, or be a chrome:// page
      // This is normal and not an error - just means the tab hasn't loaded the content script yet
      console.log(
        `[Tab Highlighter BG] ⓘ Tab ${tabId} not ready (content script not loaded yet - this is normal)`,
      );
    }
  }

  // Tell tabs that were removed from MRU to clear their indicators
  for (const tabId of removedTabs) {
    console.log(
      `[Tab Highlighter BG] Telling tab ${tabId} to remove indicator (fell off MRU stack)`,
    );

    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "UPDATE_POSITION",
        position: 0, // 0 means remove indicator
        mruStack: [...mruStack],
        timestamp: Date.now(),
      });
      console.log(`[Tab Highlighter BG] ✓ Successfully sent to tab ${tabId}`);
    } catch {
      console.log(
        `[Tab Highlighter BG] ⓘ Tab ${tabId} not ready (this is normal)`,
      );
    }
  }

  console.log("[Tab Highlighter BG] Broadcast complete");
}

/**
 * Removes a tab from the MRU stack when it's closed
 */
function removeFromMRU(tabId: number): void {
  console.log("[Tab Highlighter BG] Tab closed:", tabId);
  mruStack = mruStack.filter((id) => id !== tabId);
  console.log("[Tab Highlighter BG] Updated MRU stack:", mruStack);

  // Rebroadcast positions to update remaining tabs (no removed tabs in this case since tab is closed)
  broadcastPositions([]);
}

// Listen for tab activation (this will wake up the service worker)
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("[Tab Highlighter BG] onActivated event fired");
  updateMRU(activeInfo.tabId);
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("[Tab Highlighter BG] onRemoved event fired");
  removeFromMRU(tabId);
});

// Listen for tab updates (e.g., navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only update MRU if the tab is currently active
  if (tab.active && changeInfo.status === "complete") {
    console.log("[Tab Highlighter BG] onUpdated event fired for active tab");
    updateMRU(tabId);
  }
});

// Listen for window focus changes (helps wake up service worker)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    console.log(
      "[Tab Highlighter BG] Window focus changed, checking active tab",
    );
    chrome.tabs.query({ active: true, windowId: windowId }).then((tabs) => {
      if (tabs[0]) {
        updateMRU(tabs[0].id!);
      }
    });
  }
});

/**
 * Clears all stale indicators from all tabs and initializes MRU with active tab
 */
async function initializeMRU(): Promise<void> {
  console.log("[Tab Highlighter BG] Initializing - clearing stale indicators from all tabs");

  // Get ALL tabs and clear any stale indicators
  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: "UPDATE_POSITION",
          position: 0, // Clear all indicators
          mruStack: [],
          timestamp: Date.now(),
        });
      } catch {
        // Tab might not have content script loaded - this is fine
      }
    }
  }

  console.log("[Tab Highlighter BG] Cleared stale indicators, now initializing with active tab");

  // Now initialize with currently active tab
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTabs[0]) {
    updateMRU(activeTabs[0].id!);
  }
}

// Service worker startup
chrome.runtime.onStartup.addListener(() => {
  console.log("[Tab Highlighter BG] Browser startup detected");
  initializeMRU();
});

// Service worker install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tab Highlighter BG] Extension installed/updated");
  initializeMRU();
});

// Initialize on service worker first load
console.log("[Tab Highlighter BG] Background worker script loaded");
initializeMRU();
