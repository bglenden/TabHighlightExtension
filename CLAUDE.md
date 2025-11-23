# Active Tab Highlighter - Technical Documentation

## Current Status (v1.5.0)

### Production Release ✅

**Version**: 1.5.0 (Production)
**Status**: MRU breadcrumb trail with configurable count - stable, refactored codebase, semantic versioning adopted
**Release Date**: 2025-11-23
**GitHub**: https://github.com/bglenden/TabHighlightExtension

### What's Working

✅ **Configurable Breadcrumb Count**: Choose between 1 or 4 breadcrumbs (default: 1)
✅ **Single Breadcrumb Mode**: Only active tab shows 🟦 indicator
✅ **Four Breadcrumb Mode**: Tracks last 4 active tabs with positions 1-4
✅ **Color-coded Indicators**: 🟦 (blue/1), 🟩 (green/2), 🟧 (orange/3), 🟥 (red/4)
✅ **Persistent Settings**: Breadcrumb count preference saved via chrome.storage.sync
✅ **Title indicators**: Colored square emoji appears at the BEGINNING of tab titles
✅ **Background service worker**: Maintains MRU stack and broadcasts position updates
✅ **All websites work correctly**: Including x.com (Twitter), Google, CNN, and all tested sites
✅ **Dynamic title handling**: Properly handles sites that change their titles frequently
✅ **Extension context invalidation handling**: Gracefully handles extension reloads without errors
✅ **Debug logging toggle**: User-controlled debug logging via popup checkbox
✅ **Code quality**: ESLint configured, lints with 0 errors and 0 warnings
✅ **URL filtering**: Only tracks http:// and https:// URLs to avoid errors on protected pages
✅ **Bookmark-safe**: No favicon modification prevents bookmark contamination
✅ **Real-time updates**: Changing breadcrumb count instantly updates all tabs
✅ **Refactored codebase**: Clean architecture with zero code duplication (v1.5.0)
✅ **Type-safe storage**: Centralized storage utilities with full type safety (v1.5.0)
✅ **Unit tests**: 42 tests covering constants, types, and storage utilities (v1.5.0)

### Known Limitations

⚠️ **Chrome internal pages**: Cannot run on `chrome://` URLs (browser security restriction)
⚠️ **Extension pages**: Cannot run on Chrome Web Store or `chrome://extensions/`
⚠️ **New Tab page**: Cannot modify default new tab (browser security restriction)
⚠️ **Stale indicators**: After reloading the extension, **refresh tabs** to clear old indicators and activate new content scripts

These are **browser security features**, not bugs. All Chrome extensions have these limitations.

### Design Decision: Favicon Modification Removed (v1.3.20+)

**Decision Date**: 2025-11-20
**Reason**: Favicon modification caused bookmark contamination - when users bookmarked pages, Chrome captured the MRU favicon (🟢1, 🟡2, etc.) instead of the original site favicon, polluting bookmark bars and menus.

**What Changed**:

- ❌ **Removed**: Favicon replacement with numbered colored circles
- ✅ **Kept**: Title indicators with colored square emoji (🟩🟦🟧🟥)

**How to Revert** (if needed for personal use):

```bash
git checkout v1.3.19-last-with-favicons
npm install
npm run build
```

The tagged version `v1.3.19-last-with-favicons` is the last commit with full favicon modification functionality, including:

- SVG favicon generation with numbered circles
- Favicon enforcement with 500ms interval
- Original favicon storage and restoration
- MutationObserver for favicon changes

### Recent Features & Changes

**v1.5.0 - Code Refactoring, Test Infrastructure, Semantic Versioning & Automated Releases (2025-11-23)**

- **Feature**: Major internal refactoring for improved maintainability and code quality
- **Versioning Change**: Adopted semantic versioning (MAJOR.MINOR.PATCH) going forward
- **Zero Code Duplication**:
  - Created `src/constants.ts` with all storage keys and defaults in one place
  - Eliminated duplicate constant definitions across 3 files (background, content, popup)
- **Type-Safe Storage Utilities**:
  - Created `src/storage.ts` with typed helper functions
  - `getBreadcrumbCount()`, `setBreadcrumbCount()`, `getDebugEnabled()`, `setDebugEnabled()`, `getMruStack()`, `setMruStack()`
  - All storage operations now centralized with consistent error handling
  - Full TypeScript type safety (e.g., breadcrumbCount is `1 | 4`, not just `number`)
- **Complete Type Definitions**:
  - Added `BreadcrumbCountChangeMessage` type to `types.ts`
  - All message types now properly defined with 100% type coverage
- **Unit Test Infrastructure**:
  - Added Jest with TypeScript support
  - Created 42 unit tests across 3 test suites
  - Tests cover constants, types, and storage utilities
  - All tests passing with full coverage of utility functions
  - Test files: `__tests__/types.test.ts`, `__tests__/constants.test.ts`, `__tests__/storage.test.ts`
- **Pre-commit Hook**:
  - Simplified to run lint and tests only
  - No longer requires version bumps on every commit
  - Supports semantic versioning workflow
- **Organizational Improvements**:
  - Moved `popup.html` to `src/` directory for consistency
  - All source files now in `src/` folder
  - Added `coverage/` to `.gitignore`
- **Release Tagging & Automation**:
  - Tagged historical releases: v1.1.0, v1.3.0, v1.3.33, v1.4.0, v1.5.0
  - GitHub releases page now shows major milestones
  - Added GitHub Actions workflow for automatic release creation
  - Releases auto-created when version tags are pushed
- **Benefits**:
  - Easier to maintain and extend
  - Reduced chance of bugs from inconsistent constants
  - Type safety prevents invalid values
  - Tests catch regressions early
  - Clean, professional codebase architecture
  - Standard versioning for future users
- **Bundle Size Impact**: Minimal (+630 bytes total due to utility abstractions)
  - background.js: 5.21 KiB → 5.46 KiB (+250 bytes)
  - content.js: 3.53 KiB → 3.59 KiB (+60 bytes)
  - popup.js: 2.52 KiB → 2.84 KiB (+320 bytes)
- **User Impact**: None - all changes are internal improvements

**v1.4.0 - Cleaner Popup UI (2025-01-20)**

- **Feature**: Removed debug report display from popup for cleaner interface
- **UI Simplification**: Removed debug textarea and copy button that appeared after "Reload All Tabs"
- **Rationale**: Debug information was cluttering the popup and not useful for most users
- **Developer Impact**: Debug logging still available via browser console (F12) when enabled
- **Implementation**:
  - Removed `<textarea id="debug">` and `<button id="copyBtn">` from `popup.html`
  - Removed `buildTabDiscoveryReport()` function from `popup.ts`
  - Removed debug report building and display logic from reload button handler
  - Simplified tab reload flow to only show success/error status message
- **Benefits**: Cleaner, more professional popup UI; faster reload operation; less visual clutter
- **Version**: Bumped to 1.4.0 (minor version) for significant UI change

**v1.3.34 - Visual Breadcrumb Indicators in Popup (2025-01-20)**

- **Feature**: Added visual color indicators in popup to show what each breadcrumb mode looks like
- **UI Enhancement**: Radio button labels now display the actual colored squares used:
  - Single breadcrumb mode shows: 🟦
  - Four breadcrumb mode shows: 🟦🟩🟧🟥
- **User Experience**: Users can see exactly what indicators will appear before selecting a mode
- **Implementation**:
  - Updated `popup.html` with flexbox layout for indicator display
  - Added emoji spans next to each radio button option
  - Improved visual alignment and spacing
- **Benefits**: Reduces confusion about what each mode does, provides immediate visual feedback

**v1.3.33 - Configurable Breadcrumb Count (2025-01-20)**

- **Feature**: Added user-configurable breadcrumb count setting
- **Options**: Choose between 1 breadcrumb (default) or 4 breadcrumbs
- **UI**: Radio buttons in extension popup to select mode
- **Storage**: Settings persist across browser restarts using `chrome.storage.sync`
- **Implementation**:
  - `popup.html`: Added breadcrumb count radio button selector
  - `popup.ts`: Load/save setting, notify background script of changes
  - `background.ts`: Load setting on startup, trim MRU stack to configured size, handle setting changes
  - `content.ts`: Load setting, respect breadcrumb count when displaying indicators, listen for storage changes
  - Real-time updates: When setting changes, background script immediately rebroadcasts positions to all tabs
- **User Experience**:
  - Single breadcrumb mode shows only 🟦 on active tab
  - Four breadcrumb mode shows full color-coded trail (🟦🟩🟧🟥)
  - Setting syncs across devices if Chrome sync is enabled

### Recent Bug Fixes (v1.3.12-1.3.19)

**Extension Context Invalidation Errors - RESOLVED (v1.3.18)**

- **Problem**: When extension was reloaded, old content scripts logged "Extension context invalidated" errors repeatedly
- **Root Cause**: Old content scripts tried to communicate with new background script, but extension context was invalid
- **Solution**:
  - Added three-layer validation before attempting `chrome.runtime.sendMessage()`
  - Set `extensionContextInvalidated` flag immediately when context is invalid
  - Call `handleContextInvalidation()` to clean up observers and intervals
  - Added `.catch()` handler to prevent unhandled promise rejections
- **Status**: ✅ No errors on extension reload, clean shutdown message displayed

**Stale MRU Indicators - RESOLVED (v1.3.18)**

- **Problem**: Tabs showed incorrect position indicators after extension reload
- **Root Cause**: Old content scripts retained their position state and weren't receiving updates
- **Solution**: Users must refresh tabs after reloading extension to get fresh content scripts
- **Workaround**: Added clear user guidance in README.md about refreshing tabs
- **Status**: ✅ Works correctly after tab refresh

## Overview

This Chrome extension tracks your Most Recently Used (MRU) tabs and displays color-coded position indicators, creating a breadcrumb trail of your browsing session. Users can choose between single breadcrumb mode (showing only the active tab) or four breadcrumb mode (showing the last 4 active tabs with color-coded indicators).

## Architecture

### Project Structure

```
/TabHighlightExtension
├── src/
│   ├── content.ts          # Content script - manages tab indicators
│   ├── background.ts       # Service worker - tracks MRU stack
│   ├── popup.ts            # Extension popup - reload functionality
│   ├── popup.html          # Extension popup HTML (v1.5.0 - moved to src/)
│   ├── constants.ts        # Shared constants (storage keys, defaults) (v1.5.0)
│   ├── storage.ts          # Storage utilities (type-safe helpers) (v1.5.0)
│   ├── types.ts            # Type definitions
│   └── debug.ts            # Debug logging utility
├── __tests__/              # Unit tests (v1.5.0)
│   ├── types.test.ts       # Tests for type definitions
│   ├── constants.test.ts   # Tests for constants
│   └── storage.test.ts     # Tests for storage utilities
├── dist/                    # Build output (gitignored)
│   ├── content.js          # Compiled content script (~3.59 KiB minified)
│   ├── background.js       # Compiled background worker (~5.46 KiB minified)
│   ├── popup.js            # Compiled popup script (~2.84 KiB minified)
│   ├── popup.html          # Popup UI
│   ├── manifest.json       # Copied manifest
│   └── icons/              # Copied icon files
├── icons/
│   ├── icon16.png          # 16x16 extension icon
│   ├── icon48.png          # 48x48 extension icon
│   └── icon128.png         # 128x128 extension icon
├── manifest.json           # Chrome extension manifest (v3)
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript compiler configuration
├── webpack.config.cjs      # Webpack bundler configuration (CommonJS)
├── jest.config.cjs         # Jest test configuration (v1.5.0)
├── eslint.config.js        # ESLint configuration (flat config)
├── .gitignore              # Git ignore rules
├── README.md               # User documentation
└── CLAUDE.md               # Technical documentation (this file)
```

### Technology Stack

- **TypeScript 5.4+**: Type-safe JavaScript with modern features
- **Webpack 5**: Module bundler for compiling and packaging
- **ESLint 9**: Code quality and linting with TypeScript support
- **Chrome Extension Manifest V3**: Latest extension platform
- **Chrome Storage API**: Persistent storage for user settings (chrome.storage.sync)
- **Page Visibility API**: Browser API for detecting tab visibility changes
- **MutationObserver API**: DOM API for monitoring title changes
- **Jest**: Unit testing framework with TypeScript support (v1.5.0)

## Technical Design

### Core Mechanism

The extension uses a **content script** that runs on every webpage (`<all_urls>`). This approach was chosen because:

1. **Content scripts can modify page content** - Including the document title
2. **No special permissions needed** - Title modification doesn't require sensitive permissions
3. **Works on all sites** - Runs universally without site-specific configuration
4. **Immediate execution** - Runs at `document_start` for instant feedback

### Key Components

#### 1. Content Script (`src/content.ts`)

The main logic implements three core functions:

**State Management:**

- `originalTitle: string` - Stores the page's original title before modification
- `isIndicatorActive: boolean` - Tracks whether the indicator is currently applied

**Core Functions:**

- `loadBreadcrumbCount()` - Loads breadcrumb count setting from chrome.storage.sync
- `setPosition(position)` - Sets MRU position indicator, respects breadcrumb count setting
- `removeIndicator()` - Removes indicator from title
- `verifyPosition()` - Queries background script for correct position (self-healing)
- `init()` - Initializes the extension, loads settings, sets up observers

**Title Change Handling:**
The extension uses a `MutationObserver` to watch for title changes made by the webpage itself (e.g., notification counters, dynamic updates). This ensures:

- The indicator persists even when the page updates its own title
- The original title is properly tracked and restored
- No conflicts with page-initiated title changes

**Settings Management:**
The extension uses `chrome.storage.sync` for persistent settings:

- Breadcrumb count setting (1 or 4) is stored and synced across devices
- Content scripts listen for storage changes via `chrome.storage.onChanged`
- Settings load on extension initialization and update in real-time
- Default to 1 breadcrumb if no setting exists

#### 2. Background Service Worker (`src/background.ts`)

Manages the MRU stack and broadcasts position updates:

**Core Functions:**

- `loadBreadcrumbCount()` - Loads breadcrumb count setting from storage on startup
- `updateMRU(tabId)` - Updates MRU stack when tab becomes active, trims to breadcrumb count
- `broadcastPositions()` - Sends position updates to all tabs
- `removeFromMRU(tabId)` - Removes tab from stack when closed
- Message handler for `BREADCRUMB_COUNT_CHANGE` - Handles setting changes from popup

**Event Listeners:**

- `chrome.tabs.onActivated` - Tab becomes active
- `chrome.tabs.onRemoved` - Tab is closed
- `chrome.tabs.onUpdated` - Tab navigates or loads
- `chrome.windows.onFocusChanged` - Window focus changes
- `chrome.runtime.onMessage` - Messages from content scripts and popup

#### 3. Popup Script (`src/popup.ts`)

Provides UI for user settings:

**Features:**

- Radio buttons for selecting breadcrumb count (1 or 4)
- Visual color indicators showing what each mode displays (🟦 or 🟦🟩🟧🟥)
- Checkbox for debug logging toggle
- Button to reload all tabs
- Status message showing reload results (success/error)
- Loads current settings on open
- Saves settings to `chrome.storage.sync`
- Notifies background script of changes via `chrome.runtime.sendMessage`

**Removed in v1.4.0:**

- Debug textarea displaying tab discovery report
- Copy button for debug information
- Tab discovery report generation

#### 4. MRU Stack Management

The background service worker maintains an array of tab IDs in MRU order:

- Most recent tab at index 0 (position 1)
- Second most recent at index 1 (position 2)
- And so on...
- Stack size limited by breadcrumb count setting (1 or 4)
- Stack persisted to `chrome.storage.local` for service worker restarts

#### 3. Title Management Strategy

The extension implements careful title management:

```typescript
// When adding position indicator (e.g., position 1 = 🟦)
const indicator = INDICATORS[position]; // Get appropriate colored square
originalTitle = document.title;
document.title = indicator + document.title;

// When removing indicator
document.title = originalTitle;
```

**Edge Cases Handled:**

- Page title changes while indicator is active → Update original title, reapply indicator
- Breadcrumb count changes → Content scripts listen for storage changes and update display
- Position beyond breadcrumb count → Remove indicator
- Single breadcrumb mode with position > 1 → Remove indicator (only show position 1)

## Build System

### Webpack Configuration

**Entry Point:** `src/content.ts`

**Output:** `dist/content.js`

**Loaders:**

- `ts-loader`: Compiles TypeScript to JavaScript

**Plugins:**

- `CopyWebpackPlugin`: Copies manifest.json and icons to dist/

**Module Resolution:**

- Resolves `.ts` and `.js` extensions
- Excludes node_modules from compilation

### TypeScript Configuration

**Target:** ES2020 (modern browser features)

**Module System:** ESNext (for tree-shaking)

**Strict Mode:** Enabled (maximum type safety)

**Type Definitions:** `@types/chrome` for Chrome Extension APIs

## API Usage

### Chrome Extension APIs

**Manifest V3 Features Used:**

- `content_scripts`: Inject content.js into all pages
- `matches: ["<all_urls>"]`: Run on all websites
- `run_at: "document_start"`: Execute as early as possible
- `background.service_worker`: Tracks MRU stack and coordinates updates
- `permissions: ["storage"]`: For persistent settings (chrome.storage.sync/local)
- `permissions: ["tabs"]`: For tab activation tracking
- `host_permissions: ["<all_urls>"]`: For content script injection

### Web Platform APIs

#### Page Visibility API

```typescript
document.addEventListener("visibilitychange", handleVisibilityChange);
if (document.hidden) {
  /* tab is inactive */
}
```

**Browser Support:** Universal (Chrome, Firefox, Safari, Edge)

**Performance:** Event-driven (no polling), minimal overhead

#### Chrome Storage API

```typescript
// Save breadcrumb count setting
await chrome.storage.sync.set({ breadcrumbCount: 4 });

// Load breadcrumb count setting
const result = await chrome.storage.sync.get("breadcrumbCount");
const count = result.breadcrumbCount ?? 1; // Default to 1

// Listen for setting changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.breadcrumbCount) {
    const newCount = changes.breadcrumbCount.newValue;
    // Update behavior based on new setting
  }
});
```

**Storage Areas:**

- `chrome.storage.sync`: Settings that sync across devices (breadcrumb count, debug logging)
- `chrome.storage.local`: Local-only data (MRU stack persistence for service worker restarts)

**Performance:** Fast, event-driven updates via `onChanged` listener

#### MutationObserver API

```typescript
const titleObserver = new MutationObserver((mutations) => {
  // Handle title element changes
});
titleObserver.observe(titleElement, {
  childList: true,
  subtree: true,
});
```

**Purpose:** Detect when webpage modifies its own title

**Performance:** Efficient, only observes specific DOM node

## Performance Considerations

### Resource Usage

- **Memory:** Minimal (~12.5 KiB minified total: 5.21 KiB background, 3.77 KiB popup, 3.53 KiB content)
- **CPU:** Event-driven (only runs on tab activation, no polling)
- **Network:** None (no external requests)
- **DOM Impact:** Only modifies document.title (lightweight)
- **Storage:** Minimal (a few bytes for settings)

### Optimization Strategies

1. **Early execution** (`document_start`) - Indicator appears immediately
2. **Event-driven architecture** - No polling or timers
3. **State tracking** - Prevents redundant operations
4. **Minimal DOM manipulation** - Only title changes, no visual elements

## Security & Privacy

### Security Model

- **No external requests** - All code runs locally
- **No data collection** - No analytics, tracking, or telemetry
- **No permissions required** - Doesn't access sensitive APIs
- **Content script isolation** - Cannot access extension internals

### Privacy

- **No user data stored** - Operates entirely in-memory
- **No network communication** - Fully offline
- **No tracking** - No identifiers or fingerprinting
- **Open source** - Code is fully auditable

## Extension Lifecycle

### Installation Flow

1. User loads unpacked extension in Chrome
2. Chrome parses manifest.json
3. Content script is injected into all existing tabs
4. Content script initializes and adds indicator if tab is active

### Runtime Flow

1. User switches to a tab → `visibilitychange` event fires
2. Event handler checks `document.hidden`
3. If visible: Add 🟢 indicator to title
4. If hidden: Remove indicator and restore original title
5. If page changes title: MutationObserver updates stored original title

### Update Flow

1. Rebuild with `npm run build`
2. Click "Update" in chrome://extensions/
3. Chrome reloads the extension
4. Content scripts restart in all tabs

## Development Workflow

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/bglenden/TabHighlightExtension.git
   cd TabHighlightExtension
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist/` folder

### Build Commands

- `npm run build` - Production build (minified)
- `npm run dev` - Development build with watch mode (auto-rebuilds on file changes)
- `npm run clean` - Remove dist/ directory
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm test` - Run unit tests (v1.5.0)
- `npm run test:watch` - Run tests in watch mode (v1.5.0)
- `npm run test:coverage` - Run tests with coverage report (v1.5.0)

### CI/CD

**Automated Release Creation:**

- `.github/workflows/release.yml` - Automatically creates GitHub releases when version tags are pushed
- Triggered by: `git push --tags` (for tags matching `v*.*.*` pattern)
- Uses tag annotation message as release notes
- No manual intervention required

### Making Changes

1. **Edit source files** in `src/` directory
2. **Run development build** with `npm run dev` for auto-rebuild
3. **Reload extension** in `chrome://extensions/` (click refresh icon on the extension card)
4. **Test changes** by switching between tabs
5. **Check console** for errors (open DevTools on any page, content script runs in page context)

### ⚠️ IMPORTANT: Development Workflow

**Semantic Versioning Strategy (Adopted v1.5.0+)**

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x → 2.x.x): Breaking changes, incompatible API changes
- **MINOR** (1.5.x → 1.6.x): New features, backwards-compatible functionality
- **PATCH** (1.5.0 → 1.5.1): Bug fixes, backwards-compatible fixes

**When to Bump Version:**

- **Don't bump for every commit** - only when ready to release
- **Bump MINOR** for new features (e.g., 1.5.0 → 1.6.0)
- **Bump PATCH** for bug fixes (e.g., 1.5.0 → 1.5.1)
- **Bump MAJOR** for breaking changes (e.g., 1.5.0 → 2.0.0)

**Development Workflow:**

```bash
# 1. Work on feature (multiple commits, same version)
git commit -m "refactor: Extract utility function"
git commit -m "feat: Add keyboard shortcut support"
git commit -m "test: Add tests for keyboard shortcuts"

# 2. Ready to release? Bump version
# Edit package.json: "version": "1.6.0"
# Edit manifest.json: "version": "1.6.0"

# 3. Create release tag
git tag -a v1.6.0 -m "Release v1.6.0: Add keyboard shortcuts

- Cmd+Shift+1/2/3/4 to jump to MRU positions
- Configurable in settings
- Works across all tabs"

# 4. Build and commit
npm run build
git add -A
git commit -m "chore: Release v1.6.0"

# 5. Push with tags
git push && git push --tags

# 6. GitHub Release is created automatically!
# The .github/workflows/release.yml workflow triggers on tag push
# and creates the release using your tag message
```

**Pre-Commit Hook (Automatic):**

The hook runs on every commit:

- ✅ Lint check (`npm run lint`)
- ✅ Test suite (`npm test`)

**Documentation Updates:**

When releasing a new version:

1. **Update README.md** with user-facing changes
2. **Update CLAUDE.md** status section and "Recent Features & Changes"
3. **Run `npm run build`** to regenerate `dist/manifest.json`
4. **Create descriptive Git tag** with release notes (triggers automatic GitHub release creation)

**Why This Workflow:**

- ✅ Standard practice (semantic versioning)
- ✅ Flexible - commit freely, release deliberately
- ✅ Clean history - tags mark releases
- ✅ User-friendly - version numbers have meaning
- ✅ GitHub integration - releases automatically created from tags
- ✅ Automated workflow - no manual release creation needed

### Git Pre-commit Hook

A pre-commit hook is configured to enforce code quality:

- Runs `npm run lint` and blocks on failures
- Runs `npm test` and blocks on failures

**Setup (required for each clone):**

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

# Enforce quality before committing.
# 1) Lint must pass
# 2) Tests must pass

set -e

echo "Running lint check..."
npm run lint

echo "Running tests..."
npm test

echo "✓ All pre-commit checks passed"
EOF
chmod +x .git/hooks/pre-commit
```

**Note:** Git hooks are local and not committed to the repository. You'll need to set this up on each machine/clone.

To bypass the hook in emergencies (not recommended): `git commit --no-verify`

### Release Tagging Strategy

**Which versions to tag:**

- ✅ All MINOR releases (v1.6.0, v1.7.0, etc.)
- ✅ All PATCH releases (v1.5.1, v1.5.2, etc.)
- ✅ Critical bug fixes
- ❌ Don't tag: work-in-progress commits, refactoring, docs-only

**Tagged releases:**

- v1.1.0 - Initial release
- v1.3.0 - MRU breadcrumb trail feature
- v1.3.33 - Configurable breadcrumb count
- v1.4.0 - Cleaner popup UI
- v1.5.0 - Major refactoring and test infrastructure

**Automated GitHub Releases:**

GitHub releases are automatically created when you push version tags!

**How it works:**

- `.github/workflows/release.yml` workflow triggers on any `v*.*.*` tag push
- Uses your tag annotation message as release notes
- Marks release as "latest" automatically
- No manual intervention needed!

**What gets used:**

- Tag subject line → Release title
- Tag body → Release notes
- If no tag message, auto-generates notes from commits

**Manual creation (if needed):**

```bash
# Only needed if automation fails
gh release create v1.6.0 --generate-notes

# Or via GitHub web UI:
# https://github.com/bglenden/TabHighlightExtension/releases/new
```

### Testing Strategy

**Manual Testing:**

1. Build the extension
2. Load unpacked in Chrome (chrome://extensions/)
3. Open multiple tabs
4. Switch between tabs and verify indicator appears/disappears
5. Test with pages that change their own titles (e.g., Gmail, Slack)

**Edge Cases to Test:**

- Pages with no title element
- Pages that frequently update titles
- Very long titles
- Special characters in titles
- Rapid tab switching

### Debugging

**Console Access:**

- Open Chrome DevTools Console in any page (content script runs in page context)
- Errors and logs appear in the page's console, not the background context
- Use `console.log()` in content.ts for debugging
- Webpack dev mode includes source maps for easier debugging

**Common Debugging Scenarios:**

1. **Indicator not appearing**
   - Check if extension is enabled in `chrome://extensions/`
   - Verify content script loaded (check Console for errors)
   - Rebuild with `npm run build`
   - Hard reload the tab (Cmd/Ctrl + Shift + R)

2. **Indicator not disappearing**
   - Check browser Console for JavaScript errors
   - Verify Page Visibility API is firing (add console.log to handleVisibilityChange)
   - Try reloading the extension

3. **Build errors**
   - Run `npm install` to ensure dependencies are installed
   - Check TypeScript errors with `npx tsc --noEmit`
   - Verify Node.js version (16+ recommended)
   - Clear dist folder with `npm run clean` and rebuild

4. **Extension not loading**
   - Ensure you selected the `dist/` folder, not the project root
   - Check manifest.json is valid (Chrome will show errors)
   - Look for errors in chrome://extensions/ page

## Design Decisions

### Why Both Content Script and Background Service Worker?

**Content Script:**

- Direct access to document.title for modification
- Runs in page context for immediate title updates
- Listens for storage changes to update display in real-time

**Background Service Worker:**

- Tracks global MRU state across all tabs
- Persists MRU stack across service worker restarts
- Coordinates position updates to all tabs
- Handles tab activation/removal events

**Reasoning:**

- Content scripts can't communicate with each other directly
- Background worker provides centralized MRU tracking
- Message passing is efficient for position updates

### Why Title Modification vs Other Approaches?

**Alternatives Considered:**

1. **Modify tab bar CSS** - Not possible (browser UI is protected)
2. **Browser action badge** - Doesn't highlight the tab itself
3. **Overlay visual element** - More complex, could interfere with page content
4. **Favicon modification** - Removed in v1.3.20 due to bookmark contamination

**Chosen:** Title modification (with colored square emoji)

**Reasoning:**

- Visible in the tab bar
- Non-intrusive to page content
- Works on all sites
- Simple implementation
- No bookmark contamination

### Why Color-Coded Squares (🟦🟩🟧🟥)?

- **High visibility** - Bright colors stand out in tab bar
- **Position indication** - Blue=1, Green=2, Orange=3, Red=4 creates visual hierarchy
- **Single character** - Minimal space in tab title
- **Consistent rendering** - Renders uniformly across platforms
- **Intuitive ordering** - Blue (cool) to red (warm) suggests temporal distance

### Why Configurable Count (1 vs 4)?

- **User preference** - Some users want simplicity (1), others want full trail (4)
- **Performance** - Single breadcrumb mode has even lower overhead
- **Flexibility** - Default to simple mode, opt-in to advanced features
- **Clean UX** - Not everyone needs to see 4 indicators at all times

### Why Manifest V3?

- Latest standard (V2 is deprecated)
- Better performance
- Future-proof
- Required for new extensions

## Potential Enhancements

### Future Features

1. ~~**Configurable indicator count**~~ - ✅ Implemented in v1.3.33
2. ~~**Clean popup UI**~~ - ✅ Implemented in v1.4.0 (removed debug report clutter)
3. ~~**Code refactoring**~~ - ✅ Implemented in v1.5.0 (constants, storage utilities, tests)
4. **Configurable colors/emoji** - Let users choose indicator symbols
5. **More breadcrumb options** - Support 2, 3, or custom count
6. **Options page** - Dedicated settings page (currently uses popup)
7. **Keyboard shortcuts** - Quick toggle or jump to MRU positions
8. **Color themes** - Different colors for different contexts
9. **Tab grouping** - Integrate with Chrome's tab groups
10. **Export/import settings** - Share configuration across installations

### Code Improvements

1. ✅ **ESLint** - Configured with TypeScript support (v1.1.0)
2. ✅ **Unit tests** - Jest with 42 tests for utilities and constants (v1.5.0)
3. ✅ **Centralized constants** - All storage keys and defaults in one file (v1.5.0)
4. ✅ **Storage utilities** - Type-safe helpers for all storage operations (v1.5.0)
5. **E2E tests** - Puppeteer for browser automation (potential future enhancement)
6. **CI/CD** - Automated builds and releases
7. **Prettier** - Code formatting
8. **Changelog** - Track version history

## Browser Compatibility

### Supported Browsers

- **Chrome**: Version 88+ (Manifest V3 support required)
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Latest version
- **ChatGPT Atlas**: Tested and working
- **Other Chromium browsers**: Should work with Manifest V3 support

### Known Limitations

**Chrome Internal Pages:**
Chrome's security model prevents extensions from running on certain internal pages:

- `chrome://` URLs (settings, flags, etc.)
- `chrome://extensions/` (extension management page)
- `chrome-extension://` URLs (other extensions)
- Chrome Web Store pages
- `chrome://newtab/` (new tab page)

**Why?** This is a browser security restriction that applies to all Chrome extensions, not a limitation of this specific extension. Chrome prevents content scripts from running on privileged pages to protect browser integrity.

**Workaround:** None available. These restrictions are enforced at the browser level for security reasons.

## Troubleshooting

See the **Debugging** section under "Development Workflow" for detailed troubleshooting steps covering:

- Indicator not appearing
- Indicator not disappearing
- Build errors
- Extension not loading

## References

### APIs & Documentation

- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

### Build Tools

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Webpack Documentation](https://webpack.js.org/concepts/)
- [Chrome Types](https://www.npmjs.com/package/@types/chrome)

## License

MIT License - Free to use, modify, and distribute
