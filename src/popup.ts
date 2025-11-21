/**
 * Popup script for Active Tab Highlighter
 * Provides UI for reloading all tabs and toggling debug logging
 */

import { initDebug, log, setDebugEnabled } from "./debug";

// Initialize debug logging
initDebug();

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
  const checkbox = document.getElementById(
    "debugCheckbox",
  ) as HTMLInputElement;
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

// Initialize on load
initDebugCheckbox();

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
