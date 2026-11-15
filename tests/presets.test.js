const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(root, 'js', 'constants.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
const settingsSource = fs.readFileSync(path.join(root, 'js', 'settings.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadPresets() {
  const context = {
    window: {},
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      querySelectorAll: () => [],
      getElementById: () => ({
        querySelector: () => null,
        querySelectorAll: () => [],
      }),
      addEventListener: () => {},
    },
    navigator: { clipboard: null },
  };
  context.window = context;
  context.window.ParticleSystem = {};
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  vm.runInContext(settingsSource, context);
  return context.window.ParticleSystem;
}

test('new presets are selectable and reset all configuration keys', () => {
  const { DEFAULT_CONFIG, SETTINGS_PRESETS } = loadPresets();
  const newPresetKeys = ['constellation', 'comet', 'aurora', 'fireworks', 'nebula', 'emberfall', 'sakura', 'tidal', 'voltage', 'prismRush', 'monsoon', 'deepCurrent'];

  newPresetKeys.forEach((key) => {
    assert.match(indexHtml, new RegExp(`<option value="${key}">`));
    assert.deepEqual(Object.keys(SETTINGS_PRESETS[key].settings).sort(), Object.keys(DEFAULT_CONFIG).sort());
  });
});

test('new presets keep conflicting or compounding expensive effects apart', () => {
  const { SETTINGS_PRESETS } = loadPresets();
  const { constellation, comet, aurora, fireworks, nebula, emberfall, sakura, tidal, voltage, prismRush, monsoon, deepCurrent } = SETTINGS_PRESETS;

  assert.equal(constellation.settings.shadowBlur, 0);
  assert.equal(constellation.settings.trailEnabled, false);
  assert.equal(constellation.settings.attractionForce, 0.75);
  assert.equal(comet.settings.shadowBlur, 0);
  assert.equal(comet.settings.showConnections, false);
  assert.equal(aurora.settings.trailEnabled, false);
  assert.equal(aurora.settings.showConnections, false);
  assert.equal(aurora.settings.shadowBlur, 0);
  assert.equal(fireworks.settings.explosionMode, 'spawn');
  assert.equal(fireworks.settings.explosionCount, 150);
  assert.equal(fireworks.settings.explosionSpeed, 15);
  assert.equal(fireworks.settings.showConnections, false);
  assert.equal(nebula.settings.particleCount, 130);
  assert.equal(nebula.settings.bloom, 0.3);
  assert.equal(nebula.settings.showConnections, false);
  assert.equal(nebula.settings.selfDriftMode, 'spiral');
  assert.equal(nebula.settings.particleRepulsionEnabled, false);
  assert.equal(emberfall.settings.trailEnabled, true);
  assert.equal(emberfall.settings.shadowBlur, 0);
  assert.equal(emberfall.settings.bloom, 0);
  assert.equal(emberfall.settings.showConnections, false);
  assert.equal(emberfall.settings.selfDriftMode, 'up');
  assert.equal(sakura.settings.particleShape, 'heart');
  assert.equal(sakura.settings.selfDriftMode, 'down');
  assert.equal(sakura.settings.showConnections, false);
  assert.equal(sakura.settings.trailEnabled, false);
  assert.equal(tidal.settings.backgroundColor, '#041b2d');
  assert.equal(tidal.settings.selfDriftMode, 'up');
  assert.equal(tidal.settings.showConnections, false);
  assert.equal(tidal.settings.trailEnabled, false);
  assert.equal(voltage.settings.particleShape, 'arrow');
  assert.equal(voltage.settings.velocityStretchEnabled, true);
  assert.equal(voltage.settings.selfDriftMode, 'right');
  assert.equal(voltage.settings.showConnections, false);
  assert.equal(voltage.settings.trailEnabled, false);
  assert.equal(prismRush.settings.colorPalette, 'speed');
  assert.equal(prismRush.settings.particleRepulsionEnabled, true);
  assert.equal(prismRush.settings.velocityStretchEnabled, true);
  assert.equal(prismRush.settings.particleCount, 500);
  assert.equal(prismRush.settings.particleRepulsionRadius, 95);
  assert.equal(prismRush.settings.selfDriftOrbitRadius, 10);
  assert.equal(prismRush.settings.attractionForce, 1);
  assert.equal(prismRush.settings.attractionRadius, 460);
  assert.equal(prismRush.settings.showConnections, false);
  assert.equal(monsoon.settings.particleShape, 'drop');
  assert.equal(monsoon.settings.selfDriftMode, 'down');
  assert.equal(monsoon.settings.trailEnabled, true);
  assert.equal(monsoon.settings.shadowBlur, 0);
  assert.equal(monsoon.settings.showConnections, false);
  assert.equal(deepCurrent.settings.particleShape, 'crescent');
  assert.equal(deepCurrent.settings.selfDriftMode, 'flow');
  assert.equal(deepCurrent.settings.showConnections, true);
  assert.equal(deepCurrent.settings.trailEnabled, false);
  assert.equal(deepCurrent.settings.particleRepulsionEnabled, true);
  assert.equal(deepCurrent.settings.bloom, 0.6);
  assert.equal(SETTINGS_PRESETS.bloom.settings.bloom, 0.9);
});

test('applying a preset preserves optimization settings', () => {
  const system = loadPresets();
  const { config } = system;

  config.performanceProfile = 'economy';
  config.adaptiveQualityEnabled = false;
  config.prioritizeLastChangedSetting = false;

  config.particleCount = 42;
  config.shadowBlur = 7;

  system.resetAdaptiveQualityState = () => {};
  system.syncCursorMode = () => {};
  system.createParticles = () => {};
  system.saveSettings = () => {};
  system.syncFpsIndicator = () => {};

  system.applyPreset('neon');

  assert.equal(config.performanceProfile, 'economy');
  assert.equal(config.adaptiveQualityEnabled, false);
  assert.equal(config.prioritizeLastChangedSetting, false);
  assert.equal(config.particleCount, 120);
  assert.equal(config.shadowBlur, 8);
});

test('adaptive quality flags are present in default settings and persisted scene data', () => {
  const { DEFAULT_CONFIG, SETTINGS_PRESETS } = loadPresets();

  assert.equal(DEFAULT_CONFIG.adaptiveQualityEnabled, true);
  assert.equal(DEFAULT_CONFIG.prioritizeLastChangedSetting, true);
  assert.deepEqual(Object.keys(SETTINGS_PRESETS.calm.settings).sort(), Object.keys(DEFAULT_CONFIG).sort());
  assert.equal(Object.keys(DEFAULT_CONFIG).includes('adaptiveQualityEnabled'), true);
  assert.equal(Object.keys(DEFAULT_CONFIG).includes('prioritizeLastChangedSetting'), true);
  // Настройка «Возвращать уменьшенное значение» удалена: снижения применяются
  // сразу и сохраняются в userConfig, поэтому такого ключа быть не должно.
  assert.equal(Object.keys(DEFAULT_CONFIG).includes('restoreReducedSettings'), false);
});
