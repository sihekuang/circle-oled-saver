const enabledCheckbox = document.getElementById('enabled');
const idleTimeoutSlider = document.getElementById('idle-timeout');
const timeoutValueInput = document.getElementById('timeout-value');
const launchAtLoginCheckbox = document.getElementById('launch-at-login');

async function loadSettings() {
  const settings = await window.oledSaver.getSettings();

  enabledCheckbox.checked = settings.enabled;

  idleTimeoutSlider.value = settings.idleTimeout;
  timeoutValueInput.value = settings.idleTimeout;

  launchAtLoginCheckbox.checked = settings.launchAtLogin;
}

async function saveTimeout(seconds) {
  seconds = Math.max(5, Math.min(300, parseInt(seconds) || 5));
  idleTimeoutSlider.value = seconds;
  timeoutValueInput.value = seconds;
  await window.oledSaver.saveSettings({ idleTimeout: seconds });
}

// Event listeners
enabledCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ enabled: enabledCheckbox.checked });
});

idleTimeoutSlider.addEventListener('input', () => {
  timeoutValueInput.value = idleTimeoutSlider.value;
});

idleTimeoutSlider.addEventListener('change', async () => {
  await saveTimeout(idleTimeoutSlider.value);
});

timeoutValueInput.addEventListener('change', async () => {
  await saveTimeout(timeoutValueInput.value);
});

launchAtLoginCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ launchAtLogin: launchAtLoginCheckbox.checked });
});

// Initialize
loadSettings();
