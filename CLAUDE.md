# Active Tab Highlighter - Technical Documentation

## Current Status (v1.3.18)

### Production Release ✅

**Version**: 1.3.18 (Production)
**Status**: MRU breadcrumb trail feature - stable
**Release Date**: 2025-11-20
**GitHub**: https://github.com/bglenden/TabHighlightExtension

### What's Working

✅ **MRU Position Tracking**: Tracks last 4 active tabs with positions 1-4
✅ **Color-coded Indicators**: 🟢 (green/1), 🟡 (yellow/2), 🟠 (orange/3), 🔴 (red/4)
✅ **Title indicators**: Colored emoji appears at the END of tab titles
✅ **Numbered favicon replacement**: SVG favicons with colored circles and position numbers
✅ **Background service worker**: Maintains MRU stack and broadcasts position updates
✅ **All websites work correctly**: Including x.com (Twitter), Google, CNN, and all tested sites
✅ **Favicon enforcement**: 500ms interval prevents sites from overwriting position favicons
✅ **Dynamic title handling**: Properly handles sites that change their titles frequently
✅ **Extension context invalidation handling**: Gracefully handles extension reloads without errors
✅ **Code quality**: ESLint configured, lints with 0 errors and 0 warnings
✅ **URL filtering**: Only tracks http:// and https:// URLs to avoid errors on protected pages

### Known Limitations

⚠️ **Chrome internal pages**: Cannot run on `chrome://` URLs (browser security restriction)
⚠️ **Extension pages**: Cannot run on Chrome Web Store or `chrome://extensions/`
⚠️ **New Tab page**: Cannot modify default new tab (browser security restriction)
⚠️ **Stale indicators**: After reloading the extension, **refresh tabs** to clear old indicators and activate new content scripts

These are **browser security features**, not bugs. All Chrome extensions have these limitations.

### Recent Bug Fixes (v1.3.12-1.3.18)

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

This Chrome extension tracks your Most Recently Used (MRU) tabs and displays color-coded position indicators, creating a breadcrumb trail of your browsing session. The last 4 active tabs show numbered colored circles (1-4) in both their titles and favicons.

## Architecture

### Project Structure

```
/TabHighlightExtension
├── src/
│   ├── content.ts          # Content script - manages tab indicators
│   ├── background.ts       # Service worker - tracks MRU stack
│   └── popup.ts            # Extension popup - reload functionality
├── dist/                    # Build output (gitignored)
│   ├── content.js          # Compiled content script (~6 KiB minified)
│   ├── background.js       # Compiled background worker (~3.25 KiB minified)
│   ├── popup.js            # Compiled popup script (~2.28 KiB minified)
│   ├── popup.html          # Popup UI
│   ├── manifest.json       # Copied manifest
│   └── icons/              # Copied icon files
├── icons/
│   ├── icon16.png          # 16x16 extension icon
│   ├── icon48.png          # 48x48 extension icon
│   └── icon128.png         # 128x128 extension icon
├── manifest.json           # Chrome extension manifest (v3)
├── popup.html              # Extension popup HTML
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript compiler configuration
├── webpack.config.cjs      # Webpack bundler configuration (CommonJS)
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
- **Page Visibility API**: Browser API for detecting tab visibility changes
- **MutationObserver API**: DOM API for monitoring title and favicon changes

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

- `addIndicator()` - Prepends 🟢 to the document title when tab becomes active
- `removeIndicator()` - Restores original title when tab becomes inactive
- `handleVisibilityChange()` - Event handler for tab visibility changes
- `init()` - Initializes the extension and sets up event listeners

**Title Change Handling:**
The extension uses a `MutationObserver` to watch for title changes made by the webpage itself (e.g., notification counters, dynamic updates). This ensures:

- The indicator persists even when the page updates its own title
- The original title is properly tracked and restored
- No conflicts with page-initiated title changes

#### 2. Visibility Detection

Uses the **Page Visibility API** (`document.visibilitychange` event):

- Fires when user switches tabs
- Provides `document.hidden` boolean to check tab state
- Highly reliable and performant
- Native browser support (no polling required)

#### 3. Title Management Strategy

The extension implements careful title management:

```typescript
// When adding indicator
originalTitle = document.title;
document.title = INDICATOR + document.title;

// When removing indicator
document.title = originalTitle;
```

**Edge Cases Handled:**

- Page title changes while indicator is active → Update original title, reapply indicator
- Multiple rapid visibility changes → State tracking prevents duplicate indicators
- Title already has indicator → Check before adding to prevent duplication

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

**No Background Service Worker:** Not needed for this simple use case

**No Permissions Required:** Title modification doesn't need explicit permissions

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

- **Memory:** Minimal (~50KB including all code)
- **CPU:** Event-driven (only runs on visibility change)
- **Network:** None (no external requests)
- **DOM Impact:** Only modifies document.title (lightweight)

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

- `npm run build` - Production build (minified, 2.17 KiB)
- `npm run dev` - Development build with watch mode (auto-rebuilds on file changes)
- `npm run clean` - Remove dist/ directory
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues

### Making Changes

1. **Edit source files** in `src/` directory
2. **Run development build** with `npm run dev` for auto-rebuild
3. **Reload extension** in `chrome://extensions/` (click refresh icon on the extension card)
4. **Test changes** by switching between tabs
5. **Check console** for errors (open DevTools on any page, content script runs in page context)

### ⚠️ IMPORTANT: Version Number Updates

**ALWAYS update the version number in `package.json` before committing bug fixes or new features.**

Version numbering follows semantic versioning (MAJOR.MINOR.PATCH):
- **PATCH** (1.3.11 → 1.3.12): Bug fixes, minor improvements
- **MINOR** (1.3.0 → 1.4.0): New features, significant enhancements
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major rewrites

**Before every commit:**
1. Update `version` field in `package.json`
2. Run `npm run build` to regenerate `dist/manifest.json` with new version
3. Commit with descriptive message including version number

**Example:**
```bash
# Edit package.json version from 1.3.11 to 1.3.12
npm run build
git add .
git commit -m "v1.3.12: Fix stale indicators on chrome:// pages"
```

### Git Pre-commit Hook

A pre-commit hook is configured to automatically run `npm run lint` before every commit, preventing commits with linting errors.

**Setup (required for each clone):**

```bash
# Create the hook file
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

echo "Running lint check..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Lint failed. Please fix errors before committing."
  exit 1
fi

echo "✅ Lint passed"
exit 0
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

**Note:** Git hooks are local and not committed to the repository. You'll need to set this up on each machine/clone.

To bypass the hook in emergencies (not recommended): `git commit --no-verify`

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

### Why Content Script vs Background Worker?

**Chosen:** Content script

**Reasoning:**

- Direct access to document.title
- No message passing overhead
- Simpler architecture
- Better performance for this use case

### Why Title Modification vs Other Approaches?

**Alternatives Considered:**

1. **Modify tab bar CSS** - Not possible (browser UI is protected)
2. **Browser action badge** - Doesn't highlight the tab itself
3. **Overlay visual element** - More complex, could interfere with page content

**Chosen:** Title modification (with emoji)

**Reasoning:**

- Visible in the tab bar (user's requirement)
- Non-intrusive to page content
- Works on all sites
- Simple implementation
- No permission requirements

### Why 🟢 Green Circle?

- High visibility (bright color)
- Universal recognition (green = active/go)
- Single character (minimal space in tab)
- Renders consistently across platforms

### Why Manifest V3?

- Latest standard (V2 is deprecated)
- Better performance
- Future-proof
- Required for new extensions

## Potential Enhancements

### Future Features

1. **Configurable indicator** - Let users choose emoji/symbol
2. **Options page** - UI for customization
3. **Keyboard shortcut** - Toggle indicator on/off
4. **Color themes** - Different colors for different contexts
5. **Multiple indicators** - Different symbols for different sites
6. **Tab grouping** - Integrate with Chrome's tab groups

### Code Improvements

1. ✅ **ESLint** - Configured with TypeScript support (v1.1.0)
2. **Unit tests** - Jest/Vitest for content script logic (not practical due to heavy DOM mocking)
3. **E2E tests** - Puppeteer for browser automation (potential future enhancement)
4. **CI/CD** - Automated builds and releases
5. **Prettier** - Code formatting
6. **Changelog** - Track version history

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
