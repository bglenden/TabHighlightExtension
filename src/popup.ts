/**
 * Popup script for Active Tab Highlighter
 * Provides UI for reloading all tabs and toggling debug logging
 */

import { initDebug, log, setDebugEnabled } from "./debug";

// Initialize debug logging
initDebug();

// Storage key for breadcrumb count
const STORAGE_KEY_BREADCRUMB_COUNT = "breadcrumbCount";
const DEFAULT_BREADCRUMB_COUNT = 1;

/**
 * Reloads all eligible tabs (excluding chrome:// and extension pages)
 * Returns count of reloaded and skipped tabs
 */
async function reloadEligibleTabs(
  tabs: chrome.tabs.Tab[],
): Promise<{ reloaded: number; skipped: number }> {
  let reloaded = 0;
  let skipped = 0;

  for (const tab of tabs) {
    if (
      tab.id &&
      tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://")
    ) {
      log(`[Tab Highlighter Popup] Reloading tab ${tab.id}: ${tab.url}`);
      await chrome.tabs.reload(tab.id);
      reloaded++;
    } else {
      log(
        `[Tab Highlighter Popup] Skipping tab ${tab.id}: ${tab.url || "no URL"} (restricted)`,
      );
      skipped++;
    }
  }

  log(
    `[Tab Highlighter Popup] Reloaded ${reloaded} tabs, skipped ${skipped} tabs`,
  );

  return { reloaded, skipped };
}

/**
 * Updates UI to show success status
 */
function updateUISuccess(reloaded: number, skipped: number): void {
  const button = document.getElementById("reloadBtn") as HTMLButtonElement;
  const status = document.getElementById("status") as HTMLDivElement;

  status.textContent = `✓ Reloaded ${reloaded} tabs (skipped ${skipped})`;
  status.classList.add("show");

  setTimeout(() => {
    button.disabled = false;
    button.textContent = "Reload All Tabs";
    status.classList.remove("show");
  }, 2000);
}

/**
 * Updates UI to show error status
 */
function updateUIError(error: unknown): void {
  const button = document.getElementById("reloadBtn") as HTMLButtonElement;
  const status = document.getElementById("status") as HTMLDivElement;

  status.textContent = `Error: ${error}`;
  status.style.background = "#ffebee";
  status.style.color = "#c62828";
  status.classList.add("show");

  button.disabled = false;
  button.textContent = "Reload All Tabs";
}

// Initialize debug checkbox
async function initDebugCheckbox() {
  const checkbox = document.getElementById("debugCheckbox") as HTMLInputElement;
  if (!checkbox) return;

  // Load current debug state
  const result = await chrome.storage.local.get("debugLoggingEnabled");
  checkbox.checked = result.debugLoggingEnabled ?? false;

  // Listen for changes
  checkbox.addEventListener("change", async () => {
    await setDebugEnabled(checkbox.checked);
    log(
      `[Tab Highlighter Popup] Debug logging ${checkbox.checked ? "enabled" : "disabled"}`,
    );
  });
}

// Initialize breadcrumb count radio buttons
async function initBreadcrumbCount() {
  const breadcrumb1 = document.getElementById(
    "breadcrumb1",
  ) as HTMLInputElement;
  const breadcrumb4 = document.getElementById(
    "breadcrumb4",
  ) as HTMLInputElement;

  if (!breadcrumb1 || !breadcrumb4) return;

  // Load current breadcrumb count
  const result = await chrome.storage.sync.get(STORAGE_KEY_BREADCRUMB_COUNT);
  const breadcrumbCount =
    result[STORAGE_KEY_BREADCRUMB_COUNT] ?? DEFAULT_BREADCRUMB_COUNT;

  // Set the appropriate radio button
  if (breadcrumbCount === 4) {
    breadcrumb4.checked = true;
  } else {
    breadcrumb1.checked = true;
  }

  // Handle breadcrumb count changes
  const handleBreadcrumbChange = async (count: number) => {
    await chrome.storage.sync.set({ [STORAGE_KEY_BREADCRUMB_COUNT]: count });
    log(`[Tab Highlighter Popup] Breadcrumb count changed to ${count}`);

    // Notify background script of the change
    try {
      await chrome.runtime.sendMessage({
        type: "BREADCRUMB_COUNT_CHANGE",
        count: count,
      });
    } catch (error) {
      log(`[Tab Highlighter Popup] Failed to notify background script:`, error);
    }
  };

  breadcrumb1.addEventListener("change", () => {
    if (breadcrumb1.checked) {
      handleBreadcrumbChange(1);
    }
  });

  breadcrumb4.addEventListener("change", () => {
    if (breadcrumb4.checked) {
      handleBreadcrumbChange(4);
    }
  });
}

// Initialize on load
initDebugCheckbox();
initBreadcrumbCount();

document.getElementById("reloadBtn")?.addEventListener("click", async () => {
  const button = document.getElementById("reloadBtn") as HTMLButtonElement;

  button.disabled = true;
  button.textContent = "Reloading...";

  try {
    // Query all tabs
    const allTabs = await chrome.tabs.query({});

    // Log tab details for debugging
    log(`[Tab Highlighter Popup] Found ${allTabs.length} tabs total`);

    // Reload eligible tabs
    const { reloaded, skipped } = await reloadEligibleTabs(allTabs);

    // Update UI with success
    updateUISuccess(reloaded, skipped);
  } catch (error) {
    updateUIError(error);
  }
});
