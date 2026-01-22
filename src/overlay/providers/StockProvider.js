// src/overlay/providers/StockProvider.js
const ContentProvider = require('./ContentProvider');

class StockProvider extends ContentProvider {
  constructor(config = {}) {
    super(config);
    this.symbols = config.symbols || ['AAPL', 'GOOGL', 'TSLA'];
    this.currentIndex = 0;
    this.stockData = {}; // Cache: { symbol: { price, change, changePercent } }
  }

  async fetchData() {
    try {
      // Fetch all symbols
      await this.fetchAllStocks();

      // Get current symbol data
      const symbol = this.symbols[this.currentIndex];
      const data = this.stockData[symbol] || { price: '---', change: 0, changePercent: 0 };

      const arrow = data.change >= 0 ? '↑' : '↓';
      const changePercent = Math.abs(data.changePercent).toFixed(2);

      // Determine background color
      let bgColor = this.config.backgroundColor;
      if (bgColor === null || bgColor === undefined) {
        // Auto color based on gain/loss
        bgColor = data.change >= 0 ? '#1a4d2e' : '#4d1a1a';
      }

      this.cachedData = {
        icon: '📈',
        text: `${symbol} $${data.price}\n${arrow} ${changePercent}%`,
        backgroundColor: bgColor
      };

      // Rotate to next symbol for next display
      this.currentIndex = (this.currentIndex + 1) % this.symbols.length;
    } catch (err) {
      console.error('StockProvider fetch error:', err);
      this.cachedData = {
        icon: '📈',
        text: 'Market data\nunavailable',
        backgroundColor: this.config.backgroundColor || '#1a1a2e'
      };
    }
  }

  async fetchAllStocks() {
    // Fetch data for all symbols from Yahoo Finance
    const promises = this.symbols.map(symbol => this.fetchStockQuote(symbol));
    await Promise.allSettled(promises);
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
    return 120000; // Fetch every 2 minutes
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StockProvider;
}
