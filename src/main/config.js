const Store = require('electron-store');

const schema = {
  idleTimeout: {
    type: 'number',
    default: 10,
    minimum: 5,
    maximum: 1800
  },
  enabled: {
    type: 'boolean',
    default: true
  },
  launchAtLogin: {
    type: 'boolean',
    default: false
  },
  hasPromptedAutoStart: {
    type: 'boolean',
    default: false
  },
  ballSizeMode: {
    type: 'string',
    enum: ['pixels', 'percentage'],
    default: 'percentage'
  },
  ballSize: {
    type: 'number',
    default: 10,
    minimum: 1,
    maximum: 500
  },
  ballOpacity: {
    type: 'number',
    default: 100,
    minimum: 10,
    maximum: 100
  },
  ballSpeed: {
    type: 'number',
    default: 100,
    minimum: 25,
    maximum: 300
  },
  theme: {
    type: 'string',
    enum: ['minimal', 'soft', 'glassy', 'abstract'],
    default: 'minimal'
  },
  contentRotation: {
    type: 'object',
    default: {
      enabled: true,
      intervalSeconds: 10,
      enabledProviders: ['clock', 'stocks', 'system']
    }
  },
  contentProviders: {
    type: 'object',
    default: {
      clock: {
        show24Hour: false
      },
      stocks: {
        symbols: ['AAPL', 'GOOGL', 'TSLA']
      },
      system: {
        showBattery: true
      }
    }
  },
  alwaysOnMode: {
    type: 'boolean',
    default: false
  },
  alwaysOnHotkey: {
    type: 'string',
    default: 'CommandOrControl+Alt+O'
  }
};

const store = new Store({ schema });

module.exports = {
  store,

  getIdleTimeout() {
    return store.get('idleTimeout');
  },

  setIdleTimeout(seconds) {
    store.set('idleTimeout', seconds);
  },

  isEnabled() {
    return store.get('enabled');
  },

  setEnabled(enabled) {
    store.set('enabled', enabled);
  },

  getLaunchAtLogin() {
    return store.get('launchAtLogin');
  },

  setLaunchAtLogin(value) {
    store.set('launchAtLogin', value);
  },

  hasPromptedAutoStart() {
    return store.get('hasPromptedAutoStart');
  },

  setHasPromptedAutoStart(value) {
    store.set('hasPromptedAutoStart', value);
  },

  getBallSizeMode() {
    return store.get('ballSizeMode');
  },

  setBallSizeMode(mode) {
    store.set('ballSizeMode', mode);
  },

  getBallSize() {
    return store.get('ballSize');
  },

  setBallSize(value) {
    store.set('ballSize', value);
  },

  getBallOpacity() {
    return store.get('ballOpacity');
  },

  setBallOpacity(percentage) {
    store.set('ballOpacity', percentage);
  },

  getBallSpeed() {
    return store.get('ballSpeed');
  },

  setBallSpeed(percentage) {
    store.set('ballSpeed', percentage);
  },

  getTheme() {
    return store.get('theme');
  },

  setTheme(themeId) {
    store.set('theme', themeId);
  },

  getContentRotation() {
    return store.get('contentRotation');
  },

  setContentRotation(settings) {
    store.set('contentRotation', settings);
  },

  getContentProviders() {
    return store.get('contentProviders');
  },

  setContentProviders(providers) {
    store.set('contentProviders', providers);
  },

  getContentSettings() {
    return {
      rotation: store.get('contentRotation'),
      providers: store.get('contentProviders')
    };
  },

  setContentSettings(settings) {
    if (settings.rotation) {
      store.set('contentRotation', settings.rotation);
    }
    if (settings.providers) {
      store.set('contentProviders', settings.providers);
    }
  },

  isAlwaysOnMode() {
    return store.get('alwaysOnMode');
  },

  setAlwaysOnMode(enabled) {
    store.set('alwaysOnMode', enabled);
  },

  getAlwaysOnHotkey() {
    return store.get('alwaysOnHotkey');
  },

  setAlwaysOnHotkey(accelerator) {
    store.set('alwaysOnHotkey', accelerator);
  }
};
