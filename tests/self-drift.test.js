const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const vm = require('node:vm');
const fs = require('node:fs');

const utilsPath = path.join(__dirname, '..', 'js', 'utils.js');
const utilsSource = fs.readFileSync(utilsPath, 'utf8');

function loadUtils() {
  const context = {
    window: {},
    performance: { now: () => 1000 },
    console,
  };

  context.window = context;
  context.window.ParticleSystem = {};
  context.window.ParticleSystem.CONSTANTS = {
    HSL_SATURATION: '100%',
    HSL_LIGHTNESS: '50%',
    HEX_COLOR_PATTERN: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
    PALETTE_HUE_VARIANCE: 20,
    HUE_VARIANCE: 20,
    TAU: Math.PI * 2,
  };
  context.window.ParticleSystem.config = { selfDriftMode: 'spiral' };
  context.window.ParticleSystem.COLOR_PALETTES = {
    mono: { hues: [120] },
  };

  vm.createContext(context);
  vm.runInContext(utilsSource, context);
  return context.window.ParticleSystem;
}

test('spiral self-drift is corrected toward a shared spiral target', () => {
  const ParticleSystem = loadUtils();
  ParticleSystem.canvasBounds = { width: 500, height: 400 };

  const particle = {
    x: 250,
    y: 200,
    vx: 0,
    vy: 0,
    driftPhase: 0.35,
    size: 4,
  };

  const intensity = 0.08;
  const speed = 0.5;
  const time = 1000;
  const driftStrength = intensity * (0.3 + (particle.size || 0) * 0.04);
  const timeAngle = (time * 0.001 * speed) + particle.driftPhase + particle.y * 0.001;
  const spiralAngle = (timeAngle * 0.35) + particle.driftPhase;
  const baseRadius = Math.max(driftStrength * (2.5 + (particle.size || 0) * 0.12), 16);
  const spiralRadius = baseRadius * (0.45 + 0.55 * Math.abs(Math.sin(spiralAngle * 0.6)));
  const cx = ParticleSystem.canvasBounds.width / 2;
  const cy = ParticleSystem.canvasBounds.height / 2;
  const targetX = cx + Math.cos(spiralAngle) * spiralRadius;
  const targetY = cy + Math.sin(spiralAngle) * spiralRadius;

  particle.x = targetX;
  particle.y = targetY;

  const drift = ParticleSystem.calculateSelfDrift(particle, time, intensity, speed);

  assert.ok(Math.abs(drift.vx) <= 0.01);
  assert.ok(Math.abs(drift.vy) <= 0.02);
});

test('spiralIndividual self-drift uses a particle-local spiral path', () => {
  const ParticleSystem = loadUtils();
  const particle = {
    x: 120,
    y: 90,
    anchorX: 120,
    anchorY: 90,
    vx: 0,
    vy: 0,
    driftPhase: 0.25,
    size: 3,
  };

  const intensity = 0.08;
  const speed = 0.5;
  const time = 1000;
  const driftStrength = intensity * (0.3 + (particle.size || 0) * 0.04);
  const timeAngle = (time * 0.001 * speed) + particle.driftPhase + particle.y * 0.001;
  const spiralAngle = (timeAngle * 0.35) + particle.driftPhase;
  const spiralRadius = Math.max(driftStrength * (0.8 + (particle.size || 0) * 0.18), 8);
  const targetX = particle.anchorX + Math.cos(spiralAngle) * spiralRadius;
  const targetY = particle.anchorY + Math.sin(spiralAngle) * spiralRadius;
  const drift = ParticleSystem.calculateSelfDrift(particle, time, intensity, speed);

  assert.ok(Math.abs(drift.vx) > 0.01);
  assert.ok(Math.abs(drift.vy) > 0.01);
  assert.ok(Math.abs(drift.vx) < 1);
  assert.ok(Math.abs(drift.vy) < 1);
});

test('orbitGlobal self-drift can push nearby particles apart when repulsion is enabled', () => {
  const ParticleSystem = loadUtils();
  ParticleSystem.config.selfDriftMode = 'orbitGlobal';
  ParticleSystem.config.selfDriftOrbitRepulsionEnabled = true;
  ParticleSystem.config.selfDriftOrbitRepulsionStrength = 0.6;
  ParticleSystem.canvasBounds = { width: 500, height: 400 };
  ParticleSystem.particles = [];

  const intensity = 0.08;
  const speed = 0.5;
  const time = 1000;
  const driftStrength = intensity * (0.3 + 4 * 0.04);
  const timeAngle = (time * 0.001 * speed) + 0.35 + 200 * 0.001;
  const orbitRadius = Math.min(250, 200) * 0.45;
  const orbitAngle = timeAngle * 0.6 + 0.35;
  const targetX = 250 + Math.cos(orbitAngle) * orbitRadius;
  const targetY = 200 + Math.sin(orbitAngle) * orbitRadius;

  const particle = { x: targetX, y: targetY, vx: 0, vy: 0, driftPhase: 0.35, size: 4 };
  const neighbor = { x: targetX + 2, y: targetY + 2, vx: 0, vy: 0, driftPhase: 0.4, size: 4 };
  ParticleSystem.particles = [particle, neighbor];

  const drift = ParticleSystem.calculateSelfDrift(particle, time, intensity, speed);

  assert.ok(Math.abs(drift.vx) > 0.0001 || Math.abs(drift.vy) > 0.0001);
});

test('snake self-drift returns numeric vx/vy', () => {
  const ParticleSystem = loadUtils();
  ParticleSystem.config.selfDriftMode = 'snake';
  ParticleSystem.canvasBounds = { width: 400, height: 300 };

  const particle = { x: 200, y: 150, vx: 0, vy: 0, size: 3, driftPhase: 0.12 };
  const intensity = 0.08;
  const speed = 0.5;
  const time = 1000;

  const drift = ParticleSystem.calculateSelfDrift(particle, time, intensity, speed);
  assert.strictEqual(typeof drift.vx, 'number');
  assert.strictEqual(typeof drift.vy, 'number');
});

test('snake drift changes with time', () => {
  const ParticleSystem = loadUtils();
  ParticleSystem.config.selfDriftMode = 'snake';
  ParticleSystem.canvasBounds = { width: 400, height: 300 };

  const particle = { x: 100, y: 80, vx: 0, vy: 0, size: 2, driftPhase: 0.2 };
  const intensity = 0.08;
  const speed = 0.5;

  const a = ParticleSystem.calculateSelfDrift(particle, 1000, intensity, speed);
  const b = ParticleSystem.calculateSelfDrift(particle, 2000, intensity, speed);

  assert.ok(a.vx !== b.vx || a.vy !== b.vy);
});

test('cardinal self-drift modes apply a constant force in the selected direction', () => {
  const ParticleSystem = loadUtils();
  const particle = { x: 120, y: 90, size: 3, driftPhase: 0.25 };
  const intensity = 0.08;
  const driftStrength = intensity * (0.3 + particle.size * 0.04);

  const expectedDrifts = {
    up: { vx: 0, vy: -driftStrength },
    down: { vx: 0, vy: driftStrength },
    left: { vx: -driftStrength, vy: 0 },
    right: { vx: driftStrength, vy: 0 },
  };

  Object.entries(expectedDrifts).forEach(([mode, expected]) => {
    ParticleSystem.config.selfDriftMode = mode;
    const drift = ParticleSystem.calculateSelfDrift(particle, 1000, intensity, 0.5);
    assert.equal(drift.vx, expected.vx, mode);
    assert.equal(drift.vy, expected.vy, mode);
  });
});
