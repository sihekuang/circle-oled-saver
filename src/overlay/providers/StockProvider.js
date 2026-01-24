// src/overlay/providers/StockProvider.js

class StockProvider extends window.ContentProvider {
  constructor(config = {}) {
    super(config);
    this.symbols = config.symbols || ['AAPL', 'GOOGL', 'TSLA'];
    this.refreshSeconds = config.refreshSeconds || 300;
    this.currentIndex = 0;
    this.stockData = {}; // Cache: { symbol: { price, change, changePercent } }
  }

  async fetchData() {
    try {
      await this.fetchAllStocks();

      const symbol = this.symbols[this.currentIndex];
      const data = this.stockData[symbol];

      if (!data) {
        // No data available yet
        this.cachedData = {
          icon: 'trending-up',
          text: `${symbol}\nLoading...`
        };
      } else {
        const arrow = data.change >= 0 ? '↑' : '↓';
        const changePercent = Math.abs(data.changePercent).toFixed(2);

        this.cachedData = {
          icon: 'trending-up',
          text: `${symbol} $${data.price}\n${arrow} ${changePercent}%`
        };
      }

      // Rotate to next symbol
      this.currentIndex = (this.currentIndex + 1) % this.symbols.length;

      console.log(`[${this.constructor.name}] Data updated:`, this.cachedData.text.replace('\n', ' '));
    } catch (err) {
      console.error('StockProvider fetch error:', err);
      this.cachedData = {
        icon: 'trending-up',
        text: 'Market data\nunavailable'
      };
    }
  }

  async fetchAllStocks() {
    // Fetch stocks sequentially with delay to avoid rate limiting
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      try {
        await this.fetchStockQuote(symbol);
        // Add 3 second delay between requests to avoid aggressive rate limiting
        if (i < this.symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (err) {
        console.warn(`Failed to fetch ${symbol}:`, err);
      }
    }
  }

  async fetchStockQuote(symbol) {
    try {
      // Yahoo Finance API endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const quote = result.meta;

        const price = quote.regularMarketPrice?.toFixed(2) || '---';
        const previousClose = quote.chartPreviousClose || quote.regularMarketPrice;
        const change = quote.regularMarketPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        this.stockData[symbol] = {
          price: price,
          change: change,
          changePercent: changePercent
        };
      }
    } catch (err) {
      console.error(`Failed to fetch ${symbol}:`, err);
      // Keep existing cached data if available
    }
  }

  getRefreshInterval() {
    return this.refreshSeconds * 1000;
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.StockProvider = StockProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StockProvider;
}
