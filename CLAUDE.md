# Active Tab Highlighter - Technical Documentation

## Current Status (v1.0.6)

### What's Working
✅ **Title indicator**: Green circle (🟢) appears at the END of active tab titles
✅ **Favicon replacement**: Green circle favicon replaces site favicon when tab is active
✅ **Most sites work correctly**: Google, CNN, and most websites properly show/hide indicators
✅ **Visibility detection**: Page Visibility API correctly detects tab switches
✅ **Favicon enforcement**: 500ms interval prevents sites from overwriting our green favicon

### Known Issues
❌ **x.com (Twitter) specific issue**: Green favicon may not disappear when switching away from x.com
⚠️ **Debug logs currently enabled**: Built in development mode for debugging (version 1.0.6)

### Debugging Session Notes

**Last tested**: 2025-11-18
**Console logs from cnn.com show**:
- Extension correctly detects visibility changes (`document.hidden: true/false`)
- `removeIndicator()` is called when tab becomes inactive
- `stopFaviconEnforcement()` stops the 500ms interval
- Original favicon is restored correctly
- When tab becomes active again, green favicon is re-applied

**x.com issue needs investigation**:
- Console logs were from cnn.com (which works correctly)
- Need to specifically test x.com and capture console logs
- x.com may have unique favicon update patterns that interfere

### Next Steps

1. **Test x.com specifically**:
   - Open x.com in a tab
   - Open DevTools Console
   - Switch away from x.com tab
   - Check if green favicon disappears
   - Capture console logs showing what happens

2. **If x.com favicon persists**:
   - Check if x.com is adding NEW favicon elements after we restore
   - May need to use a more aggressive MutationObserver on x.com
   - Consider site-specific handling for problematic sites

3. **Production build**:
   - Once x.com issue is resolved, remove debug console.log statements
   - Build in production mode (`npm run build`)
   - Update version to 1.1.0

4. **Optional enhancements**:
   - Make indicator configurable (different emoji options)
   - Options page for user preferences
   - Whitelist/blacklist for specific sites

## Overview
This Chrome extension adds a visual indicator (🟢 green circle emoji) to the END of the active tab's title and replaces the favicon with a green circle, making it easy to identify which tab is currently being viewed. This is particularly useful when you have many tabs open and want to quickly close the one you just finished reading.

## Architecture

### Project Structure
```
/TabHighlightExtension
├── src/
│   └── content.ts          # Main content script with tab highlighting logic
├── dist/                    # Build output (created by webpack)
│   ├── content.js          # Compiled content script
│   ├── manifest.json       # Copied manifest
│   └── icons/              # Copied icon files
├── icons/
│   ├── icon16.png          # 16x16 extension icon
│   ├── icon48.png          # 48x48 extension icon
│   └── icon128.png         # 128x128 extension icon
├── manifest.json           # Chrome extension manifest (v3)
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript compiler configuration
├── webpack.config.js       # Webpack bundler configuration
└── .gitignore              # Git ignore rules
```

### Technology Stack
- **TypeScript 5.4+**: Type-safe JavaScript with modern features
- **Webpack 5**: Module bundler for compiling and packaging
- **Chrome Extension Manifest V3**: Latest extension platform
- **Page Visibility API**: Browser API for detecting tab visibility changes
- **MutationObserver API**: DOM API for monitoring title changes

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
document.addEventListener('visibilitychange', handleVisibilityChange);
if (document.hidden) { /* tab is inactive */ }
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

### Build Commands
- `npm run build` - Production build (minified)
- `npm run dev` - Development build with watch mode
- `npm run clean` - Remove dist/ directory

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
- Use Chrome DevTools Console in any page
- Errors appear in the page's console (content script context)
- Use `console.log()` in content.ts for debugging
- Webpack dev mode includes source maps

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
1. **Unit tests** - Jest/Vitest for content script logic
2. **E2E tests** - Puppeteer for browser automation
3. **CI/CD** - Automated builds and releases
4. **ESLint/Prettier** - Code quality and formatting
5. **Changelog** - Track version history

## Troubleshooting

### Common Issues

**Indicator doesn't appear:**
- Check if extension is enabled in chrome://extensions/
- Verify content script loaded (check Console)
- Rebuild with `npm run build`

**Indicator persists after switching tabs:**
- Check browser Console for errors
- Verify Page Visibility API is supported
- Try reloading the tab

**Build fails:**
- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors with `npx tsc --noEmit`
- Verify Node.js version (16+ recommended)

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
