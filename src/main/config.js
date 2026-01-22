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
  ballSize: {
    type: 'number',
    default: 10,
    minimum: 1,
    maximum: 30
  },
  ballOpacity: {
    type: 'number',
    default: 100,
    minimum: 10,
    maximum: 100
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
        backgroundColor: 'auto',
        show24Hour: false
      },
      stocks: {
        backgroundColor: null,
        symbols: ['AAPL', 'GOOGL', 'TSLA']
      },
      system: {
        backgroundColor: '#1a1a2e',
        showBattery: true
      }
    }
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

  getBallSize() {
    return store.get('ballSize');
  },

  setBallSize(percentage) {
    store.set('ballSize', percentage);
  },

  getBallOpacity() {
    return store.get('ballOpacity');
  },

  setBallOpacity(percentage) {
    store.set('ballOpacity', percentage);
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
  }
};
