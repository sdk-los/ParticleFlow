/* ── Initialization ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config } } = window;

  /* ── Event listeners ── */
  ParticleSystem.setupCanvasMouseTracking = function setupCanvasMouseTracking() {
    const canvas = document.getElementById('particle-canvas');
    canvas.addEventListener('mousemove', (e) => {
      ParticleSystem.updatePointerPosition(e.clientX, e.clientY);
    });

    canvas.addEventListener('mouseleave', ParticleSystem.resetPointerPosition);
  };

  ParticleSystem.setupCanvasTouchTracking = function setupCanvasTouchTracking() {
    const canvas = document.getElementById('particle-canvas');

    canvas.addEventListener(
      'touchstart',
      (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        ParticleSystem.updatePointerPosition(touch.clientX, touch.clientY);
        ParticleSystem.createExplosion(
          touch.clientX - canvas.getBoundingClientRect().left,
          touch.clientY - canvas.getBoundingClientRect().top
        );
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        ParticleSystem.updatePointerPosition(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    canvas.addEventListener('touchend', ParticleSystem.resetPointerPosition);
    canvas.addEventListener('touchcancel', ParticleSystem.resetPointerPosition);
  };

  ParticleSystem.setupWindowResize = function setupWindowResize() {
    window.addEventListener('resize', () => {
      ParticleSystem.resizeCanvas();
      ParticleSystem.createParticles();
    });
  };

  ParticleSystem.setupVisibilityHandling = function setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        ParticleSystem.stopAnimation();
      } else {
        ParticleSystem.startAnimation();
      }
    });
  };

  ParticleSystem.setupPanelEventListeners = function setupPanelEventListeners() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsClose = document.getElementById('settings-close');
    const settingsReset = document.getElementById('settings-reset');
    const settingsOverlay = document.getElementById('settings-overlay');

    settingsToggle.addEventListener('click', ParticleSystem.openSettings);
    settingsClose.addEventListener('click', ParticleSystem.closeSettings);
    settingsReset.addEventListener('click', ParticleSystem.resetSettings);
    settingsOverlay.addEventListener('click', ParticleSystem.closeSettings);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') ParticleSystem.closeSettings();
    });
  };

  ParticleSystem.setupCanvasClickExplosion = function setupCanvasClickExplosion() {
    const canvas = document.getElementById('particle-canvas');

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ParticleSystem.createExplosion(x, y);
    });
  };

  /* ── Init ── */
  ParticleSystem.init = function init() {
    const canvas = document.getElementById('particle-canvas');
    ParticleSystem.ctx = canvas.getContext('2d');

    ParticleSystem.loadSavedSettings();
    ParticleSystem.syncControlsFromConfig();
    ParticleSystem.resizeCanvas();
    ParticleSystem.createParticles();
    ParticleSystem.stopAnimation();
    ParticleSystem.startAnimation();
    ParticleSystem.bindSettings();
    ParticleSystem.setupCanvasMouseTracking();
    ParticleSystem.setupCanvasTouchTracking();
    ParticleSystem.setupCanvasClickExplosion();
    ParticleSystem.setupWindowResize();
    ParticleSystem.setupVisibilityHandling();
    ParticleSystem.setupPanelEventListeners();
  };

  ParticleSystem.init();
})();