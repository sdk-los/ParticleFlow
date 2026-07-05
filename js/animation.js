/* ── Animation loop ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config } } = window;

  ParticleSystem.animationId = null;
  ParticleSystem.fpsFrameCount = 0;
  ParticleSystem.fpsLastTime = 0;

  ParticleSystem.animate = function animate(timestamp) {
    ParticleSystem.renderBackground();
    ParticleSystem.drawAurora(timestamp);
    ParticleSystem.drawPointerTrails(timestamp);
    ParticleSystem.drawConnections();
    ParticleSystem.particles.forEach((p) => {
      p.update();
      p.draw();
    });
    /* ── Взрывы по клику ── */
    ParticleSystem.explosionParticles = ParticleSystem.explosionParticles.filter((p) => p.update());
    ParticleSystem.explosionParticles.forEach((p) => p.draw());
    ParticleSystem.updateFpsIndicator(timestamp);
    ParticleSystem.updateParticleCountIndicator();
    ParticleSystem.animationId = requestAnimationFrame(ParticleSystem.animate);
  };

  ParticleSystem.startAnimation = function startAnimation() {
    if (ParticleSystem.animationId || document.hidden) return;
    ParticleSystem.resetFpsCounter();
    ParticleSystem.animationId = requestAnimationFrame(ParticleSystem.animate);
  };

  ParticleSystem.stopAnimation = function stopAnimation() {
    if (!ParticleSystem.animationId) return;
    cancelAnimationFrame(ParticleSystem.animationId);
    ParticleSystem.animationId = null;
    ParticleSystem.resetFpsCounter();
  };

  ParticleSystem.updateFpsIndicator = function updateFpsIndicator(timestamp) {
    if (!config.showFps) return;

    const fpsIndicator = document.getElementById('fps-indicator');
    if (!fpsIndicator) return;

    if (!ParticleSystem.fpsLastTime) {
      ParticleSystem.fpsLastTime = timestamp;
      ParticleSystem.fpsFrameCount = 0;
      return;
    }

    ParticleSystem.fpsFrameCount += 1;
    const elapsed = timestamp - ParticleSystem.fpsLastTime;
    if (elapsed < CONSTANTS.FPS_UPDATE_INTERVAL) return;

    const fps = Math.round((ParticleSystem.fpsFrameCount * 1000) / elapsed);
    fpsIndicator.textContent = `FPS: ${fps}`;
    ParticleSystem.fpsFrameCount = 0;
    ParticleSystem.fpsLastTime = timestamp;
  };

  ParticleSystem.resetFpsCounter = function resetFpsCounter() {
    ParticleSystem.fpsFrameCount = 0;
    ParticleSystem.fpsLastTime = 0;
    const fpsIndicator = document.getElementById('fps-indicator');
    if (fpsIndicator) fpsIndicator.textContent = 'FPS: 0';
  };

  ParticleSystem.updateParticleCountIndicator = function updateParticleCountIndicator() {
    const countIndicator = document.getElementById('particle-count-indicator');
    if (!countIndicator) return;

    const totalCount = ParticleSystem.particles.length + (ParticleSystem.explosionParticles?.length || 0);
    countIndicator.textContent = `Particles: ${totalCount}`;
    countIndicator.hidden = !config.showParticleCount;
  };

  ParticleSystem.syncParticleCountIndicator = function syncParticleCountIndicator() {
    const countIndicator = document.getElementById('particle-count-indicator');

    if (countIndicator) {
      countIndicator.hidden = !config.showParticleCount;
      const totalCount = ParticleSystem.particles.length + (ParticleSystem.explosionParticles?.length || 0);
      countIndicator.textContent = `Particles: ${totalCount}`;
    }
  };

  ParticleSystem.syncFpsIndicator = function syncFpsIndicator() {
    const fpsIndicator = document.getElementById('fps-indicator');
    if (!fpsIndicator) return;
    fpsIndicator.hidden = !config.showFps;
    ParticleSystem.resetFpsCounter();
    ParticleSystem.syncParticleCountIndicator();
  };
})();