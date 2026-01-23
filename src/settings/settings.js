const enabledCheckbox = document.getElementById('enabled');
const idleTimeoutSlider = document.getElementById('idle-timeout');
const timeoutValueInput = document.getElementById('timeout-value');
const ballSizeModeRadios = document.querySelectorAll('input[name="ball-size-mode"]');
const ballSizeSlider = document.getElementById('ball-size');
const ballSizeValueInput = document.getElementById('ball-size-value');
const ballSizeUnit = document.getElementById('ball-size-unit');
const ballOpacitySlider = document.getElementById('ball-opacity');
const ballOpacityValueInput = document.getElementById('ball-opacity-value');
const ballSpeedSlider = document.getElementById('ball-speed');
const ballSpeedValueInput = document.getElementById('ball-speed-value');
const launchAtLoginCheckbox = document.getElementById('launch-at-login');

async function loadSettings() {
  const settings = await window.oledSaver.getSettings();

  enabledCheckbox.checked = settings.enabled;

  idleTimeoutSlider.value = settings.idleTimeout;
  timeoutValueInput.value = settings.idleTimeout;

  // Set ball size mode
  const mode = settings.ballSizeMode || 'percentage';
  ballSizeModeRadios.forEach(radio => {
    radio.checked = radio.value === mode;
  });
  updateBallSizeControls(mode);

  ballSizeSlider.value = settings.ballSize;
  ballSizeValueInput.value = settings.ballSize;

  ballOpacitySlider.value = settings.ballOpacity;
  ballOpacityValueInput.value = settings.ballOpacity;

  ballSpeedSlider.value = settings.ballSpeed;
  ballSpeedValueInput.value = settings.ballSpeed;

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
    document.getElementById('clock-24hour').checked = providers.clock.show24Hour;

    // Stock settings
    document.getElementById('stock-symbols').value = providers.stocks.symbols.join(', ');

    // System settings
    document.getElementById('system-show-battery').checked = providers.system.showBattery;
  }
}

async function saveTimeout(seconds) {
  seconds = Math.max(5, Math.min(300, parseInt(seconds) || 5));
  idleTimeoutSlider.value = seconds;
  timeoutValueInput.value = seconds;
  await window.oledSaver.saveSettings({ idleTimeout: seconds });
}

function updateBallSizeControls(mode) {
  if (mode === 'pixels') {
    ballSizeSlider.min = 50;
    ballSizeSlider.max = 500;
    ballSizeValueInput.min = 50;
    ballSizeValueInput.max = 500;
    ballSizeUnit.textContent = 'px';
  } else {
    ballSizeSlider.min = 1;
    ballSizeSlider.max = 30;
    ballSizeValueInput.min = 1;
    ballSizeValueInput.max = 30;
    ballSizeUnit.textContent = '%';
  }
}

async function saveBallSize(value) {
  const mode = document.querySelector('input[name="ball-size-mode"]:checked').value;

  if (mode === 'pixels') {
    value = Math.max(50, Math.min(500, parseInt(value) || 100));
  } else {
    value = Math.max(1, Math.min(30, parseInt(value) || 10));
  }

  ballSizeSlider.value = value;
  ballSizeValueInput.value = value;
  await window.oledSaver.saveSettings({ ballSize: value });
}

async function saveBallOpacity(percentage) {
  percentage = Math.max(10, Math.min(100, parseInt(percentage) || 100));
  ballOpacitySlider.value = percentage;
  ballOpacityValueInput.value = percentage;
  await window.oledSaver.saveSettings({ ballOpacity: percentage });
}

async function saveBallSpeed(percentage) {
  percentage = Math.max(25, Math.min(300, parseInt(percentage) || 100));
  ballSpeedSlider.value = percentage;
  ballSpeedValueInput.value = percentage;
  await window.oledSaver.saveSettings({ ballSpeed: percentage });
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
        show24Hour: document.getElementById('clock-24hour').checked
      },
      stocks: {
        symbols: document.getElementById('stock-symbols').value
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
      },
      system: {
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

ballSizeModeRadios.forEach(radio => {
  radio.addEventListener('change', async () => {
    const mode = radio.value;
    updateBallSizeControls(mode);

    // Reset to default value for the new mode
    const defaultValue = mode === 'pixels' ? 100 : 10;
    ballSizeSlider.value = defaultValue;
    ballSizeValueInput.value = defaultValue;

    await window.oledSaver.saveSettings({ ballSizeMode: mode, ballSize: defaultValue });
  });
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

ballSpeedSlider.addEventListener('input', () => {
  ballSpeedValueInput.value = ballSpeedSlider.value;
});

ballSpeedSlider.addEventListener('change', async () => {
  await saveBallSpeed(ballSpeedSlider.value);
});

ballSpeedValueInput.addEventListener('change', async () => {
  await saveBallSpeed(ballSpeedValueInput.value);
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
