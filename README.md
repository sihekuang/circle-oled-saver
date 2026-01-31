# Circle

A cross-platform OLED screensaver that displays a bouncing circle with rotating content to prevent burn-in.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Burn-in Prevention** - A bouncing circle continuously moves across your screen, preventing static elements from burning into OLED panels
- **Content Providers** - Display useful information inside the circle:
  - Clock (12/24 hour format)
  - Stock ticker (real-time prices from Yahoo Finance)
  - System info (CPU, memory, battery)
- **Multiple Themes** - Minimal, Soft, Glassy, and Abstract visual styles
- **Idle Detection** - Automatically activates after a configurable idle period
- **Always-On Mode** - Toggle with a global hotkey to keep the screensaver running
- **Multi-Monitor Support** - Works across all connected displays
- **System Tray App** - Runs quietly in your menu bar/system tray

## Installation

### From Releases

Download the latest release for your platform from the [Releases](../../releases) page.

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/circle.git
cd circle

# Install dependencies
npm install

# Run the app
npm start
```

## Building

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux
```

## Usage

1. Launch Circle - it will appear in your system tray/menu bar
2. Right-click the tray icon to access settings or test the overlay
3. Configure idle timeout, content providers, and themes in Settings
4. Use the global hotkey (default: `Cmd/Ctrl+Shift+O`) to toggle Always-On mode

### Settings

- **Idle Timeout** - How long before the screensaver activates (default: 5 minutes)
- **Content Rotation** - Enable/disable providers and set rotation interval
- **Theme** - Choose your preferred visual style
- **Always-On Hotkey** - Customize the keyboard shortcut
- **Launch at Login** - Start Circle automatically when you log in

## Content Providers

| Provider | Description | Refresh Rate |
|----------|-------------|--------------|
| Clock | Current time and date | 1 second |
| Stocks | Stock prices with gain/loss colors | 2 minutes |
| System | CPU, memory, battery status | 2 seconds |

See [Content Providers Documentation](docs/content-providers.md) for details on adding custom providers.

## Development

```bash
# Run in development mode
npm start

# Generate app icons from SVG
npm run generate-icons
```

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.js     # App entry point
│   ├── config.js   # Settings management
│   ├── idleMonitor.js
│   ├── trayManager.js
│   └── windowManager.js
├── overlay/        # Screensaver overlay
│   ├── providers/  # Content providers
│   ├── themes/     # Visual themes
│   └── background/ # Background animations
├── settings/       # Settings window
└── toast/          # Toast notifications
```

## Requirements

- macOS 10.13+, Windows 10+, or Linux with X11
- Node.js 18+ (for development)

## License

MIT
