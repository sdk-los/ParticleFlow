/* ── Configuration ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, COLOR_PALETTES, CURSOR_MODES } } = window;

  ParticleSystem.DEFAULT_CONFIG = Object.freeze({
    particleCount: 150,
    particleSize: 4,
    speedMultiplier: 1.0,
    hue: 130,
    colorPalette: 'mono',
    customColor1: '#0acf83',
    customColor2: '#38bdf8',
    customColor3: '#f97316',
    attractionForce: 0.3,
    cursorMode: 'attract',
    attractionRadius: 200,
    shadowBlur: 20,
    pulsate: true,
    bounce: true,
    showFps: false,
    backgroundMode: 'gradient',
    backgroundColor: '#1a1a2e',
    backgroundGradientStrength: 0.35,
    showConnections: true,
    connectionDistance: 120,
    connectionWidth: 1,
    connectionOpacity: 0.3,
  });

  ParticleSystem.SETTINGS_PRESETS = Object.freeze({
    calm: {
      label: 'Calm',
      settings: {
        particleCount: 110,
        particleSize: 3,
        speedMultiplier: 0.4,
        hue: 205,
        colorPalette: 'cool',
        attractionForce: 0.15,
        cursorMode: 'attract',
        attractionRadius: 140,
        shadowBlur: 10,
        pulsate: true,
        bounce: true,
        backgroundMode: 'gradient',
        backgroundColor: '#14213d',
        backgroundGradientStrength: 0.2,
        showConnections: true,
        connectionDistance: 100,
        connectionWidth: 0.8,
        connectionOpacity: 0.2,
      },
    },
    neon: {
      label: 'Neon',
      settings: {
        particleCount: 240,
        particleSize: 4,
        speedMultiplier: 1.4,
        hue: 130,
        colorPalette: 'neon',
        attractionForce: 0.35,
        cursorMode: 'orbit',
        attractionRadius: 250,
        shadowBlur: 40,
        pulsate: true,
        bounce: true,
        backgroundMode: 'gradient',
        backgroundColor: '#060b1f',
        backgroundGradientStrength: 0.7,
        showConnections: true,
        connectionDistance: 150,
        connectionWidth: 1.5,
        connectionOpacity: 0.4,
      },
    },
    storm: {
      label: 'Storm',
      settings: {
        particleCount: 220,
        particleSize: 5,
        speedMultiplier: 2.2,
        hue: 265,
        colorPalette: 'rainbow',
        attractionForce: 0.75,
        cursorMode: 'repel',
        attractionRadius: 360,
        shadowBlur: 30,
        pulsate: true,
        bounce: true,
        backgroundMode: 'solid',
        backgroundColor: '#030711',
        backgroundGradientStrength: 0.25,
        showConnections: true,
        connectionDistance: 180,
        connectionWidth: 2.0,
        connectionOpacity: 0.5,
      },
    },
    minimal: {
      label: 'Minimal',
      settings: {
        particleCount: 55,
        particleSize: 2,
        speedMultiplier: 0.5,
        hue: 160,
        colorPalette: 'mono',
        attractionForce: 0.1,
        cursorMode: 'trail',
        attractionRadius: 120,
        shadowBlur: 4,
        pulsate: false,
        bounce: false,
        backgroundMode: 'transparent',
        backgroundColor: '#111827',
        backgroundGradientStrength: 0.1,
        showConnections: false,
        connectionDistance: 80,
        connectionWidth: 0.5,
        connectionOpacity: 0.1,
      },
    },
  });

  ParticleSystem.config = { ...ParticleSystem.DEFAULT_CONFIG };

  /* ── Settings persistence ── */

  ParticleSystem.readNumberSetting = function readNumberSetting(key, value) {
    const input = ParticleSystem.getSettingControl
      ? ParticleSystem.getSettingControl(key)
      : null;
    const number = Number(value);
    if (!Number.isFinite(number)) return ParticleSystem.DEFAULT_CONFIG[key];

    const min = input ? Number(input.min) : NaN;
    const max = input ? Number(input.max) : NaN;
    return ParticleSystem.clamp(
      number,
      Number.isFinite(min) ? min : number,
      Number.isFinite(max) ? max : number
    );
  };

  ParticleSystem.readStoredSetting = function readStoredSetting(key, value) {
    const defaultValue = ParticleSystem.DEFAULT_CONFIG[key];
    if (typeof defaultValue === 'boolean') {
      return typeof value === 'boolean' ? value : defaultValue;
    }
    if (key === 'colorPalette') {
      return Object.prototype.hasOwnProperty.call(COLOR_PALETTES, value)
        ? value
        : defaultValue;
    }
    if (key === 'cursorMode') {
      return Object.prototype.hasOwnProperty.call(CURSOR_MODES, value)
        ? value
        : defaultValue;
    }
    if (key === 'backgroundMode') {
      return ['solid', 'gradient', 'transparent'].includes(value) ? value : defaultValue;
    }
    if (key === 'backgroundColor') {
      return ParticleSystem.isValidHexColor(value) ? value : defaultValue;
    }
    if (key.startsWith('customColor')) {
      return ParticleSystem.isValidHexColor(value) ? value : defaultValue;
    }
    return ParticleSystem.readNumberSetting(key, value);
  };

  ParticleSystem.loadSavedSettings = function loadSavedSettings() {
    try {
      const savedSettings = window.localStorage.getItem(CONSTANTS.STORAGE_KEY);
      if (!savedSettings) return;

      const parsedSettings = JSON.parse(savedSettings);
      if (!parsedSettings || typeof parsedSettings !== 'object') return;

      Object.keys(ParticleSystem.DEFAULT_CONFIG).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(parsedSettings, key)) {
          ParticleSystem.config[key] = ParticleSystem.readStoredSetting(key, parsedSettings[key]);
        }
      });
    } catch (error) {
      console.warn('Не удалось загрузить настройки:', error);
    }
  };

  ParticleSystem.saveSettings = function saveSettings() {
    try {
      window.localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(ParticleSystem.config));
    } catch (error) {
      console.warn('Не удалось сохранить настройки:', error);
    }
  };

  ParticleSystem.clearSavedSettings = function clearSavedSettings() {
    try {
      window.localStorage.removeItem(CONSTANTS.STORAGE_KEY);
    } catch (error) {
      console.warn('Не удалось сбросить сохранённые настройки:', error);
    }
  };
})();