const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(root, 'js', 'constants.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadPresets() {
  const context = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
  context.window = context;
  context.window.ParticleSystem = {};
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  return context.window.ParticleSystem;
}

test('new presets are selectable and reset all configuration keys', () => {
  const { DEFAULT_CONFIG, SETTINGS_PRESETS } = loadPresets();
  const newPresetKeys = ['constellation', 'comet', 'aurora', 'fireworks'];

  newPresetKeys.forEach((key) => {
    assert.match(indexHtml, new RegExp(`<option value="${key}">`));
    assert.deepEqual(Object.keys(SETTINGS_PRESETS[key].settings).sort(), Object.keys(DEFAULT_CONFIG).sort());
  });
});

test('new presets keep conflicting or compounding expensive effects apart', () => {
  const { SETTINGS_PRESETS } = loadPresets();
  const { constellation, comet, aurora, fireworks } = SETTINGS_PRESETS;

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
