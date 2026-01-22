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

  // Content settings
  if (settings.content) {
    const { rotation, providers } = settings.content;

    // Rotation settings
    document.getElementById('content-rotation-enabled').checked = rotation.enabled;
    document.getElementById('rotation-interval').value = rotation.intervalSeconds;
    document.getElementById('rotation-interval-value').textContent = `${rotation.intervalSeconds}s`;

    // Enabled providers
    rotation.enabledProviders.forEach(provider => {
      const checkbox = document.getElementById(`provider-${provider}`);
      if (checkbox) checkbox.checked = true;
    });

    // Clock settings
    document.getElementById('clock-bg-color').value = providers.clock.backgroundColor;
    document.getElementById('clock-24hour').checked = providers.clock.show24Hour;

    // Stock settings
    document.getElementById('stock-symbols').value = providers.stocks.symbols.join(', ');
    if (providers.stocks.backgroundColor) {
      document.getElementById('stock-bg-color').value = providers.stocks.backgroundColor;
      document.getElementById('stock-auto-color').checked = false;
    } else {
      document.getElementById('stock-auto-color').checked = true;
    }

    // System settings
    document.getElementById('system-bg-color').value = providers.system.backgroundColor;
    document.getElementById('system-show-battery').checked = providers.system.showBattery;
  }
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

async function saveSettings() {
  // Content settings
  const enabledProviders = [];
  ['clock', 'stocks', 'system'].forEach(provider => {
    if (document.getElementById(`provider-${provider}`).checked) {
      enabledProviders.push(provider);
    }
  });

  const contentSettings = {
    rotation: {
      enabled: document.getElementById('content-rotation-enabled').checked,
      intervalSeconds: parseInt(document.getElementById('rotation-interval').value),
      enabledProviders: enabledProviders
    },
    providers: {
      clock: {
        backgroundColor: document.getElementById('clock-bg-color').value,
        show24Hour: document.getElementById('clock-24hour').checked
      },
      stocks: {
        backgroundColor: document.getElementById('stock-auto-color').checked ?
          null : document.getElementById('stock-bg-color').value,
        symbols: document.getElementById('stock-symbols').value
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
      },
      system: {
        backgroundColor: document.getElementById('system-bg-color').value,
        showBattery: document.getElementById('system-show-battery').checked
      }
    }
  };

  await window.oledSaver.saveContentSettings(contentSettings);
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

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    // Add active class to clicked button and corresponding tab
    btn.classList.add('active');
    const tabId = btn.dataset.tab + '-tab';
    document.getElementById(tabId).classList.add('active');
  });
});

// Content settings event listeners
document.getElementById('rotation-interval').addEventListener('input', (e) => {
  document.getElementById('rotation-interval-value').textContent = `${e.target.value}s`;
});

// Save content settings when any content input changes
const contentInputs = [
  'content-rotation-enabled',
  'rotation-interval',
  'provider-clock',
  'provider-stocks',
  'provider-system',
  'clock-bg-color',
  'clock-24hour',
  'stock-symbols',
  'stock-bg-color',
  'stock-auto-color',
  'system-bg-color',
  'system-show-battery'
];

contentInputs.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    const eventType = element.type === 'range' ? 'change' :
                      element.type === 'text' ? 'blur' : 'change';
    element.addEventListener(eventType, saveSettings);
  }
});

// Initialize
loadSettings();
