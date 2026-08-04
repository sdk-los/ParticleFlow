/* ── Settings panel ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config, DEFAULT_CONFIG, SETTINGS_PRESETS } } = window;

  /* ── Settings application ── */
  const SETTING_APPLIERS = {
    particleCount: ParticleSystem.createParticles,
    particleShape: null,
    speedMultiplier: ParticleSystem.updateParticleSpeed,
    selfDriftEnabled: null,
    selfDriftIntensity: null,
    selfDriftSpeed: null,
    selfDriftMode: null,
    selfDriftDirection: null,
    particleSize: ParticleSystem.updateParticleSizes,
    hue: ParticleSystem.updateParticleHues,
    colorPalette: ParticleSystem.updateParticleColors,
    customColor1: ParticleSystem.updateParticleColors,
    customColor2: ParticleSystem.updateParticleColors,
    customColor3: ParticleSystem.updateParticleColors,
    cursorInteractionEnabled: null,
    cursorMode: ParticleSystem.syncCursorMode,
    shadowBlur: ParticleSystem.updateParticleShadowBlur,
    backgroundMode: ParticleSystem.renderBackground,
    backgroundColor: ParticleSystem.renderBackground,
    backgroundGradientStrength: ParticleSystem.renderBackground,
    showConnections: null,
    connectionDistance: null,
    connectionWidth: null,
    connectionOpacity: null,
    auroraEnabled: null,
    auroraIntensity: null,
    auroraSpeed: null,
    showParticleCount: null,
    /* ── Взрывы по клику ── */
    explosionEnabled: null,
    explosionCount: null,
    explosionSpeed: null,
    explosionLifetime: null,
    explosionSize: null,
    explosionMode: null,
    /* ── Тропы частиц ── */
    trailEnabled: null,
    trailLength: null,
    trailOpacity: null,
  };

  ParticleSystem.applySettings = function applySettings(key) {
    // Автоматически отключаем конфликтующие эффекты для оптимизации FPS
    if (key === 'trailEnabled' && config.trailEnabled) {
      config.shadowBlur = 0;
      ParticleSystem.updateParticleShadowBlur();
      const shadowBlurControl = ParticleSystem.getSettingControl('shadowBlur');
      if (shadowBlurControl) ParticleSystem.syncControl(shadowBlurControl);
    } else if (key === 'shadowBlur' && config.shadowBlur > 0) {
      config.trailEnabled = false;
      const trailControl = ParticleSystem.getSettingControl('trailEnabled');
      if (trailControl) ParticleSystem.syncControl(trailControl);
    }
    
    const applier = SETTING_APPLIERS[key];
    if (applier) applier();
  };

  /* ── Panel open/close ── */
  ParticleSystem.toggleSettings = function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    const isOpen = panel.classList.contains(CONSTANTS.CSS_OPEN_CLASS);
    panel.classList.toggle(CONSTANTS.CSS_OPEN_CLASS, !isOpen);
    overlay.classList.toggle(CONSTANTS.CSS_OPEN_CLASS, !isOpen);
  };

  ParticleSystem.closeSettings = function closeSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    panel.classList.remove(CONSTANTS.CSS_OPEN_CLASS);
    overlay.classList.remove(CONSTANTS.CSS_OPEN_CLASS);
  };

  /* ── Display helpers ── */
  ParticleSystem.formatDisplayValue = function formatDisplayValue(key, value) {
    if (key === 'attractionForce' || key === 'trailOpacity' || key === 'selfDriftIntensity' || key === 'selfDriftOrbitRepulsionStrength') return value.toFixed(2);
    if (key === 'speedMultiplier' || key === 'selfDriftSpeed') return value.toFixed(1);
    if (key === 'selfDriftOrbitRadius') return Math.round(value) + '%';
    return String(value);
  };

  ParticleSystem.getToggleLabelText = function getToggleLabelText(key, checked) {
    if (key === 'bounce' || key === 'showParticleCount' || key === 'showFps' || key === 'selfDriftEnabled' || key === 'selfDriftOrbitRepulsionEnabled' || key === 'cursorInteractionEnabled') {
      return checked ? 'Включена' : 'Выключена';
    }
    return checked ? 'Включены' : 'Выключены';
  };

  /* ── DOM queries ── */
  ParticleSystem.getSettingsControls = function getSettingsControls() {
    return document.querySelectorAll(
      `#settings-panel [${CONSTANTS.ATTR_SETTING}]`
    );
  };

  ParticleSystem.getSettingControl = function getSettingControl(key) {
    return document.getElementById('settings-panel').querySelector(
      `[${CONSTANTS.ATTR_SETTING}="${key}"]`
    );
  };

  ParticleSystem.getPresetSelect = function getPresetSelect() {
    return document.getElementById('settings-panel').querySelector('#preset-select');
  };

  /* ── Presets ── */
  ParticleSystem.doesPresetMatchConfig = function doesPresetMatchConfig(preset) {
    return Object.entries(preset.settings).every(
      ([key, value]) => config[key] === value
    );
  };

  ParticleSystem.getActivePresetKey = function getActivePresetKey() {
    return Object.keys(SETTINGS_PRESETS).find((presetKey) =>
      ParticleSystem.doesPresetMatchConfig(SETTINGS_PRESETS[presetKey])
    );
  };

  ParticleSystem.syncPresetSelect = function syncPresetSelect() {
    const activePresetKey = ParticleSystem.getActivePresetKey();
    const presetSelect = ParticleSystem.getPresetSelect();
    if (presetSelect) {
      presetSelect.value = activePresetKey || '';
    }
  };

  ParticleSystem.syncCustomPaletteVisibility = function syncCustomPaletteVisibility() {
    const customPaletteGroup = document.getElementById('settings-panel').querySelector('[data-custom-palette]');
    if (!customPaletteGroup) return;
    customPaletteGroup.classList.toggle(
      CONSTANTS.CSS_VISIBLE_CLASS,
      config.colorPalette === 'custom'
    );
  };

  ParticleSystem.syncDriftDirectionVisibility = function syncDriftDirectionVisibility() {
    const group = document.getElementById('settings-panel').querySelector('[data-drift-direction]');
    if (!group) return;
    group.classList.toggle(
      CONSTANTS.CSS_VISIBLE_CLASS,
      config.selfDriftMode === 'directional'
    );
  };

  ParticleSystem.syncDriftOrbitVisibility = function syncDriftOrbitVisibility() {
    const group = document.getElementById('settings-panel').querySelector('[data-drift-orbit]');
    if (!group) return;
    group.classList.toggle(
      CONSTANTS.CSS_VISIBLE_CLASS,
      config.selfDriftMode === 'orbit' || config.selfDriftMode === 'orbitGlobal' || config.selfDriftMode === 'spiral' || config.selfDriftMode === 'spiralIndividual'
    );
  };

  ParticleSystem.syncDriftOrbitRepulsionVisibility = function syncDriftOrbitRepulsionVisibility() {
    const groups = document.getElementById('settings-panel').querySelectorAll('[data-drift-orbit-repel]');
    if (!groups.length) return;
    groups.forEach((group) => {
      group.classList.toggle(
        CONSTANTS.CSS_VISIBLE_CLASS,
        config.selfDriftMode === 'orbitGlobal'
      );
    });
  };

  /* ── Input handlers ── */
  ParticleSystem.handleCheckboxInput = function handleCheckboxInput(input, key) {
    const value = input.checked;
    const wrapper = input.closest('.toggle-wrapper');
    if (wrapper) {
      const label = wrapper.querySelector(CONSTANTS.SELECTOR_TOGGLE_LABEL);
      if (label) label.textContent = ParticleSystem.getToggleLabelText(key, value);
    }
    return value;
  };

  ParticleSystem.handleRangeInput = function handleRangeInput(input, key) {
    const value = parseFloat(input.value);
    const group = input.closest(CONSTANTS.SELECTOR_CONTROL_GROUP);
    if (group) {
      const display = group.querySelector(`[${CONSTANTS.ATTR_DISPLAY}]`);
      if (display) display.textContent = ParticleSystem.formatDisplayValue(key, value);
    }
    return value;
  };

  ParticleSystem.handleSelectInput = function handleSelectInput(input) {
    return input.value;
  };

  ParticleSystem.handleColorInput = function handleColorInput(input) {
    return ParticleSystem.isValidHexColor(input.value) ? input.value : DEFAULT_CONFIG.customColor1;
  };

  /* ── Sync controls ── */
  ParticleSystem.syncControl = function syncControl(input) {
    const key = input.getAttribute(CONSTANTS.ATTR_SETTING);
    if (!Object.prototype.hasOwnProperty.call(config, key)) return;

    if (input.type === 'checkbox') {
      input.checked = config[key];
      ParticleSystem.handleCheckboxInput(input, key);
    } else if (input.type === 'color' || input.tagName === 'SELECT') {
      input.value = config[key];
    } else {
      input.value = config[key];
      ParticleSystem.handleRangeInput(input, key);
    }
  };

  ParticleSystem.syncControlsFromConfig = function syncControlsFromConfig() {
    ParticleSystem.getSettingsControls().forEach(ParticleSystem.syncControl);
    ParticleSystem.syncCustomPaletteVisibility();
    ParticleSystem.syncDriftDirectionVisibility();
    ParticleSystem.syncDriftOrbitVisibility();
    ParticleSystem.syncDriftOrbitRepulsionVisibility();
    ParticleSystem.syncPresetSelect();
    ParticleSystem.syncFpsIndicator();
  };

  /* ── Setting input handler ── */
  ParticleSystem.handleSettingInput = function handleSettingInput(input) {
    const key = input.getAttribute(CONSTANTS.ATTR_SETTING);
    let value;
    if (input.type === 'checkbox') {
      value = ParticleSystem.handleCheckboxInput(input, key);
    } else if (input.type === 'color') {
      value = ParticleSystem.handleColorInput(input);
    } else if (input.tagName === 'SELECT') {
      value = ParticleSystem.handleSelectInput(input);
    } else {
      value = ParticleSystem.handleRangeInput(input, key);
    }

    config[key] = value;
    if (key === 'colorPalette') ParticleSystem.syncCustomPaletteVisibility();
    if (key === 'selfDriftMode') ParticleSystem.syncDriftDirectionVisibility();
    if (key === 'selfDriftMode') ParticleSystem.syncDriftOrbitVisibility();
    if (key === 'selfDriftMode') ParticleSystem.syncDriftOrbitRepulsionVisibility();
    if (key === 'showFps' || key === 'showParticleCount') ParticleSystem.syncFpsIndicator();
    ParticleSystem.applySettings(key);
    ParticleSystem.syncPresetSelect();
    ParticleSystem.saveSettings();
  };

  /* ── Reset & Presets ── */
  ParticleSystem.resetSettings = function resetSettings() {
    Object.assign(config, DEFAULT_CONFIG);
    ParticleSystem.clearSavedSettings();
    ParticleSystem.syncControlsFromConfig();
    ParticleSystem.syncCursorMode();
    ParticleSystem.createParticles();
  };

  ParticleSystem.applyPreset = function applyPreset(presetKey) {
    const preset = SETTINGS_PRESETS[presetKey];
    if (!preset) return;

    Object.assign(config, preset.settings);
    
    // Разрешаем конфликты между shadowBlur и trailEnabled
    if (config.shadowBlur > 0 && config.trailEnabled) {
      config.trailEnabled = false;
    }
    
    ParticleSystem.syncControlsFromConfig();
    ParticleSystem.syncCursorMode();
    ParticleSystem.createParticles();
    ParticleSystem.saveSettings();
  };

  /* ── Bind settings ── */
  ParticleSystem.bindSettings = function bindSettings() {
    ParticleSystem.getSettingsControls().forEach((input) => {
      const eventName =
        input.type === 'checkbox' || input.type === 'color' || input.tagName === 'SELECT'
          ? 'change'
          : 'input';
      input.addEventListener(eventName, () => ParticleSystem.handleSettingInput(input));
    });

    const presetSelect = ParticleSystem.getPresetSelect();
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        if (presetSelect.value) {
          ParticleSystem.applyPreset(presetSelect.value);
        }
      });
    }
  };
})();