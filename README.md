# Active Tab Highlighter - MRU Breadcrumb Trail

A lightweight Chrome extension that shows your Most Recently Used (MRU) tabs with colored position indicators, making it easy to navigate your browsing history.

**Version**: 1.3.34 | **GitHub**: https://github.com/bglenden/TabHighlightExtension

## Why This Extension?

When you have many tabs open, it's helpful to see which tabs you've used most recently - like a breadcrumb trail of your browsing session. This extension can show just your active tab, or track your last 4 active tabs with color-coded indicators, making it easy to jump back to recently-viewed content.

## Features

- **Configurable Breadcrumb Count**: Choose between two modes:
  - **Single breadcrumb** (default): Shows 🟦 only on the active tab
  - **4 breadcrumbs**: Shows colored indicators for your 4 most recent tabs
    - 🟦 Position 1 (Blue): Currently active tab
    - 🟩 Position 2 (Green): Last tab you viewed
    - 🟧 Position 3 (Orange): 2 tabs back
    - 🟥 Position 4 (Red): 3 tabs back
- **Title Indicators**: Adds colored square emoji at the beginning of tab titles for instant visibility
- **Persistent Settings**: Your breadcrumb mode preference is saved across browser restarts
- **Automatic Updates**: Indicators update instantly as you switch tabs
- **Lightweight**: Minimal resource usage (~2.7 KiB), no performance impact
- **Privacy-Focused**: No data collection, tracking, or external requests
- **Works Everywhere**: Runs on all http/https websites automatically
- **Bookmark-Safe**: No favicon modification prevents bookmark icon contamination

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

Once installed, the extension works automatically. By default, it shows a single breadcrumb (🟦) on the active tab.

### Choosing Your Breadcrumb Mode

1. **Click the extension icon** in your toolbar
2. **Select your preferred mode**:
   - **Single breadcrumb** (default): Only the active tab shows 🟦 - Visual preview: 🟦
   - **4 breadcrumbs**: Your last 4 tabs show color-coded indicators - Visual preview: 🟦🟩🟧🟥
3. **Your choice is saved** automatically and persists across browser restarts

The popup shows you exactly which colored indicators will appear in each mode, making it easy to understand what you'll see.

### Single Breadcrumb Mode (Default)

- **Active tab** - Shows 🟦 (blue square)
- Simple and clean - only highlights what you're currently viewing

### Four Breadcrumb Mode

1. **Active tab** - Shows 🟦 (blue square)
2. **Switch to another tab** - Previous tab becomes 🟩 (green square)
3. **Keep browsing** - Your last 4 tabs show positions 1-4 with color-coded squares
4. **Navigate back** - Easily see which tabs you recently visited

### Example (4 Breadcrumb Mode)

When you browse from Google → GitHub → Gmail, your tabs show:

```
🟦 Gmail - Inbox (position 1 - current)
🟩 GitHub - Repository (position 2 - 1 back)
🟧 Google Search (position 3 - 2 back)
🟥 News Site (position 4 - 3 back)
```

## How It Works

The extension tracks your Most Recently Used (MRU) tabs and assigns position indicators based on how recently you viewed them. In single breadcrumb mode, only the active tab (position 1) gets an indicator. In 4 breadcrumb mode, your last 4 tabs get color-coded indicators. The tab title shows a colored emoji at the beginning, making it easy to spot even when the title is truncated.

**Important Note**:

- After installing or reloading the extension, **refresh your tabs** to activate the indicators
- The extension only tracks http:// and https:// pages
- Chrome's security model prevents extensions from running on `chrome://` pages, extension pages, and the Chrome Web Store

## Debug Logging

Need to troubleshoot an issue? The extension includes optional debug logging:

1. **Click the extension icon** in your toolbar
2. **Check "Enable debug logging"** in the popup
3. **Open browser console** (F12 or Cmd+Option+I) to see detailed logs
4. **Uncheck to disable** when done

Debug logs show:

- MRU stack updates
- Position assignments to tabs
- Title changes
- Tab activation events

The setting persists across browser sessions and works without reloading tabs.

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
- Troubleshooting guide
- Development workflow

## Contributing

Contributions are welcome! Feel free to:

- Report bugs via GitHub Issues
- Suggest features
- Submit pull requests

Please see [CLAUDE.md](./CLAUDE.md) for development setup and workflow.

## License

MIT License - See LICENSE file for details
