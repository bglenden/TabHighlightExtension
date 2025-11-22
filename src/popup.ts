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
 * Builds a detailed report of tab discovery for debugging
 */
function buildTabDiscoveryReport(
  allTabs: chrome.tabs.Tab[],
  discardedTabs: chrome.tabs.Tab[],
  windows: chrome.windows.Window[],
): string {
  let report = `=== TAB DISCOVERY REPORT ===\n`;
  report += `Total windows: ${windows.length}\n`;
  report += `Window details: ${windows.map((w) => `${w.id}(${w.type})`).join(", ")}\n`;
  report += `Total tabs found: ${allTabs.length}\n`;
  report += `Discarded tabs: ${discardedTabs.length}\n\n`;

  if (discardedTabs.length > 0) {
    report += `=== DISCARDED TABS ===\n`;
    discardedTabs.forEach((t, i) => {
      report += `${i + 1}. [${t.id}] ${t.title?.substring(0, 40) || "No title"}\n`;
      report += `   URL: ${t.url?.substring(0, 50) || "No URL"}\n`;
      report += `   Window: ${t.windowId}\n\n`;
    });
  }

  report += `=== ALL TABS ===\n\n`;
  allTabs.forEach((t, i) => {
    report += `${i + 1}. [${t.id}] ${t.title?.substring(0, 40) || "No title"}\n`;
    report += `   URL: ${t.url?.substring(0, 50) || "No URL"}\n`;
    report += `   Active: ${t.active}, Discarded: ${t.discarded}, Status: ${t.status}\n`;
    report += `   Window: ${t.windowId}\n\n`;
  });

  return report;
}

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
  const debug = document.getElementById("debug") as HTMLTextAreaElement;
  const copyBtn = document.getElementById("copyBtn") as HTMLButtonElement;

  button.disabled = true;
  button.textContent = "Reloading...";

  try {
    // Query all possible tab states
    const allTabs = await chrome.tabs.query({});
    const discardedTabs = await chrome.tabs.query({ discarded: true });
    const windows = await chrome.windows.getAll({ populate: false });

    // Build and display debug report
    const debugInfo = buildTabDiscoveryReport(allTabs, discardedTabs, windows);
    debug.value = debugInfo;
    debug.style.display = "block";

    // Setup copy button
    copyBtn.style.display = "block";
    copyBtn.onclick = () => {
      debug.select();
      document.execCommand("copy");
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy Debug Info";
      }, 2000);
    };

    // Log tab details for debugging
    log(`[Tab Highlighter Popup] Found ${allTabs.length} tabs total`);
    log(
      `[Tab Highlighter Popup] Tab details:`,
      allTabs.map((t) => ({
        id: t.id,
        url: t.url?.substring(0, 60),
        title: t.title?.substring(0, 40),
        active: t.active,
        discarded: t.discarded,
        status: t.status,
        windowId: t.windowId,
      })),
    );

    // Reload eligible tabs
    const { reloaded, skipped } = await reloadEligibleTabs(allTabs);

    // Update UI with success
    updateUISuccess(reloaded, skipped);
  } catch (error) {
    updateUIError(error);
  }
});
