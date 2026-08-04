const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const particleSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'particle.js'), 'utf8');

function loadParticleSystem(bounce) {
  const context = {
    window: {},
    performance: { now: () => 1000 },
    Date,
  };
  context.window = context;
  context.window.ParticleSystem = {
    CONSTANTS: {
      SIZE_VARIANCE: 0,
      HUE_VARIANCE: 0,
      SPEED_VARIANCE: 0,
      TAU: Math.PI * 2,
      FRICTION: 1,
      PULSATION_SPEED: 0,
      PULSATION_AMPLITUDE: 0,
      ORBIT_TANGENTIAL_FORCE: 1,
      ORBIT_RADIAL_BALANCE: 1,
    },
    config: {
      particleSize: 4,
      hue: 0,
      trailLength: 10,
      bounce,
      selfDriftEnabled: false,
      cursorInteractionEnabled: false,
      pulsate: false,
    },
    canvasBounds: { width: 100, height: 80 },
    randomBetween: () => 0,
    getParticleColor: () => '#fff',
    distance: () => 0,
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    isPointerActive: () => false,
  };

  vm.createContext(context);
  vm.runInContext(particleSource, context);
  return context.window.ParticleSystem;
}

test('wrapping a particle clears its trail to prevent a line across the canvas', () => {
  const ParticleSystem = loadParticleSystem(false);
  const particle = new ParticleSystem.Particle(99, 40);
  particle.trail = [{ x: 92, y: 40 }, { x: 99, y: 40 }];
  particle.x = 101;

  particle.handleBoundaries();

  assert.equal(particle.x, 0);
  assert.equal(particle.trail.length, 0);
});

test('bouncing a particle preserves its continuous trail', () => {
  const ParticleSystem = loadParticleSystem(true);
  const particle = new ParticleSystem.Particle(99, 40);
  particle.trail = [{ x: 92, y: 40 }, { x: 99, y: 40 }];
  particle.x = 101;

  particle.handleBoundaries();

  assert.equal(particle.x, 100);
  assert.deepEqual(particle.trail, [{ x: 92, y: 40 }, { x: 99, y: 40 }]);
});
