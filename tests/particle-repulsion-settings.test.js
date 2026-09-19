const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const settingsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'settings.js'), 'utf8');

function loadSettingsSystem(groups) {
  const selectorMap = {
    '[data-particle-repulsion-setting]': groups,
    '[data-self-drift-setting]': groups,
    '[data-velocity-stretch-setting]': groups,
  };

  const panel = {
    querySelectorAll: (selector) => selectorMap[selector] || [],
  };

  const document = {
    getElementById: (id) => (id === 'settings-panel' ? panel : null),
    querySelectorAll: () => [],
  };

  const ParticleSystem = {
    CONSTANTS: {
      ATTR_SETTING: 'data-setting',
      CSS_VISIBLE_CLASS: 'is-visible',
      SELECTOR_TOGGLE_LABEL: '.toggle-label',
      SELECTOR_CONTROL_GROUP: '.control-group',
    },
    config: { particleRepulsionEnabled: false },
    DEFAULT_CONFIG: {},
    SETTINGS_PRESETS: {},
    getPerformanceLimits: () => ({}),
    syncCursorMode: () => {},
    updateParticleShadowBlur: () => {},
    createParticles: () => {},
    applyPerformanceProfile: () => {},
    clampConfigToPerformanceProfile: () => {},
    syncFpsIndicator: () => {},
    saveSettings: () => {},
    getSettingsControls: () => [],
    clearRuntimeOverrides: () => {},
    resetAdaptiveQualityState: () => {},
    clearSavedSettings: () => {},
    ADAPTIVE_QUALITY_ORDER: [],
  };

  const context = {
    window: { ParticleSystem },
    document,
    console,
    navigator: {},
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => cb(),
    cancelAnimationFrame: () => {},
  };

  context.window.window = context.window;
  context.window.document = document;

  vm.createContext(context);
  vm.runInContext(settingsSource, context);

  return context.window.ParticleSystem;
}

test('particle repulsion settings hide when the toggle is off', () => {
  const groups = [
    { hidden: false },
    { hidden: false },
  ];

  const ParticleSystem = loadSettingsSystem(groups);
  assert.strictEqual(typeof ParticleSystem.syncParticleRepulsionSettingsVisibility, 'function');

  ParticleSystem.config.particleRepulsionEnabled = false;
  ParticleSystem.syncParticleRepulsionSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === true), true);

  ParticleSystem.config.particleRepulsionEnabled = true;
  ParticleSystem.syncParticleRepulsionSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === false), true);
});

test('self drift settings hide when the toggle is off', () => {
  const groups = [
    { hidden: false },
    { hidden: false },
  ];

  const ParticleSystem = loadSettingsSystem(groups);
  assert.strictEqual(typeof ParticleSystem.syncSelfDriftSettingsVisibility, 'function');

  ParticleSystem.config.selfDriftEnabled = false;
  ParticleSystem.syncSelfDriftSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === true), true);

  ParticleSystem.config.selfDriftEnabled = true;
  ParticleSystem.syncSelfDriftSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === false), true);
});

test('velocity stretch settings hide when the toggle is off', () => {
  const groups = [
    { hidden: false },
    { hidden: false },
  ];

  const ParticleSystem = loadSettingsSystem(groups);
  assert.strictEqual(typeof ParticleSystem.syncVelocityStretchSettingsVisibility, 'function');

  ParticleSystem.config.velocityStretchEnabled = false;
  ParticleSystem.syncVelocityStretchSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === true), true);

  ParticleSystem.config.velocityStretchEnabled = true;
  ParticleSystem.syncVelocityStretchSettingsVisibility();
  assert.equal(groups.every((group) => group.hidden === false), true);
});
