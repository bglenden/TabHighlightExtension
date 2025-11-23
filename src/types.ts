/**
 * Shared type definitions for the Active Tab Highlighter extension
 */

/**
 * MRU position: 1-4 for tabs in the stack, 0 for no position
 */
export type MRUPosition = 0 | 1 | 2 | 3 | 4;

/**
 * Message to update a tab's position indicator
 */
export interface UpdatePositionMessage {
  type: "UPDATE_POSITION";
  position: MRUPosition;
  mruStack: number[];
  timestamp: number;
}

/**
 * Message to query the current position of a tab
 */
export interface GetMyPositionMessage {
  type: "GET_MY_POSITION";
}

/**
 * Response to GET_MY_POSITION query
 */
export interface GetMyPositionResponse {
  success: boolean;
  position: MRUPosition;
  mruStack: number[];
}

/**
 * Response to UPDATE_POSITION message
 */
export interface UpdatePositionResponse {
  success: boolean;
  currentPosition: MRUPosition;
  documentTitle: string;
}

/**
 * Message to change breadcrumb count setting
 */
export interface BreadcrumbCountChangeMessage {
  type: "BREADCRUMB_COUNT_CHANGE";
  count: 1 | 4;
}

/**
 * Response to breadcrumb count change
 */
export interface BreadcrumbCountChangeResponse {
  success: boolean;
}

/**
 * Union type for all extension messages
 */
export type ExtensionMessage =
  | UpdatePositionMessage
  | GetMyPositionMessage
  | BreadcrumbCountChangeMessage;

/**
 * MRU indicator emojis mapped by position
 */
export const INDICATORS: Record<Exclude<MRUPosition, 0>, string> = {
  1: "🟦", // Blue - current/active
  2: "🟩", // Green - recent
  3: "🟧", // Orange - older
  4: "🟥", // Red - oldest
} as const;

/**
 * Maximum number of tabs tracked in MRU stack
 */
export const MAX_MRU_STACK_SIZE = 4;
