const Store = require('electron-store');

const DEFAULT_PLAYLISTS = [
  {
    name: 'Ambient',
    url: 'https://www.youtube.com/watch?v=3vQ55ToQeWI'
  }
];

const schema = {
  idleTimeout: {
    type: 'number',
    default: 10,
    minimum: 5,
    maximum: 1800
  },
  playlists: {
    type: 'array',
    default: DEFAULT_PLAYLISTS,
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' }
      },
      required: ['name', 'url']
    }
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
  currentPlaylistIndex: {
    type: 'number',
    default: 0
  }
};

const store = new Store({ schema });

module.exports = {
  store,
  DEFAULT_PLAYLISTS,

  getIdleTimeout() {
    return store.get('idleTimeout');
  },

  setIdleTimeout(seconds) {
    store.set('idleTimeout', seconds);
  },

  getPlaylists() {
    return store.get('playlists');
  },

  setPlaylists(playlists) {
    store.set('playlists', playlists);
  },

  addPlaylist(name, url) {
    const playlists = store.get('playlists');
    playlists.push({ name, url });
    store.set('playlists', playlists);
  },

  removePlaylist(index) {
    const playlists = store.get('playlists');
    playlists.splice(index, 1);
    store.set('playlists', playlists);
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

  getCurrentPlaylistIndex() {
    return store.get('currentPlaylistIndex');
  },

  setCurrentPlaylistIndex(index) {
    store.set('currentPlaylistIndex', index);
  },

  getNextPlaylist() {
    const playlists = store.get('playlists');
    if (playlists.length === 0) return null;

    let index = store.get('currentPlaylistIndex');
    index = (index + 1) % playlists.length;
    store.set('currentPlaylistIndex', index);
    return playlists[index];
  },

  getCurrentPlaylist() {
    const playlists = store.get('playlists');
    const index = store.get('currentPlaylistIndex');
    if (playlists.length === 0) return null;
    return playlists[index % playlists.length];
  }
};
