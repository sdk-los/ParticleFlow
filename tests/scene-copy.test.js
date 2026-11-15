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

function loadSceneCopy(clipboard) {
  const status = { textContent: '' };
  const context = {
    window: {},
    document: {
      getElementById: () => status,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    navigator: { clipboard },
  };
  context.window = context;
  context.window.ParticleSystem = {};
  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(configSource, context);
  vm.runInContext(settingsSource, context);
  return { system: context.window.ParticleSystem, status };
}

test('scene JSON button copies the complete formatted configuration', async () => {
  let copiedText;
  const { system, status } = loadSceneCopy({
    writeText: async (text) => {
      copiedText = text;
    },
  });
  system.userConfig.particleCount = 42;

  await system.copySceneJson();

  assert.equal(copiedText, JSON.stringify(system.getSerializableConfig(), null, 2));
  assert.equal(JSON.parse(copiedText).particleCount, 42);
  assert.equal(status.textContent, 'JSON сцены скопирован.');
  assert.match(indexHtml, /id="copy-scene-json"/);
});

test('scene JSON copy reports clipboard failures', async () => {
  const { system, status } = loadSceneCopy({
    writeText: async () => {
      throw new Error('Clipboard unavailable');
    },
  });

  await system.copySceneJson();

  assert.equal(status.textContent, 'Не удалось скопировать JSON сцены.');
});
