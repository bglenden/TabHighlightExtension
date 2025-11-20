# Active Tab Highlighter

A lightweight Chrome extension that adds a visual indicator to your active tab, making it easy to identify which tab you're currently viewing.

**Version**: 1.1.0 | **GitHub**: https://github.com/bglenden/TabHighlightExtension

## Why This Extension?

When you have many tabs open, it can be difficult to quickly identify the active tab - especially when you want to close it after reading. This extension solves that problem by adding a bright 🟢 green circle to the active tab's title and replacing its favicon, making it instantly visible in your tab bar.

## Features

- **Title Indicator**: Adds 🟢 to the end of the active tab's title
- **Favicon Replacement**: Replaces the site's favicon with a green circle
- **Automatic Updates**: Indicators appear/disappear as you switch tabs
- **Lightweight**: Minimal resource usage (2.17 KiB), no performance impact
- **Privacy-Focused**: No data collection, tracking, or external requests
- **Works Everywhere**: Runs on all websites automatically

## Installation

### From Source

1. **Clone or download this repository**

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
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project

## Usage

Once installed, the extension works automatically:

1. **Open a tab** - The tab you're viewing shows 🟢 in its title and has a green circle favicon
2. **Switch tabs** - The indicator moves to the new active tab
3. **Close tabs** - Easy to identify which tab to close

### Example

**Before:**

```
YouTube - Video
GitHub - Repository
Gmail - Inbox
```

**After (with Gmail active):**

```
YouTube - Video
GitHub - Repository
🟢 Gmail - Inbox
```

## How It Works

The extension automatically detects when you switch tabs and adds a green circle indicator to the active tab's title and favicon. It uses the browser's built-in Page Visibility API to monitor tab changes, so there's no performance impact.

**Note**: Chrome's security model prevents extensions from running on internal browser pages like `chrome://extensions/`, `chrome://newtab/`, and the Chrome Web Store. This is a browser limitation that applies to all extensions.

## Privacy

This extension:

- ✅ Does NOT collect any data
- ✅ Does NOT track your browsing
- ✅ Does NOT make external requests
- ✅ Does NOT require sensitive permissions
- ✅ Runs entirely locally in your browser

## Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Latest version
- **ChatGPT Atlas**: Tested and working
- **Other Chromium browsers**: Should work with Manifest V3 support

## For Developers

See [CLAUDE.md](./CLAUDE.md) for comprehensive technical documentation including:

- Architecture and design decisions
- Build system and development workflow
- API usage and implementation details
- Performance optimization strategies
- Security considerations
- Troubleshooting guide

## Contributing

Contributions are welcome! Feel free to:

- Report bugs via GitHub Issues
- Suggest features
- Submit pull requests

Please see [CLAUDE.md](./CLAUDE.md) for development setup and workflow.

## License

MIT License - See LICENSE file for details
