const enabledCheckbox = document.getElementById('enabled');
const idleTimeoutSlider = document.getElementById('idle-timeout');
const timeoutValueSpan = document.getElementById('timeout-value');
const launchAtLoginCheckbox = document.getElementById('launch-at-login');
const playlistList = document.getElementById('playlist-list');
const playlistNameInput = document.getElementById('playlist-name');
const playlistUrlInput = document.getElementById('playlist-url');
const addPlaylistBtn = document.getElementById('add-playlist-btn');

let currentPlaylists = [];

async function loadSettings() {
  const settings = await window.oledSaver.getSettings();

  enabledCheckbox.checked = settings.enabled;

  const minutes = Math.round(settings.idleTimeout / 60);
  idleTimeoutSlider.value = minutes;
  timeoutValueSpan.textContent = minutes;

  launchAtLoginCheckbox.checked = settings.launchAtLogin;

  currentPlaylists = settings.playlists;
  renderPlaylists();
}

function renderPlaylists() {
  playlistList.innerHTML = '';

  currentPlaylists.forEach((playlist, index) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.innerHTML = `
      <div>
        <div class="name">${escapeHtml(playlist.name)}</div>
        <div class="url">${escapeHtml(playlist.url)}</div>
      </div>
      <button data-index="${index}" title="Remove">&times;</button>
    `;
    playlistList.appendChild(item);
  });

  // Add event listeners for remove buttons
  playlistList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      currentPlaylists = await window.oledSaver.removePlaylist(index);
      renderPlaylists();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
enabledCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ enabled: enabledCheckbox.checked });
});

idleTimeoutSlider.addEventListener('input', () => {
  timeoutValueSpan.textContent = idleTimeoutSlider.value;
});

idleTimeoutSlider.addEventListener('change', async () => {
  const seconds = parseInt(idleTimeoutSlider.value) * 60;
  await window.oledSaver.saveSettings({ idleTimeout: seconds });
});

launchAtLoginCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ launchAtLogin: launchAtLoginCheckbox.checked });
});

addPlaylistBtn.addEventListener('click', async () => {
  const name = playlistNameInput.value.trim();
  const url = playlistUrlInput.value.trim();

  if (!name || !url) {
    return;
  }

  // Basic YouTube URL validation
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    alert('Please enter a valid YouTube URL');
    return;
  }

  currentPlaylists = await window.oledSaver.addPlaylist(name, url);
  renderPlaylists();

  // Clear inputs
  playlistNameInput.value = '';
  playlistUrlInput.value = '';
});

// Allow adding playlist with Enter key
playlistUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addPlaylistBtn.click();
  }
});

// Initialize
loadSettings();
