/**
 * Storage utility functions for Active Tab Highlighter
 * Provides type-safe access to chrome.storage with defaults
 */

import { STORAGE_KEYS, DEFAULTS } from "./constants";

/**
 * Get breadcrumb count setting
 * @returns Breadcrumb count (1 or 4)
 */
export async function getBreadcrumbCount(): Promise<1 | 4> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.BREADCRUMB_COUNT);
    const value = result[STORAGE_KEYS.BREADCRUMB_COUNT];
    return value === 1 || value === 4 ? value : DEFAULTS.BREADCRUMB_COUNT;
  } catch (error) {
    console.error("[Storage] Failed to get breadcrumb count:", error);
    return DEFAULTS.BREADCRUMB_COUNT;
  }
}

/**
 * Set breadcrumb count setting
 * @param count - Breadcrumb count (1 or 4)
 */
export async function setBreadcrumbCount(count: 1 | 4): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEYS.BREADCRUMB_COUNT]: count });
  } catch (error) {
    console.error("[Storage] Failed to set breadcrumb count:", error);
    throw error;
  }
}

/**
 * Get debug logging enabled state
 * @returns Whether debug logging is enabled
 */
export async function getDebugEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DEBUG_LOGGING);
    return result[STORAGE_KEYS.DEBUG_LOGGING] ?? DEFAULTS.DEBUG_LOGGING;
  } catch (error) {
    console.error("[Storage] Failed to get debug enabled:", error);
    return DEFAULTS.DEBUG_LOGGING;
  }
}

/**
 * Set debug logging enabled state
 * @param enabled - Whether to enable debug logging
 */
export async function setDebugEnabled(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.DEBUG_LOGGING]: enabled });
  } catch (error) {
    console.error("[Storage] Failed to set debug enabled:", error);
    throw error;
  }
}

/**
 * Get persisted MRU stack
 * @returns Array of tab IDs in MRU order
 */
export async function getMruStack(): Promise<number[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.MRU_STACK);
    const stack = result[STORAGE_KEYS.MRU_STACK];
    return Array.isArray(stack) ? stack : [];
  } catch (error) {
    console.error("[Storage] Failed to get MRU stack:", error);
    return [];
  }
}

/**
 * Save MRU stack to storage
 * @param stack - Array of tab IDs in MRU order
 */
export async function setMruStack(stack: number[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.MRU_STACK]: stack });
  } catch (error) {
    console.error("[Storage] Failed to set MRU stack:", error);
    throw error;
  }
}
