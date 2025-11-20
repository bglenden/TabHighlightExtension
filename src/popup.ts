/**
 * Popup script for Active Tab Highlighter
 * Provides UI for reloading all tabs
 */

document.getElementById("reloadBtn")?.addEventListener("click", async () => {
  const button = document.getElementById("reloadBtn") as HTMLButtonElement;
  const status = document.getElementById("status") as HTMLDivElement;
  const debug = document.getElementById("debug") as HTMLTextAreaElement;

  button.disabled = true;
  button.textContent = "Reloading...";

  try {
    // Query all possible tab states
    const allTabs = await chrome.tabs.query({});
    const discardedTabs = await chrome.tabs.query({ discarded: true });
    const windows = await chrome.windows.getAll({ populate: false });

    let reloadedCount = 0;
    let skippedCount = 0;

    // Show debug info in UI
    let debugInfo = `=== TAB DISCOVERY REPORT ===\n`;
    debugInfo += `Total windows: ${windows.length}\n`;
    debugInfo += `Window details: ${windows.map((w) => `${w.id}(${w.type})`).join(", ")}\n`;
    debugInfo += `Total tabs found: ${allTabs.length}\n`;
    debugInfo += `Discarded tabs: ${discardedTabs.length}\n\n`;

    if (discardedTabs.length > 0) {
      debugInfo += `=== DISCARDED TABS ===\n`;
      discardedTabs.forEach((t, i) => {
        debugInfo += `${i + 1}. [${t.id}] ${t.title?.substring(0, 40) || "No title"}\n`;
        debugInfo += `   URL: ${t.url?.substring(0, 50) || "No URL"}\n`;
        debugInfo += `   Window: ${t.windowId}\n\n`;
      });
    }

    debugInfo += `=== ALL TABS ===\n\n`;
    allTabs.forEach((t, i) => {
      debugInfo += `${i + 1}. [${t.id}] ${t.title?.substring(0, 40) || "No title"}\n`;
      debugInfo += `   URL: ${t.url?.substring(0, 50) || "No URL"}\n`;
      debugInfo += `   Active: ${t.active}, Discarded: ${t.discarded}, Status: ${t.status}\n`;
      debugInfo += `   Window: ${t.windowId}\n\n`;
    });

    const tabs = allTabs;

    debug.value = debugInfo;
    debug.style.display = "block";

    const copyBtn = document.getElementById("copyBtn") as HTMLButtonElement;
    copyBtn.style.display = "block";
    copyBtn.onclick = () => {
      debug.select();
      document.execCommand("copy");
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy Debug Info";
      }, 2000);
    };

    console.log(`[Tab Highlighter Popup] Found ${tabs.length} tabs total`);
    console.log(
      `[Tab Highlighter Popup] Tab details:`,
      tabs.map((t) => ({
        id: t.id,
        url: t.url?.substring(0, 60),
        title: t.title?.substring(0, 40),
        active: t.active,
        discarded: t.discarded,
        status: t.status,
        windowId: t.windowId,
      })),
    );

    for (const tab of tabs) {
      if (
        tab.id &&
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ) {
        console.log(
          `[Tab Highlighter Popup] Reloading tab ${tab.id}: ${tab.url}`,
        );
        await chrome.tabs.reload(tab.id);
        reloadedCount++;
      } else {
        console.log(
          `[Tab Highlighter Popup] Skipping tab ${tab.id}: ${tab.url || "no URL"} (restricted)`,
        );
        skippedCount++;
      }
    }

    console.log(
      `[Tab Highlighter Popup] Reloaded ${reloadedCount} tabs, skipped ${skippedCount} tabs`,
    );
    status.textContent = `✓ Reloaded ${reloadedCount} tabs (skipped ${skippedCount})`;
    status.classList.add("show");

    setTimeout(() => {
      button.disabled = false;
      button.textContent = "Reload All Tabs";
      status.classList.remove("show");
    }, 2000);
  } catch (error) {
    status.textContent = `Error: ${error}`;
    status.style.background = "#ffebee";
    status.style.color = "#c62828";
    status.classList.add("show");

    button.disabled = false;
    button.textContent = "Reload All Tabs";
  }
});
