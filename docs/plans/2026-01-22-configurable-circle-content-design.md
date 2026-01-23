# Configurable Circle Content Design

**Date:** 2026-01-22
**Status:** Approved
**Author:** Design Session

## Overview

Transform the bouncing ball screensaver from displaying a solid gradient circle to supporting configurable content types that rotate automatically. Content types include clock, stock ticker, and system information, each with icons and customizable backgrounds.

## Goals

- Create extensible abstraction for circle content using dependency injection pattern
- Support multiple content types: Clock, Stock Ticker, System Info
- Enable content rotation on configurable intervals
- Allow per-content-type configuration (background colors, data sources)
- Maintain smooth 60fps animation performance

## Non-Goals

- Video or animated GIF content (static text/icons only)
- User-uploaded custom content scripts (security concern)
- Real-time streaming data (WebSocket-based)
- Multiple simultaneous circles with different content

## Architecture

### ContentProvider Pattern

All content types implement a common interface:

```javascript
class ContentProvider {
  constructor(config) {
    this.config = config;
  }

  // Return display data: { text, icon, backgroundColor }
  async getData() {
    throw new Error('Must implement getData()');
  }

  // How often to refresh this content (milliseconds)
  getRefreshInterval() {
    throw new Error('Must implement getRefreshInterval()');
  }

  // Cleanup when provider is destroyed
  destroy() {
    // Override if needed
  }
}
```

### Component Separation

**BouncingBall** - Handles physics and rendering
- Updates position, velocity, bouncing/wrapping logic
- Holds reference to ContentRotator
- Calls `getCurrentProvider().getData()` for render data
- Draws circle with background + content

**ContentRotator** - Manages provider rotation
- Maintains array of enabled providers
- Switches to next provider every X seconds (configurable)
- Provides `getCurrentProvider()` to ball
- Handles provider lifecycle (init/destroy)

**ContentProvider** - Encapsulates content logic
- Fetches/generates content data independently
- Caches latest data for synchronous access
- Runs own refresh interval
- Self-contained (can be added without modifying core)

### Extensibility

Adding new content types requires:
1. Create new class extending ContentProvider
2. Implement `getData()` and `getRefreshInterval()`
3. Register with ContentRotator
4. Add settings UI (optional)

No changes needed to ball physics, rendering loop, or rotation logic.

## Content Providers

### ClockProvider

Displays current time with date.

**Data:**
- Icon: 🕐
- Text: Time (12/24 hour) + Date
- Background: User-configurable (default: #1a1a2e)

**Refresh:** Every 1 second

**Settings:**
- Background color
- 12/24 hour format toggle

**Implementation:**
```javascript
class ClockProvider extends ContentProvider {
  async getData() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !this.config.show24Hour
    });
    const date = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return {
      icon: '🕐',
      text: `${time}\n${date}`,
      backgroundColor: this.config.backgroundColor || '#1a1a2e'
    };
  }

  getRefreshInterval() { return 1000; }
}
```

### StockProvider

Fetches and displays stock prices via Yahoo Finance (unofficial API).

**Data:**
- Icon: 📈
- Text: Symbol + Price + Change %
- Background: Green for gains (#1a4d2e), red for losses (#4d1a1a), or user-configured

**Refresh:** API fetch every 2 minutes

**Settings:**
- Stock symbols (comma-separated, default: AAPL, GOOGL, TSLA)
- Background color (null = auto based on gain/loss)
- Symbol rotation interval (how long to show each symbol)

**Behavior:**
- Cycles through configured symbols
- Shows one symbol per rotation
- Fetches all symbols every 2 minutes
- Caches prices to avoid rate limits

**Implementation:**
```javascript
class StockProvider extends ContentProvider {
  constructor(config) {
    super(config);
    this.symbols = config.symbols || ['AAPL', 'GOOGL', 'TSLA'];
    this.currentIndex = 0;
    this.stockData = {}; // Cache: { symbol: { price, change } }
    this.fetchStockData(); // Initial fetch
  }

  async fetchStockData() {
    // Fetch all symbols from Yahoo Finance API
    // Update this.stockData cache
  }

  async getData() {
    const symbol = this.symbols[this.currentIndex];
    const data = this.stockData[symbol] || { price: '---', change: 0 };

    const arrow = data.change >= 0 ? '↑' : '↓';
    const changePercent = Math.abs(data.change).toFixed(2);

    // Rotate to next symbol
    this.currentIndex = (this.currentIndex + 1) % this.symbols.length;

    const bgColor = this.config.backgroundColor ||
                    (data.change >= 0 ? '#1a4d2e' : '#4d1a1a');

    return {
      icon: '📈',
      text: `${symbol} $${data.price}\n${arrow} ${changePercent}%`,
      backgroundColor: bgColor
    };
  }

  getRefreshInterval() { return 120000; }

  destroy() {
    // Clear fetch interval
  }
}
```

### SystemInfoProvider

Displays CPU, memory, and battery status using Electron's process APIs.

**Data:**
- Icon: 📊
- Text: ⚙️ CPU%  💾 Memory%  🔋 Battery% (if laptop)
- Background: User-configurable (default: #1a1a2e)

**Refresh:** Every 2 seconds

**Settings:**
- Background color
- Show battery (auto-detects if laptop)

**Implementation:**
```javascript
class SystemInfoProvider extends ContentProvider {
  async getData() {
    const cpuUsage = await this.getCPUUsage();
    const memUsage = process.getSystemMemoryInfo();
    const memPercent = Math.round((memUsage.total - memUsage.free) / memUsage.total * 100);

    let text = `⚙️ ${cpuUsage}%  💾 ${memPercent}%`;

    if (this.config.showBattery && navigator.getBattery) {
      const battery = await navigator.getBattery();
      const batteryPercent = Math.round(battery.level * 100);
      text += `\n🔋 ${batteryPercent}%`;
    }

    return {
      icon: '📊',
      text: text,
      backgroundColor: this.config.backgroundColor || '#1a1a2e'
    };
  }

  getRefreshInterval() { return 2000; }
}
```

## Settings & Configuration

### Config Schema

```javascript
{
  // Existing settings
  idleTimeout: 300000,
  enabled: true,
  launchAtLogin: false,
  ballSize: 10,
  ballOpacity: 100,

  // New content settings
  contentRotation: {
    enabled: true,
    intervalSeconds: 10,
    enabledProviders: ['clock', 'stocks', 'system']
  },

  // Provider-specific configs
  providers: {
    clock: {
      backgroundColor: '#1a1a2e',
      show24Hour: false
    },
    stocks: {
      backgroundColor: null, // null = dynamic based on gain/loss
      symbols: ['AAPL', 'GOOGL', 'TSLA'],
      symbolRotationSeconds: 5
    },
    system: {
      backgroundColor: '#1a1a2e',
      showBattery: true
    }
  }
}
```

### Settings UI

Add new "Content" section/tab with:

**Global Settings:**
- Toggle: "Enable content rotation"
- Slider: "Rotation interval" (5-60 seconds)
- Checkboxes: Enable/disable each provider type

**Per-Provider Settings** (collapsible):
- **Clock:**
  - Color picker: Background color
  - Toggle: 24-hour format

- **Stocks:**
  - Color picker: Background color (checkbox for "Auto based on gain/loss")
  - Text input: Stock symbols (comma-separated)
  - Info text: "Uses Yahoo Finance. Updates every 2 minutes."

- **System:**
  - Color picker: Background color
  - Toggle: Show battery (auto-disabled if desktop)

Settings sync via IPC handlers (`get-content-settings`, `save-content-settings`).

## Data Flow & Update Cycles

### Initialization (Overlay Start)

1. Load content settings from config store
2. Instantiate enabled ContentProviders with their configs
3. Create ContentRotator with provider array and rotation interval
4. BouncingBall receives ContentRotator reference
5. Each provider starts its refresh interval
6. ContentRotator starts rotation timer
7. Animation loop begins

### Runtime (Three Independent Cycles)

**1. Animation Loop (60fps)**
- `requestAnimationFrame` drives rendering
- Ball updates physics (position, velocity, collisions)
- Ball calls `contentRotator.getCurrentProvider().getData()`
- Renders circle background + content
- Must be synchronous and fast

**2. Content Rotation (10 seconds default)**
- Timer fires every `intervalSeconds`
- ContentRotator advances to next enabled provider
- Ball picks up new provider on next frame
- Seamless transition

**3. Provider Data Refresh (varies)**
- Each provider runs `setInterval(this.getRefreshInterval())`
- Clock: 1s
- Stocks: 120s (API fetch)
- System: 2s
- Providers cache data in memory
- `getData()` returns cached data (synchronous)

### Memory Management

On overlay dismissal:
1. Cancel animation frame
2. Stop ContentRotator timer
3. Call `destroy()` on each provider
4. Clear intervals and cached data
5. Destroy provider instances

## Rendering

### Circle Content Layout

**Drawing order:**
1. Draw circle with `backgroundColor` from provider
2. Render icon (emoji) at top-center of circle
3. Render text (multi-line supported) below icon, centered
4. Maintain existing gradient/shadow effects on circle edge (optional)

**Text Rendering:**
- Font: System default, bold for primary content
- Size: Scales with ball radius (e.g., `radius * 0.15`)
- Color: White or auto-contrast based on background
- Alignment: Center, vertical middle
- Line breaks: `\n` supported for multi-line content

**Icon Rendering:**
- Size: Slightly larger than text (e.g., `radius * 0.2`)
- Position: Above text, centered
- Emoji support via canvas text rendering

## Error Handling

**API Failures (Stocks):**
- Show last known data with indicator: "📈 AAPL $--- (stale)"
- Log error, retry on next interval
- Don't crash or skip rotation

**System API Unavailable:**
- Show "N/A" for unavailable metrics
- Continue showing available data
- Gracefully degrade (e.g., no battery on desktop)

**Invalid Configuration:**
- Fall back to defaults
- Log warning
- Don't prevent overlay from showing

## Testing Strategy

**Unit Tests:**
- Each ContentProvider independently
- Mock time/API responses
- Verify `getData()` format

**Integration Tests:**
- ContentRotator cycles through providers
- Settings changes propagate to providers
- Memory cleanup on destroy

**Manual Tests:**
- Visual: Each content type renders correctly at various ball sizes
- Multi-monitor: Content shows on all displays
- Performance: 60fps maintained with all providers enabled
- Edge cases: No internet (stocks), desktop vs laptop (battery)

## Implementation Phases

**Phase 1: Core Abstraction**
- Create ContentProvider base class
- Refactor BouncingBall to use provider pattern
- Implement ContentRotator
- Add ClockProvider (simplest, no API)

**Phase 2: Additional Providers**
- Implement StockProvider with Yahoo Finance
- Implement SystemInfoProvider with Electron APIs
- Test rotation between all three

**Phase 3: Settings UI**
- Add Content tab to settings window
- Implement per-provider configuration
- Wire up IPC handlers

**Phase 4: Polish**
- Error handling and fallbacks
- Performance optimization
- Documentation

## Open Questions

None - design approved.

## References

- Yahoo Finance unofficial API endpoints
- Electron `process.getCPUUsage()` and `process.getSystemMemoryInfo()`
- Canvas text rendering for emoji support
