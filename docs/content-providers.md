# Content Providers

The OLED Saver supports configurable content inside the bouncing circle. Content rotates automatically between enabled providers.

## Built-in Providers

### Clock Provider
Displays current time and date.

**Settings:**
- Background color (default: #1a1a2e)
- 12/24 hour format

**Refresh:** Every 1 second

### Stock Ticker Provider
Displays stock prices from Yahoo Finance.

**Settings:**
- Stock symbols (comma-separated, e.g., "AAPL, GOOGL, TSLA")
- Background color (or auto-color based on gain/loss)

**Refresh:** Every 2 minutes
**Cycles through:** All configured symbols

### System Info Provider
Displays CPU, memory, and battery status.

**Settings:**
- Background color (default: #1a1a2e)
- Show battery (auto-detects laptop)

**Refresh:** Every 2 seconds

## Adding Custom Providers

To create a new content provider:

1. Extend the `ContentProvider` base class
2. Implement `fetchData()` to update `this.cachedData`
3. Implement `getRefreshInterval()` to return update frequency in ms
4. Add to `overlay.js` initialization

Example:

```javascript
class WeatherProvider extends ContentProvider {
  async fetchData() {
    // Fetch weather data
    this.cachedData = {
      icon: '☀️',
      text: '72°F\nSunny',
      backgroundColor: '#1a4d7a'
    };
  }

  getRefreshInterval() {
    return 600000; // 10 minutes
  }
}
```

## Configuration

Content settings are stored in electron-store:

```json
{
  "contentRotation": {
    "enabled": true,
    "intervalSeconds": 10,
    "enabledProviders": ["clock", "stocks", "system"]
  },
  "contentProviders": {
    "clock": { ... },
    "stocks": { ... },
    "system": { ... }
  }
}
```

Access via Settings → Content tab.
