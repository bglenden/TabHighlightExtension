/**
 * Debug Logging Utility
 *
 * Provides debug logging that can be toggled on/off by the user via the extension popup.
 * The debug flag is stored in chrome.storage.local and synchronized across all scripts.
 */

import { STORAGE_KEY_DEBUG } from "./constants";

// Cached debug flag (updated via storage listener)
let DEBUG = false;

/**
 * Initialize debug logging system
 * - Reads the debug flag from storage
 * - Sets up storage change listener to update flag
 */
export async function initDebug(): Promise<void> {
  try {
    // Read initial value from storage (defaults to false)
    const result = await chrome.storage.local.get(STORAGE_KEY_DEBUG);
    DEBUG = result[STORAGE_KEY_DEBUG] ?? false;

    // Listen for changes to debug flag
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes[STORAGE_KEY_DEBUG]) {
        DEBUG = changes[STORAGE_KEY_DEBUG].newValue ?? false;
        console.log(
          `[Tab Highlighter] Debug logging ${DEBUG ? "enabled" : "disabled"}`,
        );
      }
    });
  } catch {
    // If storage is unavailable, default to false
    DEBUG = false;
  }
}

/**
 * Log a debug message (only if debug mode is enabled)
 */
export function log(...args: unknown[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}

/**
 * Log a debug warning (only if debug mode is enabled)
 */
export function warn(...args: unknown[]): void {
  if (DEBUG) {
    console.warn(...args);
  }
}

/**
 * Get current debug flag status
 */
export function isDebugEnabled(): boolean {
  return DEBUG;
}

/**
 * Set debug flag (saves to storage)
 */
export async function setDebugEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_DEBUG]: enabled });
  DEBUG = enabled;
}
