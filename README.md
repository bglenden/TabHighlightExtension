# Active Tab Highlighter

A lightweight Chrome extension that adds a visual indicator to your active tab, making it easy to identify which tab you're currently viewing.

**Version**: 1.1.0 | **GitHub**: https://github.com/bglenden/TabHighlightExtension

## Why This Extension?

When you have many tabs open, it can be difficult to quickly identify the active tab - especially when you want to close it after reading. This extension solves that problem by adding a bright 🟢 green circle to the active tab's title, making it instantly visible in your tab bar.

## Features

- **Title Indicator**: Adds 🟢 to the end of the active tab's title
- **Favicon Replacement**: Replaces the site's favicon with a green circle
- **Automatic Updates**: Indicators appear/disappear as you switch tabs
- **Lightweight**: Minimal resource usage (2.17 KiB), no performance impact
- **Privacy-Focused**: No data collection, tracking, or external requests
- **Works Everywhere**: Runs on all websites automatically (except Chrome internal pages)

## Installation

### From Source (Development)

1. **Clone or download this repository**
   ```bash
   cd /path/to/TabHighlightExtension
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

5. **Start using**
   - Open multiple tabs
   - The active tab will show 🟢 in its title
   - Switch tabs to see the indicator move

## Usage

Once installed, the extension works automatically:

1. **Open a tab** - The tab you're viewing shows 🟢 in its title
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

## Development

### Build Commands

- `npm run build` - Build for production (minified, 2.17 KiB)
- `npm run dev` - Build in development mode with auto-rebuild on changes
- `npm run clean` - Remove build output
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues

### Project Structure

```
/TabHighlightExtension
├── src/
│   └── content.ts          # Main extension logic (156 lines)
├── dist/                    # Build output (load this in Chrome)
├── icons/                   # Extension icons
├── manifest.json           # Chrome extension manifest
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── webpack.config.cjs      # Build configuration
└── eslint.config.js        # Code quality configuration
```

### Making Changes

1. Edit files in `src/`
2. Run `npm run dev` to auto-rebuild on changes
3. Go to `chrome://extensions/` and click the refresh icon on the extension
4. Test your changes

### Technical Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed technical documentation including:
- Architecture overview
- API usage
- Performance considerations
- Security & privacy details
- Design decisions

## How It Works

The extension uses a content script that:
1. Runs on every webpage
2. Listens for tab visibility changes using the Page Visibility API
3. Adds/removes the 🟢 indicator from the document title
4. Replaces the site's favicon with a green circle (with 500ms enforcement)
5. Handles dynamic title changes from the page itself

**Key Features:**
- Event-driven (no polling)
- Minimal performance impact
- No special permissions required
- Works on all websites (except Chrome internal pages like `chrome://`)

**Note**: Chrome's security model prevents extensions from running on internal pages (`chrome://extensions/`, `chrome://newtab/`, etc.). This is a browser limitation, not a bug.

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
- **Other Chromium browsers**: Should work, but not tested

**Limitations**: Cannot run on Chrome internal pages (`chrome://`, Chrome Web Store) due to browser security restrictions.

## Troubleshooting

### Indicator doesn't appear
- Make sure the extension is enabled in `chrome://extensions/`
- Try reloading the tab
- Check the browser console for errors

### Indicator doesn't disappear when switching tabs
- Reload the extension in `chrome://extensions/`
- Check if the Page Visibility API is supported (should be in all modern browsers)

### Build fails
- Make sure Node.js is installed (version 16+)
- Run `npm install` to install dependencies
- Check for TypeScript errors with `npx tsc --noEmit`

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with:
- TypeScript 5.4+
- Webpack 5
- ESLint 9
- Chrome Extension Manifest V3
- Page Visibility API
- MutationObserver API
