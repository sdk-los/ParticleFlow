const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pointerSource = fs.readFileSync(path.join(root, 'js', 'pointer.js'), 'utf8');
const particleSource = fs.readFileSync(path.join(root, 'js', 'particle.js'), 'utf8');
const rendererSource = fs.readFileSync(path.join(root, 'js', 'renderer.js'), 'utf8');
const constantsSource = fs.readFileSync(path.join(root, 'js', 'constants.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadPointerSystem() {
  let now = 1000;
  const context = {
    window: {},
    performance: { now: () => now },
    document: {
      getElementById: () => ({ getBoundingClientRect: () => ({ left: 0, top: 0 }) }),
    },
  };
  context.window = context;
  context.window.ParticleSystem = {
    CONSTANTS: { MOUSE_OUT_OF_BOUNDS: -1000, TRAIL_MAX_POINTS: 120 },
    config: {
      cursorInteractionEnabled: true,
      cursorMode: 'trail',
      pointerTrailMinDistance: 8,
    },
    getParticleColor: () => '#abcdef',
  };
  vm.createContext(context);
  vm.runInContext(pointerSource, context);
  return { ParticleSystem: context.window.ParticleSystem, setNow: (value) => { now = value; } };
}

test('pointer trail honours density, master cursor toggle, and point cap', () => {
  const { ParticleSystem, setNow } = loadPointerSystem();
  ParticleSystem.mouseX = 0;
  ParticleSystem.mouseY = 0;
  ParticleSystem.addPointerTrailPoint();
  ParticleSystem.mouseX = 7;
  ParticleSystem.addPointerTrailPoint();
  ParticleSystem.mouseX = 8;
  ParticleSystem.addPointerTrailPoint();

  assert.equal(ParticleSystem.pointerTrails.length, 2);
  assert.equal(ParticleSystem.pointerTrails[0].createdAt, 1000);

  ParticleSystem.config.cursorInteractionEnabled = false;
  ParticleSystem.mouseX = 20;
  ParticleSystem.addPointerTrailPoint();
  assert.equal(ParticleSystem.pointerTrails.length, 2);

  ParticleSystem.config.cursorInteractionEnabled = true;
  ParticleSystem.config.pointerTrailMinDistance = 2;
  for (let index = 0; index < 125; index += 1) {
    setNow(1001 + index);
    ParticleSystem.mouseX = 30 + index * 2;
    ParticleSystem.addPointerTrailPoint();
  }
  assert.equal(ParticleSystem.pointerTrails.length, 120);
});

test('disabling cursor interaction clears the active pointer trail', () => {
  const context = { window: {}, performance: { now: () => 0 }, Date };
  context.window = context;
  context.window.ParticleSystem = {
    CONSTANTS: {},
    config: { cursorMode: 'trail', cursorInteractionEnabled: false },
    pointerTrails: [{ x: 10, y: 10, createdAt: 0 }],
  };
  vm.createContext(context);
  vm.runInContext(particleSource, context);

  context.window.ParticleSystem.syncCursorMode();
  assert.equal(context.window.ParticleSystem.pointerTrails.length, 0);
});

test('pointer trail lifetime removes expired points and size controls rendered radius', () => {
  const arcs = [];
  const context = {
    window: { innerWidth: 100, innerHeight: 100 },
  };
  context.window.window = context.window;
  context.window.ParticleSystem = {
    CONSTANTS: { TAU: Math.PI * 2 },
    config: { pointerTrailLifetime: 700, pointerTrailSize: 20 },
    pointerTrails: [
      { x: 1, y: 2, createdAt: 100, color: '#111111' },
      { x: 3, y: 4, createdAt: 500, color: '#222222' },
    ],
    ctx: {
      save: () => {}, restore: () => {}, beginPath: () => {}, fill: () => {},
      arc: (x, y, radius) => arcs.push({ x, y, radius }),
    },
  };
  vm.createContext(context);
  vm.runInContext(rendererSource, context);
  context.window.ParticleSystem.ctx = {
    save: () => {}, restore: () => {}, beginPath: () => {}, fill: () => {},
    arc: (x, y, radius) => arcs.push({ x, y, radius }),
  };

  context.window.ParticleSystem.drawPointerTrails(1000);

  assert.equal(context.window.ParticleSystem.pointerTrails.length, 1);
  assert.deepEqual(arcs, [{ x: 3, y: 4, radius: 20 * (1 - 500 / 700) }]);
});

test('trail settings are configurable, range-normalized, and present in every preset', () => {
  let savedSettings = null;
  const controlRanges = {
    pointerTrailLifetime: { min: '150', max: '2000' },
    pointerTrailSize: { min: '6', max: '50' },
    pointerTrailMinDistance: { min: '2', max: '30' },
  };
  const context = {
    window: {},
    localStorage: {
      getItem: () => null,
      setItem: (_key, value) => { savedSettings = value; },
      removeItem: () => {},
    },
  };
  context.window = context;
  context.window.ParticleSystem = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    getSettingControl: (key) => controlRanges[key] || null,
    isValidHexColor: () => true,
  };
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  const { ParticleSystem } = context.window;

  assert.equal(ParticleSystem.readStoredSetting('pointerTrailLifetime', 50), 150);
  assert.equal(ParticleSystem.readStoredSetting('pointerTrailSize', 80), 50);
  assert.equal(ParticleSystem.readStoredSetting('pointerTrailMinDistance', 0), 2);
  ParticleSystem.config.pointerTrailLifetime = 1200;
  ParticleSystem.config.pointerTrailSize = 32;
  ParticleSystem.config.pointerTrailMinDistance = 4;
  ParticleSystem.saveSettings();
  const persistedSettings = JSON.parse(savedSettings);
  assert.equal(persistedSettings.pointerTrailLifetime, 1200);
  assert.equal(persistedSettings.pointerTrailSize, 32);
  assert.equal(persistedSettings.pointerTrailMinDistance, 4);
  Object.values(ParticleSystem.SETTINGS_PRESETS).forEach((preset) => {
    assert.deepEqual(Object.keys(preset.settings).sort(), Object.keys(ParticleSystem.DEFAULT_CONFIG).sort());
  });
  assert.match(indexHtml, /data-cursor-trail-setting/);
  assert.match(indexHtml, /data-setting="pointerTrailLifetime"/);
  assert.match(indexHtml, /data-setting="pointerTrailSize"/);
  assert.match(indexHtml, /data-setting="pointerTrailMinDistance"/);
});
