const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(root, 'js', 'constants.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');

function loadSystem(storage = {}) {
  const store = { ...storage };
  const context = {
    window: {
      innerWidth: 1440,
      matchMedia: () => ({ matches: false }),
      localStorage: {
        getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
      },
    },
    localStorage: {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
    },
    console: { warn: () => {} },
  };
  context.window.window = context.window;
  context.window.ParticleSystem = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    getSettingControl: () => null,
    isValidHexColor: (value) => /^#[0-9a-f]{6}$/i.test(value),
  };
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  return { context, ParticleSystem: context.window.ParticleSystem, store };
}

// Копия порядка, используемого в animation.js — здесь она нужна только для
// проверки того, что сохранённый ключ валиден и влияет на выбор кандидата.
const ADAPTIVE_QUALITY_ORDER = [
  'showConnections',
  'auroraEnabled',
  'particleCount',
  'shadowBlur',
  'trailLength',
];

function canReduceAdaptiveSetting(key, config) {
  const currentValue = config[key];
  if (key === 'particleCount') return currentValue > 80;
  if (key === 'shadowBlur') return currentValue > 0;
  if (key === 'trailLength') return currentValue > 4;
  if (key === 'showConnections') return currentValue === true;
  if (key === 'auroraEnabled') return currentValue === true;
  return false;
}

// Моделирует getAdaptiveQualityCandidate из animation.js: приоритетная настройка
// учитывается, если её ещё можно снизить, иначе — порядок списка.
function candidate(state, config) {
  const preferred = state.lastHeavySettingKey;
  if (preferred && ADAPTIVE_QUALITY_ORDER.includes(preferred) && canReduceAdaptiveSetting(preferred, config)) {
    return preferred;
  }
  return ADAPTIVE_QUALITY_ORDER.find((key) => canReduceAdaptiveSetting(key, config)) || null;
}

test('persisted priority key survives save/load and restores lastHeavySettingKey', () => {
  const { ParticleSystem, store } = loadSystem();

  // Пользователь последним менял shadowBlur -> эпизод снижения должен
  // приоритетно трогать именно его.
  ParticleSystem.adaptiveQualityState = { lastHeavySettingKey: 'shadowBlur' };
  ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;

  ParticleSystem.persistAdaptivePriorityKey();
  assert.equal(store[ParticleSystem.CONSTANTS.STORAGE_KEY_PRIORITY], 'shadowBlur');

  // Симуляция перезагрузки страницы.
  const reloaded = loadSystem(store);
  reloaded.ParticleSystem.adaptiveQualityState = {};
  reloaded.ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;
  reloaded.ParticleSystem.restoreAdaptivePriorityKey();

  assert.equal(reloaded.ParticleSystem.adaptiveQualityState.lastHeavySettingKey, 'shadowBlur');
});

test('restored priority makes the next session reduce shadowBlur instead of particleCount', () => {
  const { ParticleSystem, store } = loadSystem();

  // Настройки пользователя: particleCount=250 и shadowBlur=15, последним менялся
  // shadowBlur -> эпизод снижения должен приоритетно трогать именно его.
  ParticleSystem.userConfig.particleCount = 250;
  ParticleSystem.userConfig.shadowBlur = 15;
  ParticleSystem.adaptiveQualityState = { lastHeavySettingKey: 'shadowBlur' };
  ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;

  // Сохраняем и настройки, и приоритет в хранилище (как делает handleSettingInput).
  ParticleSystem.saveSettings();

  // Перезагрузка страницы: ADAPTIVE_QUALITY_ORDER уже определён (animation.js
  // загружен до init), приоритет и конфиг восстанавливаются из хранилища.
  const reloaded = loadSystem(store);
  reloaded.ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;
  reloaded.ParticleSystem.loadSavedSettings();

  const { config } = reloaded.ParticleSystem;
  const state = reloaded.ParticleSystem.adaptiveQualityState;

  // Без сохранённого приоритета порядок списка снизил бы particleCount раньше.
  assert.equal(candidate({ lastHeavySettingKey: null }, config), 'particleCount');

  // С восстановленным приоритетом система должна снизить shadowBlur.
  assert.equal(state.lastHeavySettingKey, 'shadowBlur');
  assert.equal(candidate(state, config), 'shadowBlur');
});

test('invalid or cleared priority key does not crash and falls back to list order', () => {
  const { ParticleSystem, store } = loadSystem();
  ParticleSystem.userConfig.particleCount = 250;
  ParticleSystem.userConfig.shadowBlur = 0;

  // Пустое хранилище: не должно быть ключа приоритета.
  ParticleSystem.adaptiveQualityState = { lastHeavySettingKey: null };
  ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;
  ParticleSystem.persistAdaptivePriorityKey();
  assert.equal(store[ParticleSystem.CONSTANTS.STORAGE_KEY_PRIORITY], undefined);

  const reloaded = loadSystem(store);
  reloaded.ParticleSystem.adaptiveQualityState = {};
  reloaded.ParticleSystem.ADAPTIVE_QUALITY_ORDER = ADAPTIVE_QUALITY_ORDER;
  reloaded.ParticleSystem.restoreAdaptivePriorityKey();
  assert.equal(reloaded.ParticleSystem.adaptiveQualityState.lastHeavySettingKey, undefined);
});

test('a reduction applied via config writes to userConfig and survives save/load', () => {
  const { ParticleSystem, store } = loadSystem();
  ParticleSystem.userConfig.shadowBlur = 15;
  ParticleSystem.config.shadowBlur = 15;

  // Имитируем существующий runtime-override (как могло остаться до рефакторинга).
  ParticleSystem.runtimeOverrides.shadowBlur = 5;

  // Система применила снижение напрямую через config — теперь именно так
  // работает applyAdaptiveQualityStep: значение сохраняется в userConfig.
  ParticleSystem.config.shadowBlur = 5;

  // Прокси очистил override и записал значение в userConfig.
  assert.equal(ParticleSystem.runtimeOverrides.shadowBlur, undefined);
  assert.equal(ParticleSystem.userConfig.shadowBlur, 5);
  assert.equal(ParticleSystem.config.shadowBlur, 5);

  ParticleSystem.saveSettings();

  // Перезагрузка страницы: сниженное значение пережило сохранение.
  const reloaded = loadSystem(store);
  reloaded.ParticleSystem.loadSavedSettings();
  assert.equal(reloaded.ParticleSystem.userConfig.shadowBlur, 5);
  assert.equal(reloaded.ParticleSystem.config.shadowBlur, 5);
});