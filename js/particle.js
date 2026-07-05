/* ── Particle class and lifecycle ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config } } = window;

  ParticleSystem.particles = [];

  class Particle {
    constructor(x, y) {
      const { SIZE_VARIANCE, HUE_VARIANCE, SPEED_VARIANCE } = CONSTANTS;
      this.x = x;
      this.y = y;
      this.size = config.particleSize + ParticleSystem.randomBetween(-SIZE_VARIANCE, SIZE_VARIANCE);
      this.baseSize = this.size;
      this.hue = config.hue + ParticleSystem.randomBetween(-HUE_VARIANCE, HUE_VARIANCE);
      this.color = ParticleSystem.getParticleColor();
      this.shadowBlur = config.shadowBlur;
      this.vx = ParticleSystem.randomBetween(-SPEED_VARIANCE, SPEED_VARIANCE) * config.speedMultiplier;
      this.vy = ParticleSystem.randomBetween(-SPEED_VARIANCE, SPEED_VARIANCE) * config.speedMultiplier;
    }

    draw() {
      const ctx = ParticleSystem.ctx;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.shadowBlur;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.abs(this.size), 0, CONSTANTS.TAU);
      ctx.fill();
    }

    applyCursorInteraction() {
      if (config.cursorMode === 'trail' || !ParticleSystem.isPointerActive()) return;

      const dist = ParticleSystem.distance(this.x, this.y, ParticleSystem.mouseX, ParticleSystem.mouseY);
      if (dist >= config.attractionRadius || dist === 0) return;

      const force =
        ((config.attractionRadius - dist) / config.attractionRadius) *
        config.attractionForce;
      const dx = ParticleSystem.mouseX - this.x;
      const dy = ParticleSystem.mouseY - this.y;
      const nx = dx / dist;
      const ny = dy / dist;

      if (config.cursorMode === 'repel') {
        this.vx -= nx * force;
        this.vy -= ny * force;
        return;
      }

      if (config.cursorMode === 'orbit') {
        const tangentForce = force * CONSTANTS.ORBIT_TANGENTIAL_FORCE;
        const radialForce = force * CONSTANTS.ORBIT_RADIAL_BALANCE;
        this.vx += -ny * tangentForce + nx * radialForce;
        this.vy += nx * tangentForce + ny * radialForce;
        return;
      }

      this.vx += nx * force;
      this.vy += ny * force;
    }

    applyFriction() {
      this.vx *= CONSTANTS.FRICTION;
      this.vy *= CONSTANTS.FRICTION;
    }

    handleBoundaries() {
      const canvasBounds = ParticleSystem.canvasBounds;
      if (config.bounce) {
        if (this.x < 0 || this.x > canvasBounds.width) {
          this.vx *= -1;
          this.x = ParticleSystem.clamp(this.x, 0, canvasBounds.width);
        }
        if (this.y < 0 || this.y > canvasBounds.height) {
          this.vy *= -1;
          this.y = ParticleSystem.clamp(this.y, 0, canvasBounds.height);
        }
      } else {
        if (this.x < 0) this.x = canvasBounds.width;
        else if (this.x > canvasBounds.width) this.x = 0;
        if (this.y < 0) this.y = canvasBounds.height;
        else if (this.y > canvasBounds.height) this.y = 0;
      }
    }

    updateSize() {
      this.size = config.pulsate
        ? this.baseSize +
          Math.sin(Date.now() * CONSTANTS.PULSATION_SPEED + this.x + this.y) *
            CONSTANTS.PULSATION_AMPLITUDE
        : this.baseSize;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.applyCursorInteraction();
      this.applyFriction();
      this.handleBoundaries();
      this.updateSize();
    }
  }

  ParticleSystem.Particle = Particle;

  /* ── Particle lifecycle ── */

  ParticleSystem.createParticles = function createParticles() {
    const count = Math.min(
      config.particleCount,
      Math.floor(ParticleSystem.canvasBounds.width / CONSTANTS.DENSITY_DIVISOR)
    );
    ParticleSystem.particles = Array.from({ length: count }, () => {
      const x = Math.random() * ParticleSystem.canvasBounds.width;
      const y = Math.random() * ParticleSystem.canvasBounds.height;
      return new Particle(x, y);
    });
  };

  ParticleSystem.updateParticleSpeed = function updateParticleSpeed() {
    const speed = config.speedMultiplier;
    ParticleSystem.particles.forEach((p) => {
      const angle = Math.atan2(p.vy, p.vx);
      const mag = ParticleSystem.distance(0, 0, p.vx, p.vy);
      if (mag > 0) {
        const baseMag = mag / speed;
        p.vx = Math.cos(angle) * baseMag * speed;
        p.vy = Math.sin(angle) * baseMag * speed;
      }
    });
  };

  ParticleSystem.updateParticleSizes = function updateParticleSizes() {
    const { SIZE_VARIANCE } = CONSTANTS;
    ParticleSystem.particles.forEach((p) => {
      p.baseSize = config.particleSize + ParticleSystem.randomBetween(-SIZE_VARIANCE, SIZE_VARIANCE);
    });
  };

  ParticleSystem.updateParticleHues = function updateParticleHues() {
    const { HUE_VARIANCE } = CONSTANTS;
    ParticleSystem.particles.forEach((p) => {
      p.hue = config.hue + ParticleSystem.randomBetween(-HUE_VARIANCE, HUE_VARIANCE);
      p.color = ParticleSystem.getParticleColor();
    });
  };

  ParticleSystem.updateParticleColors = function updateParticleColors() {
    ParticleSystem.particles.forEach((p) => {
      p.color = ParticleSystem.getParticleColor();
    });
  };

  ParticleSystem.updateParticleShadowBlur = function updateParticleShadowBlur() {
    ParticleSystem.particles.forEach((p) => {
      p.shadowBlur = config.shadowBlur;
    });
  };

  ParticleSystem.syncCursorMode = function syncCursorMode() {
    if (config.cursorMode !== 'trail') ParticleSystem.pointerTrails = [];
  };
})();