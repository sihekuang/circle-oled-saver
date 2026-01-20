# OLED Saver - Design Document

## Overview

A cross-platform Electron app that plays YouTube videos as a screensaver after system idle, helping reduce OLED burn-in.

## Requirements

- **Platforms:** macOS, Windows, Linux
- **Activation:** After configurable idle time (default 5 minutes)
- **Dismissal:** Any mouse movement or keypress
- **Content:** YouTube videos/playlists (user URLs + built-in ambient defaults)
- **Playback:** Continuous auto-play, rotates through playlists
- **Multi-monitor:** Covers all screens with the same video
- **UI:** System tray icon with settings window
- **Auto-start:** Optional, user prompted on first run

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Idle Monitor│  │ Tray Manager│  │ Config Store   │  │
│  │ (polls OS)  │  │ (icon+menu) │  │ (electron-store)│  │
│  └──────┬──────┘  └──────┬──────┘  └────────────────┘  │
│         │                │                              │
│         ▼                ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Window Manager                        │   │
│  │  - Creates overlay per display on idle trigger  │   │
│  │  - Creates settings window on tray click        │   │
│  │  - Destroys overlays on input detection         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Overlay Window  │ (×N)     │  Settings Window │
│  - Fullscreen    │          │  - Idle timeout  │
│  - No frame      │          │  - Playlist URLs │
│  - YouTube embed │          │  - Default lists │
│  - Input listener│          │  - Auto-start    │
└──────────────────┘          └──────────────────┘
```

## Components

### Idle Monitor
- Polls system idle time every second using `desktop-idle`
- Triggers screensaver when idle time exceeds threshold
- Continues polling during screensaver to detect activity

### Tray Manager
- System tray icon (always present)
- Menu items: Enable/Disable toggle, Settings, Quit
- Click on icon opens settings

### Window Manager
- Creates fullscreen overlay window for each display
- Overlay config: `fullscreen: true`, `frame: false`, `alwaysOnTop: true`, `skipTaskbar: true`
- Creates settings window on demand
- Handles graceful fade-out on dismissal (200ms)

### Config Store
- Uses `electron-store` for persistence
- Settings:
  - `idleTimeout`: seconds (default 300)
  - `playlists`: array of {name, url}
  - `enabled`: boolean
  - `launchAtLogin`: boolean

## Overlay Window

### YouTube Integration
- YouTube IFrame Player API
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID?autoplay=1&controls=0&rel=0&modestbranding=1`
- Listen to `onStateChange` for video end detection
- On playlist end, rotate to next user playlist

### Input Detection
1. **Renderer:** Listen for `mousemove`, `mousedown`, `keydown` → IPC to main
2. **Main:** Poll idle time, detect reset to 0

### Dismissal Flow
1. Input detected
2. Fade out overlays (200ms CSS transition)
3. Destroy all overlay windows
4. Resume idle monitoring

## Settings Window

### Options
| Setting | Default | Control |
|---------|---------|---------|
| Idle timeout | 300s | Slider (1-30 min) |
| Playlists | Default ambient | List with add/remove |
| Start at login | Ask first run | Checkbox |
| Enabled | true | Toggle |

### Default Playlists
- Fireplace ambiance
- Aquarium / underwater
- Nature scenery
- Abstract/colorful visuals

## Project Structure

```
oled-saver-electron/
├── package.json
├── electron-builder.json
├── src/
│   ├── main/
│   │   ├── main.js
│   │   ├── idleMonitor.js
│   │   ├── trayManager.js
│   │   ├── windowManager.js
│   │   └── config.js
│   ├── preload/
│   │   └── preload.js
│   ├── overlay/
│   │   ├── overlay.html
│   │   ├── overlay.css
│   │   └── overlay.js
│   └── settings/
│       ├── settings.html
│       ├── settings.css
│       └── settings.js
├── assets/
│   └── iconTemplate.png
└── dist/
```

## Dependencies

- `electron` - Framework
- `desktop-idle` - Cross-platform idle detection
- `electron-store` - Persistent config
- `electron-builder` - Packaging
