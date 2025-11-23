/**
 * Shared constants for Active Tab Highlighter extension
 */

// Storage keys
export const STORAGE_KEYS = {
  BREADCRUMB_COUNT: "breadcrumbCount",
  DEBUG_LOGGING: "debugLoggingEnabled",
  MRU_STACK: "mruStack",
} as const;

// Default values
export const DEFAULTS = {
  BREADCRUMB_COUNT: 1,
  DEBUG_LOGGING: false,
} as const;

// Export individual constants for backward compatibility
export const STORAGE_KEY_BREADCRUMB_COUNT = STORAGE_KEYS.BREADCRUMB_COUNT;
export const STORAGE_KEY_DEBUG = STORAGE_KEYS.DEBUG_LOGGING;
export const DEFAULT_BREADCRUMB_COUNT = DEFAULTS.BREADCRUMB_COUNT;
