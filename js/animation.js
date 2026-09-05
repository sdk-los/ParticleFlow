/* ── Animation loop ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config } } = window;

  ParticleSystem.animationId = null;
  ParticleSystem.fpsFrameCount = 0;
  ParticleSystem.fpsLastTime = 0;
  ParticleSystem.adaptiveQualityState = {
    lowFpsStreak: 0,
    highFpsStreak: 0,
    lastAdjustmentAt: 0,
    activeAdjustments: [],
    lastStatus: '',
    lastHeavySettingKey: null,
  };

  ParticleSystem.ADAPTIVE_QUALITY_ORDER = [
    'showConnections',
    'auroraEnabled',
    'particleCount',
    'shadowBlur',
    'trailLength',
  ];

  ParticleSystem.notifyAdaptiveQualityStatus = function notifyAdaptiveQualityStatus(message) {
    if (!message) return;
    const status = document.getElementById('adaptive-quality-status');
    if (status) {
      status.textContent = message;
      status.hidden = false;
    }

    const toast = document.getElementById('adaptive-quality-toast');
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      toast.classList.add('visible');
      clearTimeout(ParticleSystem.adaptiveQualityState.toastTimeoutId);
      ParticleSystem.adaptiveQualityState.toastTimeoutId = window.setTimeout(() => {
        toast.classList.remove('visible');
        window.setTimeout(() => {
          toast.hidden = true;
        }, 260);
      }, 4200);
    }

    ParticleSystem.adaptiveQualityState.lastStatus = message;
  };

  ParticleSystem.clearAdaptiveQualityStatus = function clearAdaptiveQualityStatus() {
    const status = document.getElementById('adaptive-quality-status');
    if (status) {
      status.textContent = '';
      status.hidden = true;
    }
    const toast = document.getElementById('adaptive-quality-toast');
    if (toast) {
      toast.textContent = '';
      toast.hidden = true;
      toast.classList.remove('visible');
      clearTimeout(ParticleSystem.adaptiveQualityState.toastTimeoutId);
    }
    ParticleSystem.adaptiveQualityState.lastStatus = '';
  };

  ParticleSystem.getAdaptiveQualityPriorityKey = function getAdaptiveQualityPriorityKey() {
    if (!config.prioritizeLastChangedSetting) return null;
    const lastKey = ParticleSystem.adaptiveQualityState.lastHeavySettingKey;
    if (lastKey && ParticleSystem.ADAPTIVE_QUALITY_ORDER.includes(lastKey)) {
      return lastKey;
    }
    return null;
  };

  ParticleSystem.markHeavySettingChange = function markHeavySettingChange(key) {
    if (!key || !ParticleSystem.ADAPTIVE_QUALITY_ORDER.includes(key)) return;
    ParticleSystem.adaptiveQualityState.lastHeavySettingKey = key;
    delete ParticleSystem.runtimeOverrides[key];
    ParticleSystem.adaptiveQualityState.activeAdjustments = ParticleSystem.adaptiveQualityState.activeAdjustments.filter((item) => item !== key);
  };

  ParticleSystem.getAdaptiveQualityCandidate = function getAdaptiveQualityCandidate() {
    const preferred = ParticleSystem.getAdaptiveQualityPriorityKey();
    if (preferred) return preferred;
    return ParticleSystem.ADAPTIVE_QUALITY_ORDER.find((key) => {
      const currentValue = config[key];
      if (key === 'particleCount') return currentValue > 80;
      if (key === 'shadowBlur') return currentValue > 0;
      if (key === 'trailLength') return currentValue > 4;
      if (key === 'showConnections') return currentValue === true;
      if (key === 'auroraEnabled') return currentValue === true;
      return false;
    }) || null;
  };

  ParticleSystem.getAdaptiveQualityRestoreCandidate = function getAdaptiveQualityRestoreCandidate() {
    if (!config.restoreReducedSettings) return null;
    return [...ParticleSystem.ADAPTIVE_QUALITY_ORDER].reverse().find((key) => {
      return Object.prototype.hasOwnProperty.call(ParticleSystem.runtimeOverrides, key);
    }) || null;
  };

  ParticleSystem.applyAdaptiveQualityStep = function applyAdaptiveQualityStep(direction) {
    if (!config.adaptiveQualityEnabled) return false;

    const key = direction === 'degrade'
      ? ParticleSystem.getAdaptiveQualityCandidate()
      : ParticleSystem.getAdaptiveQualityRestoreCandidate();
    if (!key) return false;

    const state = ParticleSystem.adaptiveQualityState;
    if (direction === 'degrade') {
      const currentValue = config[key];
      let nextValue = currentValue;

      if (key === 'showConnections') nextValue = false;
      else if (key === 'auroraEnabled') nextValue = false;
      else if (key === 'particleCount') nextValue = Math.max(80, Math.round(currentValue * 0.75));
      else if (key === 'shadowBlur') nextValue = Math.max(0, currentValue - 10);
      else if (key === 'trailLength') nextValue = Math.max(4, currentValue - 4);

      if (nextValue === currentValue) return false;

      ParticleSystem.runtimeOverrides[key] = nextValue;
      if (key === 'particleCount') {
        ParticleSystem.createParticles();
      }
      if (key === 'shadowBlur') {
        ParticleSystem.updateParticleShadowBlur();
      }
      if (key === 'trailLength') {
        ParticleSystem.particles.forEach((particle) => {
          particle.maxTrailLength = config.trailLength;
        });
      }

      state.activeAdjustments = [...new Set([...state.activeAdjustments, key])];
      state.lastAdjustmentAt = performance.now();
      ParticleSystem.notifyAdaptiveQualityStatus(`Оптимизация: уменьшено ${key}.`);
      return true;
    }

    delete ParticleSystem.runtimeOverrides[key];
    if (key === 'particleCount') {
      ParticleSystem.createParticles();
    }
    if (key === 'shadowBlur') {
      ParticleSystem.updateParticleShadowBlur();
    }
    if (key === 'trailLength') {
      ParticleSystem.particles.forEach((particle) => {
        particle.maxTrailLength = config.trailLength;
      });
    }

    state.activeAdjustments = state.activeAdjustments.filter((item) => item !== key);
    state.lastAdjustmentAt = performance.now();
    ParticleSystem.notifyAdaptiveQualityStatus(`Оптимизация: восстановлено ${key}.`);
    return true;
  };

  ParticleSystem.trackAdaptiveQualityFps = function trackAdaptiveQualityFps(fps) {
    if (!config.adaptiveQualityEnabled) {
      ParticleSystem.clearAdaptiveQualityStatus();
      state.lowFpsStreak = 0;
      state.highFpsStreak = 0;
      return;
    }

    const state = ParticleSystem.adaptiveQualityState;
    if (fps < 30) {
      state.lowFpsStreak += 1;
      state.highFpsStreak = 0;
    } else {
      state.lowFpsStreak = 0;
      if (fps >= 50) state.highFpsStreak += 1;
      else state.highFpsStreak = 0;
    }

    const now = performance.now();
    const cooldownPassed = now - state.lastAdjustmentAt > 1500;

    if (state.lowFpsStreak >= 3 && cooldownPassed) {
      const degraded = ParticleSystem.applyAdaptiveQualityStep('degrade');
      if (degraded) {
        state.lowFpsStreak = 0;
        state.highFpsStreak = 0;
      }
    }

    if (config.restoreReducedSettings && state.highFpsStreak >= 10 && state.activeAdjustments.length > 0 && cooldownPassed) {
      const restored = ParticleSystem.applyAdaptiveQualityStep('restore');
      if (restored) {
        state.highFpsStreak = 0;
      }
    }

    if (!config.restoreReducedSettings && state.highFpsStreak >= 10 && state.activeAdjustments.length > 0 && cooldownPassed) {
      state.activeAdjustments = [];
      ParticleSystem.clearRuntimeOverrides();
      ParticleSystem.notifyAdaptiveQualityStatus('Оптимизация: сниженные параметры сохранены.');
      state.highFpsStreak = 0;
    }
  };

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
    const fpsIndicator = document.getElementById('fps-indicator');

    if (!ParticleSystem.fpsLastTime) {
      ParticleSystem.fpsLastTime = timestamp;
      ParticleSystem.fpsFrameCount = 0;
      return;
    }

    ParticleSystem.fpsFrameCount += 1;
    const elapsed = timestamp - ParticleSystem.fpsLastTime;
    if (elapsed < CONSTANTS.FPS_UPDATE_INTERVAL) return;

    const fps = Math.round((ParticleSystem.fpsFrameCount * 1000) / elapsed);
    if (fpsIndicator) {
      fpsIndicator.textContent = `FPS: ${fps}`;
      fpsIndicator.hidden = !config.showFps;
    }
    ParticleSystem.trackAdaptiveQualityFps(fps);
    ParticleSystem.fpsFrameCount = 0;
    ParticleSystem.fpsLastTime = timestamp;
  };

  ParticleSystem.resetFpsCounter = function resetFpsCounter() {
    ParticleSystem.fpsFrameCount = 0;
    ParticleSystem.fpsLastTime = 0;
    const fpsIndicator = document.getElementById('fps-indicator');
    if (fpsIndicator) fpsIndicator.textContent = 'FPS: 0';
  };

  ParticleSystem.resetAdaptiveQualityState = function resetAdaptiveQualityState() {
    ParticleSystem.adaptiveQualityState = {
      lowFpsStreak: 0,
      highFpsStreak: 0,
      lastAdjustmentAt: 0,
      activeAdjustments: [],
      lastStatus: '',
      lastHeavySettingKey: null,
    };
    ParticleSystem.clearAdaptiveQualityStatus();
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