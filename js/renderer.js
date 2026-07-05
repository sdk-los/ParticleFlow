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
      (point) => timestamp - point.createdAt < CONSTANTS.TRAIL_LIFETIME
    );

    ParticleSystem.pointerTrails.forEach((point) => {
      const age = timestamp - point.createdAt;
      const life = 1 - age / CONSTANTS.TRAIL_LIFETIME;
      const radius = CONSTANTS.TRAIL_POINT_SIZE * life;

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
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    ParticleSystem.canvasBounds = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    canvas.width = Math.ceil(ParticleSystem.canvasBounds.width * pixelRatio);
    canvas.height = Math.ceil(ParticleSystem.canvasBounds.height * pixelRatio);
    ParticleSystem.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };
})();