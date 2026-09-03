/* ── Renderer ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config } } = window;

  ParticleSystem.ctx = null;
  ParticleSystem.canvasBounds = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  ParticleSystem.cachedGradient = null;
  ParticleSystem.lastGradientConfig = {};

  ParticleSystem.renderBackground = function renderBackground() {
    const ctx = ParticleSystem.ctx;
    ctx.clearRect(0, 0, ParticleSystem.canvasBounds.width, ParticleSystem.canvasBounds.height);

    if (config.backgroundMode === 'transparent') return;

    if (config.backgroundMode === 'gradient') {
      // Кешируем градиент, пересчитываем только при смене конфига
      const needsUpdate = 
        !ParticleSystem.cachedGradient ||
        ParticleSystem.lastGradientConfig.backgroundColor !== config.backgroundColor ||
        ParticleSystem.lastGradientConfig.accentColor !== ParticleSystem.getBackgroundAccentColor();
      
      if (needsUpdate) {
        ParticleSystem.cachedGradient = ctx.createLinearGradient(0, 0, ParticleSystem.canvasBounds.width, ParticleSystem.canvasBounds.height);
        ParticleSystem.cachedGradient.addColorStop(0, config.backgroundColor);
        ParticleSystem.cachedGradient.addColorStop(1, ParticleSystem.getBackgroundAccentColor());
        ParticleSystem.lastGradientConfig = {
          backgroundColor: config.backgroundColor,
          accentColor: ParticleSystem.getBackgroundAccentColor()
        };
      }
      ctx.fillStyle = ParticleSystem.cachedGradient;
    } else {
      ctx.fillStyle = config.backgroundColor;
    }

    ctx.fillRect(0, 0, ParticleSystem.canvasBounds.width, ParticleSystem.canvasBounds.height);
  };

  ParticleSystem.drawAurora = function drawAurora(timestamp) {
    if (!config.auroraEnabled) return;

    const ctx = ParticleSystem.ctx;
    const width = ParticleSystem.canvasBounds.width;
    const height = ParticleSystem.canvasBounds.height;
    if (!width || !height) return;

    const time = timestamp * 0.00035 * config.auroraSpeed;
    const bandCount = 6;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const baseHue = (config.hue + 55) % 360;
    const alphaBase = 0.04 + config.auroraIntensity * 0.16;

    for (let i = 0; i <= bandCount; i++) {
      const stop = i / bandCount;
      const phase = time + i * 0.8;
      const hue = (baseHue + Math.sin(phase) * 45 + i * 18) % 360;
      const bandAlpha = alphaBase + Math.sin(phase * 1.2 + i) * 0.02;
      gradient.addColorStop(
        stop,
        `hsla(${Math.round(hue)}, 85%, 60%, ${Math.max(0.03, bandAlpha)})`
      );
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  ParticleSystem.drawConnections = function drawConnections() {
    if (!config.showConnections) return;

    const ctx = ParticleSystem.ctx;
    const maxDist = config.connectionDistance;
    const maxDistSq = maxDist * maxDist;
    const lineWidth = config.connectionWidth;
    const maxOpacity = config.connectionOpacity;

    /* Пространственная сетка: разбиваем канвас на ячейки размером maxDist */
    const cols = Math.ceil(ParticleSystem.canvasBounds.width / maxDist) || 1;
    const rows = Math.ceil(ParticleSystem.canvasBounds.height / maxDist) || 1;
    const grid = new Array(cols * rows);

    for (let i = 0; i < ParticleSystem.particles.length; i++) {
      const p = ParticleSystem.particles[i];
      p._gridId = i;
      const col = Math.min(Math.floor(p.x / maxDist), cols - 1);
      const row = Math.min(Math.floor(p.y / maxDist), rows - 1);
      const idx = row * cols + col;
      if (!grid[idx]) grid[idx] = [];
      grid[idx].push(p);
    }

    /* Собираем все линии в один path для batch-отрисовки */
    let connectionCount = 0;
    ctx.beginPath();

    for (let i = 0; i < ParticleSystem.particles.length; i++) {
      const p = ParticleSystem.particles[i];
      const col = Math.min(Math.floor(p.x / maxDist), cols - 1);
      const row = Math.min(Math.floor(p.y / maxDist), rows - 1);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

          const cell = grid[nr * cols + nc];
          if (!cell) continue;

          for (let k = 0; k < cell.length; k++) {
            const neighbor = cell[k];
            if (neighbor._gridId <= p._gridId) continue;

            const dx = neighbor.x - p.x;
            const dy = neighbor.y - p.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(neighbor.x, neighbor.y);
              connectionCount++;
            }
          }
        }
      }
    }

    if (connectionCount > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${maxOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  };

  ParticleSystem.drawPointerTrails = function drawPointerTrails(timestamp) {
    if (ParticleSystem.pointerTrails.length === 0) return;

    const ctx = ParticleSystem.ctx;

    ParticleSystem.pointerTrails = ParticleSystem.pointerTrails.filter(
      (point) => timestamp - point.createdAt < config.pointerTrailLifetime
    );

    ParticleSystem.pointerTrails.forEach((point) => {
      const age = timestamp - point.createdAt;
      const life = 1 - age / config.pointerTrailLifetime;
      const radius = config.pointerTrailSize * life;

      ctx.save();
      ctx.globalAlpha = Math.max(0, life * 0.55);
      ctx.fillStyle = point.color;
      ctx.shadowColor = point.color;
      ctx.shadowBlur = config.shadowBlur + 12;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, CONSTANTS.TAU);
      ctx.fill();
      ctx.restore();
    });
  };

  ParticleSystem.resizeCanvas = function resizeCanvas() {
    const canvas = document.getElementById('particle-canvas');
    const maxPixelRatio = ParticleSystem.getPerformanceLimits
      ? ParticleSystem.getPerformanceLimits().pixelRatio
      : Infinity;
    const pixelRatio = Math.min(Math.max(1, window.devicePixelRatio || 1), maxPixelRatio);
    ParticleSystem.canvasBounds = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    canvas.width = Math.ceil(ParticleSystem.canvasBounds.width * pixelRatio);
    canvas.height = Math.ceil(ParticleSystem.canvasBounds.height * pixelRatio);
    ParticleSystem.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };
})();
