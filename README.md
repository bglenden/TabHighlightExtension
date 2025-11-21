# Active Tab Highlighter - MRU Breadcrumb Trail

A lightweight Chrome extension that shows your Most Recently Used (MRU) tabs with colored position indicators, making it easy to navigate your browsing history.

**Version**: 1.3.18 | **GitHub**: https://github.com/bglenden/TabHighlightExtension

## Why This Extension?

When you have many tabs open, it's helpful to see which tabs you've used most recently - like a breadcrumb trail of your browsing session. This extension shows your last 4 active tabs with color-coded numbered indicators, making it easy to jump back to recently-viewed content.

## Features

- **MRU Position Indicators**: Shows numbered colored circles for your 4 most recent tabs
  - 🟢 Position 1 (Green): Currently active tab
  - 🟡 Position 2 (Yellow): Last tab you viewed
  - 🟠 Position 3 (Orange): 2 tabs back
  - 🔴 Position 4 (Red): 3 tabs back
- **Title Indicators**: Adds colored emoji to the end of tab titles
- **Favicon Replacement**: Replaces favicons with numbered colored circles showing position
- **Automatic Updates**: Indicators update instantly as you switch tabs
- **Lightweight**: Minimal resource usage, no performance impact
- **Privacy-Focused**: No data collection, tracking, or external requests
- **Works Everywhere**: Runs on all http/https websites automatically

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

1. **Active tab** - Shows 🟢 (green) with number "1"
2. **Switch to another tab** - Previous tab becomes 🟡 (yellow) with number "2"
3. **Keep browsing** - Your last 4 tabs show positions 1-4 with color-coded indicators
4. **Navigate back** - Easily see which tabs you recently visited

### Example

When you browse from Google → GitHub → Gmail, your tabs show:

```
🟢 Gmail - Inbox (position 1 - current)
🟡 GitHub - Repository (position 2 - 1 back)
🟠 Google Search (position 3 - 2 back)
🔴 News Site (position 4 - 3 back)
```

## How It Works

The extension tracks your Most Recently Used (MRU) tabs and assigns position indicators (1-4) based on how recently you viewed them. Both the tab title and favicon update to show the position with color-coded numbered circles.

**Important Note**:
- After installing or reloading the extension, **refresh your tabs** to activate the indicators
- The extension only tracks http:// and https:// pages
- Chrome's security model prevents extensions from running on `chrome://` pages, extension pages, and the Chrome Web Store

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
