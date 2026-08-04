/* ── Configuration ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, COLOR_PALETTES, CURSOR_MODES } } = window;

  ParticleSystem.DEFAULT_CONFIG = Object.freeze({
    particleCount: 250,
    particleSize: 4,
    particleShape: 'circle',
    speedMultiplier: 1.0,
    selfDriftEnabled: false,
    selfDriftIntensity: 0.08,
    selfDriftSpeed: 0.5,
    selfDriftOrbitRadius: 0,
    selfDriftOrbitRepulsionEnabled: false,
    selfDriftOrbitRepulsionStrength: 0.35,
    selfDriftMode: 'random',
    selfDriftDirection: 0,
    hue: 130,
    colorPalette: 'mono',
    customColor1: '#0acf83',
    customColor2: '#38bdf8',
    customColor3: '#f97316',
    cursorInteractionEnabled: true,
    attractionForce: 0.3,
    cursorMode: 'attract',
    attractionRadius: 200,
    shadowBlur: 0,
    pulsate: true,
    bounce: true,
    showFps: true,
    showParticleCount: true,
    backgroundMode: 'gradient',
    backgroundColor: '#1a1a2e',
    backgroundGradientStrength: 0.35,
    auroraEnabled: false,
    auroraIntensity: 0.3,
    auroraSpeed: 0.8,
    showConnections: false,
    connectionDistance: 120,
    connectionWidth: 1,
    connectionOpacity: 0.3,
    /* ── Взрывы по клику ── */
    explosionEnabled: false,
    explosionCount: 30,
    explosionSpeed: 6,
    explosionLifetime: 1000,
    explosionSize: 4,
    explosionMode: 'burst',
    /* ── Тропы частиц ── */
    trailEnabled: false,
    trailLength: 10,
    trailOpacity: 0.3,
  });

  // Каждый пресет начинается с полной конфигурации. Это исключает случайное
  // сохранение тяжёлых эффектов от ранее выбранного режима.
  const createPreset = (label, settings) => Object.freeze({
    label,
    settings: Object.freeze({ ...ParticleSystem.DEFAULT_CONFIG, ...settings }),
  });

  ParticleSystem.SETTINGS_PRESETS = Object.freeze({
    calm: createPreset('Calm', {
        particleCount: 110,
        particleSize: 3,
        speedMultiplier: 0.4,
        selfDriftEnabled: false,
        selfDriftIntensity: 0.04,
        selfDriftSpeed: 0.3,
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
        auroraEnabled: false,
        auroraIntensity: 0.25,
        auroraSpeed: 0.6,
        connectionDistance: 100,
        connectionWidth: 0.8,
        connectionOpacity: 0.2,
    }),
    neon: createPreset('Neon', {
        particleCount: 240,
        particleSize: 4,
        speedMultiplier: 1.4,
        selfDriftEnabled: true,
        selfDriftIntensity: 0.15,
        selfDriftSpeed: 1.1,
        selfDriftMode: 'random',
        selfDriftDirection: 0,
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
        auroraEnabled: true,
        auroraIntensity: 0.65,
        auroraSpeed: 1.2,
        connectionDistance: 150,
        connectionWidth: 1.5,
        connectionOpacity: 0.4,
    }),
    storm: createPreset('Storm', {
        particleCount: 220,
        particleSize: 5,
        speedMultiplier: 2.2,
        selfDriftEnabled: true,
        selfDriftIntensity: 0.2,
        selfDriftSpeed: 1.6,
        selfDriftMode: 'random',
        selfDriftDirection: 0,
        hue: 265,
        colorPalette: 'rainbow',
        attractionForce: 0.75,
        cursorMode: 'orbit',
        attractionRadius: 360,
        shadowBlur: 30,
        pulsate: true,
        bounce: true,
        backgroundMode: 'solid',
        backgroundColor: '#030711',
        backgroundGradientStrength: 0.25,
        auroraEnabled: false,
        auroraIntensity: 0.2,
        auroraSpeed: 0.7,
        connectionDistance: 180,
        connectionWidth: 2.0,
        connectionOpacity: 0.5,
    }),
    minimal: createPreset('Minimal', {
        particleCount: 55,
        particleSize: 2,
        speedMultiplier: 0.5,
        selfDriftEnabled: false,
        selfDriftIntensity: 0.03,
        selfDriftSpeed: 0.2,
        hue: 160,
        colorPalette: 'mono',
        attractionForce: 0.1,
        cursorMode: 'trail',
        attractionRadius: 120,
        shadowBlur: 0,
        pulsate: false,
        bounce: false,
        backgroundMode: 'transparent',
        backgroundColor: '#111827',
        backgroundGradientStrength: 0.1,
        auroraEnabled: false,
        auroraIntensity: 0.15,
        auroraSpeed: 0.5,
        connectionDistance: 80,
        connectionWidth: 0.5,
        connectionOpacity: 0.1,
    }),
    constellation: createPreset('Constellation', {
      particleCount: 120,
      particleSize: 2,
      particleShape: 'ring',
      speedMultiplier: 0.35,
      selfDriftEnabled: true,
      selfDriftIntensity: 0.12,
      selfDriftSpeed: 0.65,
      selfDriftMode: 'orbit',
      selfDriftOrbitRadius: 10,
      hue: 215,
      colorPalette: 'cool',
      cursorMode: 'orbit',
      attractionForce: 0.75,
      attractionRadius: 160,
      pulsate: true,
      backgroundMode: 'gradient',
      backgroundColor: '#091427',
      backgroundGradientStrength: 0.45,
      showConnections: true,
      connectionDistance: 115,
      connectionWidth: 0.6,
      connectionOpacity: 0.28,
    }),
    comet: createPreset('Comet', {
      particleCount: 75,
      particleSize: 3,
      particleShape: 'drop',
      speedMultiplier: 1.7,
      selfDriftEnabled: true,
      selfDriftIntensity: 0.12,
      selfDriftSpeed: 1.2,
      selfDriftMode: 'directional',
      selfDriftDirection: 25,
      hue: 190,
      colorPalette: 'cool',
      cursorMode: 'repel',
      attractionForce: 0.28,
      attractionRadius: 170,
      pulsate: true,
      bounce: false,
      backgroundMode: 'solid',
      backgroundColor: '#020817',
      trailEnabled: true,
      trailLength: 18,
      trailOpacity: 0.38,
    }),
    aurora: createPreset('Aurora', {
      particleCount: 55,
      particleSize: 2,
      particleShape: 'circle',
      speedMultiplier: 0.65,
      selfDriftEnabled: true,
      selfDriftIntensity: 0.14,
      selfDriftSpeed: 0.7,
      selfDriftMode: 'wave',
      hue: 155,
      colorPalette: 'neon',
      cursorMode: 'orbit',
      attractionForce: 0.22,
      attractionRadius: 180,
      shadowBlur: 0,
      pulsate: false,
      backgroundMode: 'gradient',
      backgroundColor: '#061a22',
      backgroundGradientStrength: 0.6,
      auroraEnabled: true,
      auroraIntensity: 0.48,
      auroraSpeed: 0.7,
    }),
    fireworks: createPreset('Fireworks', {
      particleCount: 65,
      particleSize: 3,
      particleShape: 'star',
      speedMultiplier: 0.65,
      selfDriftEnabled: true,
      selfDriftIntensity: 0.12,
      selfDriftSpeed: 0.55,
      selfDriftMode: 'spiralIndividual',
      colorPalette: 'custom',
      customColor1: '#fbbf24',
      customColor2: '#fb7185',
      customColor3: '#a78bfa',
      cursorMode: 'repel',
      attractionForce: 0.45,
      attractionRadius: 150,
      pulsate: true,
      backgroundMode: 'solid',
      backgroundColor: '#10051d',
      explosionEnabled: true,
      explosionCount: 100,
      explosionSpeed: 15,
      explosionLifetime: 1200,
      explosionSize: 4,
      explosionMode: 'spawn',
    }),
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
    if (typeof defaultValue === 'string') {
      return typeof value === 'string' ? value : defaultValue;
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
    if (key === 'selfDriftMode') {
      return ['random', 'horizontal', 'vertical', 'upDown', 'leftRight', 'up', 'down', 'left', 'right', 'directional', 'orbit', 'orbitGlobal', 'wave', 'spiral', 'spiralIndividual', 'snake'].includes(value)
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
