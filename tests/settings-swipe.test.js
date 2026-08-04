const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(root, 'js', 'constants.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
const settingsSource = fs.readFileSync(path.join(root, 'js', 'settings.js'), 'utf8');

function loadSettingsWithPanel(isMobile) {
  const listeners = {};
  const panel = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
  };
  const context = {
    window: {},
    document: { getElementById: () => panel },
    localStorage: { getItem: () => null, setItem: () => {} },
  };
  context.window = context;
  context.window.ParticleSystem = {};
  context.window.matchMedia = () => ({ matches: isMobile });
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  vm.runInContext(settingsSource, context);

  return { ParticleSystem: context.window.ParticleSystem, listeners };
}

function gestureEvent(x, y, target = { closest: () => null }) {
  return {
    target,
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  };
}

test('a right swipe closes the settings panel only on touch-first devices', () => {
  const { ParticleSystem, listeners } = loadSettingsWithPanel(true);
  let closed = 0;
  ParticleSystem.closeSettings = () => { closed += 1; };
  ParticleSystem.bindSettingsSwipeToClose();

  listeners.touchstart(gestureEvent(100, 200));
  listeners.touchend(gestureEvent(180, 210));
  assert.equal(closed, 1);

  const desktop = loadSettingsWithPanel(false);
  desktop.ParticleSystem.closeSettings = () => { closed += 1; };
  desktop.ParticleSystem.bindSettingsSwipeToClose();
  desktop.listeners.touchstart(gestureEvent(100, 200));
  desktop.listeners.touchend(gestureEvent(180, 210));
  assert.equal(closed, 1);
});

test('scrolls, short swipes, and slider interactions do not close settings', () => {
  const { ParticleSystem, listeners } = loadSettingsWithPanel(true);
  let closed = 0;
  ParticleSystem.closeSettings = () => { closed += 1; };
  ParticleSystem.bindSettingsSwipeToClose();

  listeners.touchstart(gestureEvent(100, 200));
  listeners.touchend(gestureEvent(130, 350));
  listeners.touchstart(gestureEvent(100, 200));
  listeners.touchend(gestureEvent(150, 200));
  listeners.touchstart(gestureEvent(100, 200, { closest: () => ({}) }));
  listeners.touchend(gestureEvent(180, 200));

  assert.equal(closed, 0);
});
