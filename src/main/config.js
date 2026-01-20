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
    minimum: 5,
    maximum: 30
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
  }
};
