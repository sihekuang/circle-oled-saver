const enabledCheckbox = document.getElementById('enabled');
const idleTimeoutSlider = document.getElementById('idle-timeout');
const timeoutValueInput = document.getElementById('timeout-value');
const ballSizeSlider = document.getElementById('ball-size');
const ballSizeValueInput = document.getElementById('ball-size-value');
const ballOpacitySlider = document.getElementById('ball-opacity');
const ballOpacityValueInput = document.getElementById('ball-opacity-value');
const launchAtLoginCheckbox = document.getElementById('launch-at-login');

async function loadSettings() {
  const settings = await window.oledSaver.getSettings();

  enabledCheckbox.checked = settings.enabled;

  idleTimeoutSlider.value = settings.idleTimeout;
  timeoutValueInput.value = settings.idleTimeout;

  ballSizeSlider.value = settings.ballSize;
  ballSizeValueInput.value = settings.ballSize;

  ballOpacitySlider.value = settings.ballOpacity;
  ballOpacityValueInput.value = settings.ballOpacity;

  launchAtLoginCheckbox.checked = settings.launchAtLogin;
}

async function saveTimeout(seconds) {
  seconds = Math.max(5, Math.min(300, parseInt(seconds) || 5));
  idleTimeoutSlider.value = seconds;
  timeoutValueInput.value = seconds;
  await window.oledSaver.saveSettings({ idleTimeout: seconds });
}

async function saveBallSize(percentage) {
  percentage = Math.max(1, Math.min(30, parseInt(percentage) || 10));
  ballSizeSlider.value = percentage;
  ballSizeValueInput.value = percentage;
  await window.oledSaver.saveSettings({ ballSize: percentage });
}

async function saveBallOpacity(percentage) {
  percentage = Math.max(10, Math.min(100, parseInt(percentage) || 100));
  ballOpacitySlider.value = percentage;
  ballOpacityValueInput.value = percentage;
  await window.oledSaver.saveSettings({ ballOpacity: percentage });
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

ballSizeSlider.addEventListener('input', () => {
  ballSizeValueInput.value = ballSizeSlider.value;
});

ballSizeSlider.addEventListener('change', async () => {
  await saveBallSize(ballSizeSlider.value);
});

ballSizeValueInput.addEventListener('change', async () => {
  await saveBallSize(ballSizeValueInput.value);
});

ballOpacitySlider.addEventListener('input', () => {
  ballOpacityValueInput.value = ballOpacitySlider.value;
});

ballOpacitySlider.addEventListener('change', async () => {
  await saveBallOpacity(ballOpacitySlider.value);
});

ballOpacityValueInput.addEventListener('change', async () => {
  await saveBallOpacity(ballOpacityValueInput.value);
});

launchAtLoginCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ launchAtLogin: launchAtLoginCheckbox.checked });
});

// Initialize
loadSettings();
