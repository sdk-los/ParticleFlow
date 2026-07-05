(function initParticleSystem() {
      /* ── DOM references ── */
      const canvas = document.getElementById('particle-canvas');
      const ctx = canvas.getContext('2d');
      const settingsPanel = document.getElementById('settings-panel');
      const settingsOverlay = document.getElementById('settings-overlay');
      const settingsToggle = document.getElementById('settings-toggle');
      const settingsClose = document.getElementById('settings-close');
      const settingsReset = document.getElementById('settings-reset');
      const fpsIndicator = document.getElementById('fps-indicator');

      /* ── State ── */
      let particles = [];
      let animationId = null;
      let mouseX = -1000;
      let mouseY = -1000;
      let pointerTrails = [];
      let canvasBounds = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      let fpsFrameCount = 0;
      let fpsLastTime = 0;

      /* ── Constants ── */
      const CONSTANTS = Object.freeze({
        MOUSE_OUT_OF_BOUNDS: -1000,
        FRICTION: 0.98,
        PULSATION_SPEED: 0.002,
        PULSATION_AMPLITUDE: 0.5,
        SIZE_VARIANCE: 2,
        HUE_VARIANCE: 30,
        SPEED_VARIANCE: 1.5,
        DENSITY_DIVISOR: 5,
        TAU: 2 * Math.PI,
        CSS_OPEN_CLASS: 'open',
        CSS_VISIBLE_CLASS: 'visible',
        ATTR_SETTING: 'data-setting',
        ATTR_DISPLAY: 'data-display',
        ATTR_PRESET: 'data-preset',
        STORAGE_KEY: 'particleSystemSettings',
        SELECTOR_TOGGLE_LABEL: '.toggle-label',
        SELECTOR_CONTROL_GROUP: '.control-group',
        HSL_SATURATION: '100%',
        HSL_LIGHTNESS: '50%',
        PALETTE_HUE_VARIANCE: 10,
        HEX_COLOR_PATTERN: /^#[0-9a-f]{6}$/i,
        FPS_UPDATE_INTERVAL: 500,
        TRAIL_LIFETIME: 700,
        TRAIL_MAX_POINTS: 42,
        TRAIL_POINT_SIZE: 26,
        TRAIL_MIN_DISTANCE: 8,
        ORBIT_TANGENTIAL_FORCE: 0.85,
        ORBIT_RADIAL_BALANCE: 0.2,
      });

      const COLOR_PALETTES = Object.freeze({
        mono: { label: 'Монохромная', hues: [] },
        cool: { label: 'Холодная', hues: [185, 205, 225, 255] },
        warm: { label: 'Тёплая', hues: [18, 34, 48, 358] },
        neon: { label: 'Неоновая', hues: [130, 185, 292, 318] },
        rainbow: { label: 'Радужная', hues: [0, 45, 90, 150, 205, 265, 315] },
        custom: { label: 'Пользовательская', hues: [] },
      });

      const CURSOR_MODES = Object.freeze({
        attract: 'Притяжение',
        repel: 'Отталкивание',
        orbit: 'Орбита',
        trail: 'След',
      });

      /* ── Configuration ── */
      const DEFAULT_CONFIG = Object.freeze({
        particleCount: 150,
        particleSize: 4,
        speedMultiplier: 1.0,
        hue: 130,
        colorPalette: 'mono',
        customColor1: '#0acf83',
        customColor2: '#38bdf8',
        customColor3: '#f97316',
        attractionForce: 0.3,
        cursorMode: 'attract',
        attractionRadius: 200,
        shadowBlur: 20,
        pulsate: true,
        bounce: true,
        showFps: false,
        backgroundMode: 'gradient',
        backgroundColor: '#1a1a2e',
        backgroundGradientStrength: 0.35,
        showConnections: true,
        connectionDistance: 120,
        connectionWidth: 1,
        connectionOpacity: 0.3,
      });

      const config = { ...DEFAULT_CONFIG };

      const SETTINGS_PRESETS = Object.freeze({
        calm: {
          label: 'Calm',
          settings: {
            particleCount: 110,
            particleSize: 3,
            speedMultiplier: 0.4,
            hue: 205,
            colorPalette: 'cool',
            attractionForce: 0.15,
            cursorMode: 'attract',
            attractionRadius: 140,
            shadowBlur: 10,
            pulsate: true,
            bounce: true,
            backgroundMode: 'gradient',
            backgroundColor: '#14213d',
            backgroundGradientStrength: 0.2,
            showConnections: true,
            connectionDistance: 100,
            connectionWidth: 0.8,
            connectionOpacity: 0.2,
          },
        },
        neon: {
          label: 'Neon',
          settings: {
            particleCount: 240,
            particleSize: 4,
            speedMultiplier: 1.4,
            hue: 130,
            colorPalette: 'neon',
            attractionForce: 0.35,
            cursorMode: 'orbit',
            attractionRadius: 250,
            shadowBlur: 40,
            pulsate: true,
            bounce: true,
            backgroundMode: 'gradient',
            backgroundColor: '#060b1f',
            backgroundGradientStrength: 0.7,
            showConnections: true,
            connectionDistance: 150,
            connectionWidth: 1.5,
            connectionOpacity: 0.4,
          },
        },
        storm: {
          label: 'Storm',
          settings: {
            particleCount: 220,
            particleSize: 5,
            speedMultiplier: 2.2,
            hue: 265,
            colorPalette: 'rainbow',
            attractionForce: 0.75,
            cursorMode: 'repel',
            attractionRadius: 360,
            shadowBlur: 30,
            pulsate: true,
            bounce: true,
            backgroundMode: 'solid',
            backgroundColor: '#030711',
            backgroundGradientStrength: 0.25,
            showConnections: true,
            connectionDistance: 180,
            connectionWidth: 2.0,
            connectionOpacity: 0.5,
          },
        },
        minimal: {
          label: 'Minimal',
          settings: {
            particleCount: 55,
            particleSize: 2,
            speedMultiplier: 0.5,
            hue: 160,
            colorPalette: 'mono',
            attractionForce: 0.1,
            cursorMode: 'trail',
            attractionRadius: 120,
            shadowBlur: 4,
            pulsate: false,
            bounce: false,
            backgroundMode: 'transparent',
            backgroundColor: '#111827',
            backgroundGradientStrength: 0.1,
            showConnections: false,
            connectionDistance: 80,
            connectionWidth: 0.5,
            connectionOpacity: 0.1,
          },
        },
      });

      /* ── Utility functions ── */
      const randomBetween = (min, max) =>
        min + (Math.random() - 0.5) * (max - min);

      const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

      const distance = (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const toHslString = (hue) =>
        `hsl(${hue}, ${CONSTANTS.HSL_SATURATION}, ${CONSTANTS.HSL_LIGHTNESS})`;

      const normalizeHue = (hue) => ((hue % 360) + 360) % 360;

      const isValidHexColor = (value) =>
        typeof value === 'string' && CONSTANTS.HEX_COLOR_PATTERN.test(value);

      function hexToRgb(hex) {
        const normalized = hex.replace('#', '');
        const value = normalized.length === 3
          ? normalized.split('').map((character) => character + character).join('')
          : normalized;
        const intValue = Number.parseInt(value, 16);
        return [(intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255];
      }

      function getBackgroundAccentColor() {
        const [r, g, b] = hexToRgb(config.backgroundColor);
        const mix = 0.2 + config.backgroundGradientStrength * 0.45;
        const mixR = Math.round(r * (1 - mix) + 0 * mix);
        const mixG = Math.round(g * (1 - mix) + 0 * mix);
        const mixB = Math.round(b * (1 - mix) + 30 * mix);
        return `rgb(${mixR}, ${mixG}, ${mixB})`;
      }

      function renderBackground() {
        ctx.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (config.backgroundMode === 'transparent') return;

        if (config.backgroundMode === 'gradient') {
          const gradient = ctx.createLinearGradient(0, 0, canvasBounds.width, canvasBounds.height);
          gradient.addColorStop(0, config.backgroundColor);
          gradient.addColorStop(1, getBackgroundAccentColor());
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = config.backgroundColor;
        }

        ctx.fillRect(0, 0, canvasBounds.width, canvasBounds.height);
      }

      function getCustomPaletteColors() {
        return [config.customColor1, config.customColor2, config.customColor3].filter(
          isValidHexColor
        );
      }

      function getParticleColor() {
        const palette = COLOR_PALETTES[config.colorPalette] || COLOR_PALETTES.mono;

        if (config.colorPalette === 'custom') {
          const colors = getCustomPaletteColors();
          return colors.length
            ? colors[Math.floor(Math.random() * colors.length)]
            : DEFAULT_CONFIG.customColor1;
        }

        if (palette.hues.length > 0) {
          const baseHue = palette.hues[Math.floor(Math.random() * palette.hues.length)];
          return toHslString(
            normalizeHue(baseHue + randomBetween(-CONSTANTS.PALETTE_HUE_VARIANCE, CONSTANTS.PALETTE_HUE_VARIANCE))
          );
        }

        return toHslString(
          normalizeHue(config.hue + randomBetween(-CONSTANTS.HUE_VARIANCE, CONSTANTS.HUE_VARIANCE))
        );
      }

      const updatePointerPosition = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = clientX - rect.left;
        mouseY = clientY - rect.top;
        addPointerTrailPoint();
      };

      const resetPointerPosition = () => {
        mouseX = CONSTANTS.MOUSE_OUT_OF_BOUNDS;
        mouseY = CONSTANTS.MOUSE_OUT_OF_BOUNDS;
      };

      function isPointerActive() {
        return (
          mouseX !== CONSTANTS.MOUSE_OUT_OF_BOUNDS &&
          mouseY !== CONSTANTS.MOUSE_OUT_OF_BOUNDS
        );
      }

      function addPointerTrailPoint() {
        if (config.cursorMode !== 'trail' || !isPointerActive()) return;

        const lastPoint = pointerTrails[pointerTrails.length - 1];
        if (lastPoint) {
          const dx = mouseX - lastPoint.x;
          const dy = mouseY - lastPoint.y;
          if (dx * dx + dy * dy < CONSTANTS.TRAIL_MIN_DISTANCE ** 2) return;
        }

        pointerTrails.push({
          x: mouseX,
          y: mouseY,
          createdAt: performance.now(),
          color: getParticleColor(),
        });

        if (pointerTrails.length > CONSTANTS.TRAIL_MAX_POINTS) {
          pointerTrails.splice(0, pointerTrails.length - CONSTANTS.TRAIL_MAX_POINTS);
        }
      }

      function drawPointerTrails(timestamp) {
        if (pointerTrails.length === 0) return;

        pointerTrails = pointerTrails.filter(
          (point) => timestamp - point.createdAt < CONSTANTS.TRAIL_LIFETIME
        );

        pointerTrails.forEach((point) => {
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
      }

      /* ── Connections (линии между частицами) ── */
      function drawConnections() {
        if (!config.showConnections) return;

        const maxDist = config.connectionDistance;
        const maxDistSq = maxDist * maxDist;
        const lineWidth = config.connectionWidth;
        const maxOpacity = config.connectionOpacity;

        /* Пространственная сетка: разбиваем канвас на ячейки размером maxDist */
        const cols = Math.ceil(canvasBounds.width / maxDist) || 1;
        const rows = Math.ceil(canvasBounds.height / maxDist) || 1;
        const grid = new Array(cols * rows);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
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

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
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
      }

      /* ── Canvas sizing ── */
      const resizeCanvas = () => {
        const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
        canvasBounds = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        canvas.width = Math.ceil(canvasBounds.width * pixelRatio);
        canvas.height = Math.ceil(canvasBounds.height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      };

      /* ── Particle class ── */
      class Particle {
        constructor(x, y) {
          const { SIZE_VARIANCE, HUE_VARIANCE, SPEED_VARIANCE } = CONSTANTS;
          this.x = x;
          this.y = y;
          this.size = config.particleSize + randomBetween(-SIZE_VARIANCE, SIZE_VARIANCE);
          this.baseSize = this.size;
          this.hue = config.hue + randomBetween(-HUE_VARIANCE, HUE_VARIANCE);
          this.color = getParticleColor();
          this.shadowBlur = config.shadowBlur;
          this.vx = randomBetween(-SPEED_VARIANCE, SPEED_VARIANCE) * config.speedMultiplier;
          this.vy = randomBetween(-SPEED_VARIANCE, SPEED_VARIANCE) * config.speedMultiplier;
        }

        draw() {
          ctx.fillStyle = this.color;
          ctx.shadowColor = this.color;
          ctx.shadowBlur = this.shadowBlur;
          ctx.beginPath();
          ctx.arc(this.x, this.y, Math.abs(this.size), 0, CONSTANTS.TAU);
          ctx.fill();
        }

        applyCursorInteraction() {
          if (config.cursorMode === 'trail' || !isPointerActive()) return;

          const dist = distance(this.x, this.y, mouseX, mouseY);
          if (dist >= config.attractionRadius || dist === 0) return;

          const force =
            ((config.attractionRadius - dist) / config.attractionRadius) *
            config.attractionForce;
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
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
          if (config.bounce) {
            if (this.x < 0 || this.x > canvasBounds.width) {
              this.vx *= -1;
              this.x = clamp(this.x, 0, canvasBounds.width);
            }
            if (this.y < 0 || this.y > canvasBounds.height) {
              this.vy *= -1;
              this.y = clamp(this.y, 0, canvasBounds.height);
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

      /* ── Particle lifecycle ── */
      function createParticles() {
        const count = Math.min(
          config.particleCount,
          Math.floor(canvasBounds.width / CONSTANTS.DENSITY_DIVISOR)
        );
        particles = Array.from({ length: count }, () => {
          const x = Math.random() * canvasBounds.width;
          const y = Math.random() * canvasBounds.height;
          return new Particle(x, y);
        });
      }

      function updateParticleSpeed() {
        const speed = config.speedMultiplier;
        particles.forEach((p) => {
          const angle = Math.atan2(p.vy, p.vx);
          const mag = distance(0, 0, p.vx, p.vy);
          if (mag > 0) {
            const baseMag = mag / speed;
            p.vx = Math.cos(angle) * baseMag * speed;
            p.vy = Math.sin(angle) * baseMag * speed;
          }
        });
      }

      function updateParticleSizes() {
        const { SIZE_VARIANCE } = CONSTANTS;
        particles.forEach((p) => {
          p.baseSize = config.particleSize + randomBetween(-SIZE_VARIANCE, SIZE_VARIANCE);
        });
      }

      function updateParticleHues() {
        const { HUE_VARIANCE } = CONSTANTS;
        particles.forEach((p) => {
          p.hue = config.hue + randomBetween(-HUE_VARIANCE, HUE_VARIANCE);
          p.color = getParticleColor();
        });
      }

      function updateParticleColors() {
        particles.forEach((p) => {
          p.color = getParticleColor();
        });
      }

      function updateParticleShadowBlur() {
        particles.forEach((p) => {
          p.shadowBlur = config.shadowBlur;
        });
      }

      function syncCursorMode() {
        if (config.cursorMode !== 'trail') pointerTrails = [];
      }

      /* ── Settings application ── */
      const SETTING_APPLIERS = {
        particleCount: createParticles,
        speedMultiplier: updateParticleSpeed,
        particleSize: updateParticleSizes,
        hue: updateParticleHues,
        colorPalette: updateParticleColors,
        customColor1: updateParticleColors,
        customColor2: updateParticleColors,
        customColor3: updateParticleColors,
        cursorMode: syncCursorMode,
        shadowBlur: updateParticleShadowBlur,
        backgroundMode: renderBackground,
        backgroundColor: renderBackground,
        backgroundGradientStrength: renderBackground,
        showConnections: null,
        connectionDistance: null,
        connectionWidth: null,
        connectionOpacity: null,
      };

      function applySettings(key) {
        const applier = SETTING_APPLIERS[key];
        if (applier) applier();
      }

      function updateFpsIndicator(timestamp) {
        if (!config.showFps || !fpsIndicator) return;

        if (!fpsLastTime) {
          fpsLastTime = timestamp;
          fpsFrameCount = 0;
          return;
        }

        fpsFrameCount += 1;
        const elapsed = timestamp - fpsLastTime;
        if (elapsed < CONSTANTS.FPS_UPDATE_INTERVAL) return;

        const fps = Math.round((fpsFrameCount * 1000) / elapsed);
        fpsIndicator.textContent = `FPS: ${fps}`;
        fpsFrameCount = 0;
        fpsLastTime = timestamp;
      }

      function resetFpsCounter() {
        fpsFrameCount = 0;
        fpsLastTime = 0;
        if (fpsIndicator) fpsIndicator.textContent = 'FPS: 0';
      }

      function syncFpsIndicator() {
        if (!fpsIndicator) return;
        fpsIndicator.hidden = !config.showFps;
        resetFpsCounter();
      }

      /* ── Animation loop ── */
      function animate(timestamp) {
        renderBackground();
        drawPointerTrails(timestamp);
        drawConnections();
        particles.forEach((p) => {
          p.update();
          p.draw();
        });
        updateFpsIndicator(timestamp);
        animationId = requestAnimationFrame(animate);
      }

      function startAnimation() {
        if (animationId || document.hidden) return;
        resetFpsCounter();
        animationId = requestAnimationFrame(animate);
      }

      function stopAnimation() {
        if (!animationId) return;
        cancelAnimationFrame(animationId);
        animationId = null;
        resetFpsCounter();
      }

      /* ── Settings panel controls ── */
      function openSettings() {
        settingsPanel.classList.add(CONSTANTS.CSS_OPEN_CLASS);
        settingsOverlay.classList.add(CONSTANTS.CSS_OPEN_CLASS);
      }

      function closeSettings() {
        settingsPanel.classList.remove(CONSTANTS.CSS_OPEN_CLASS);
        settingsOverlay.classList.remove(CONSTANTS.CSS_OPEN_CLASS);
      }

      function formatDisplayValue(key, value) {
        if (key === 'attractionForce') return value.toFixed(2);
        if (key === 'speedMultiplier') return value.toFixed(1);
        return String(value);
      }

      function getToggleLabelText(key, checked) {
        if (key === 'bounce') return checked ? 'Включено' : 'Выключено';
        return checked ? 'Включена' : 'Выключена';
      }

      function getSettingsControls() {
        return document.querySelectorAll(
          `#settings-panel [${CONSTANTS.ATTR_SETTING}]`
        );
      }

      function getSettingControl(key) {
        return settingsPanel.querySelector(
          `[${CONSTANTS.ATTR_SETTING}="${key}"]`
        );
      }

      function getPresetButtons() {
        return settingsPanel.querySelectorAll(`[${CONSTANTS.ATTR_PRESET}]`);
      }

      function doesPresetMatchConfig(preset) {
        return Object.entries(preset.settings).every(
          ([key, value]) => config[key] === value
        );
      }

      function getActivePresetKey() {
        return Object.keys(SETTINGS_PRESETS).find((presetKey) =>
          doesPresetMatchConfig(SETTINGS_PRESETS[presetKey])
        );
      }

      function syncPresetButtons() {
        const activePresetKey = getActivePresetKey();
        getPresetButtons().forEach((button) => {
          button.classList.toggle(
            'active',
            button.getAttribute(CONSTANTS.ATTR_PRESET) === activePresetKey
          );
        });
      }

      function syncCustomPaletteVisibility() {
        const customPaletteGroup = settingsPanel.querySelector('[data-custom-palette]');
        if (!customPaletteGroup) return;
        customPaletteGroup.classList.toggle(
          CONSTANTS.CSS_VISIBLE_CLASS,
          config.colorPalette === 'custom'
        );
      }

      function handleCheckboxInput(input, key) {
        const value = input.checked;
        const wrapper = input.closest('.toggle-wrapper');
        if (wrapper) {
          const label = wrapper.querySelector(CONSTANTS.SELECTOR_TOGGLE_LABEL);
          if (label) label.textContent = getToggleLabelText(key, value);
        }
        return value;
      }

      function handleRangeInput(input, key) {
        const value = parseFloat(input.value);
        const group = input.closest(CONSTANTS.SELECTOR_CONTROL_GROUP);
        if (group) {
          const display = group.querySelector(`[${CONSTANTS.ATTR_DISPLAY}]`);
          if (display) display.textContent = formatDisplayValue(key, value);
        }
        return value;
      }

      function handleSelectInput(input) {
        return input.value;
      }

      function handleColorInput(input) {
        return isValidHexColor(input.value) ? input.value : DEFAULT_CONFIG.customColor1;
      }

      function syncControl(input) {
        const key = input.getAttribute(CONSTANTS.ATTR_SETTING);
        if (!Object.prototype.hasOwnProperty.call(config, key)) return;

        if (input.type === 'checkbox') {
          input.checked = config[key];
          handleCheckboxInput(input, key);
        } else if (input.type === 'color' || input.tagName === 'SELECT') {
          input.value = config[key];
        } else {
          input.value = config[key];
          handleRangeInput(input, key);
        }
      }

      function syncControlsFromConfig() {
        getSettingsControls().forEach(syncControl);
        syncCustomPaletteVisibility();
        syncPresetButtons();
        syncFpsIndicator();
      }

      function readNumberSetting(key, value) {
        const input = getSettingControl(key);
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_CONFIG[key];

        const min = input ? Number(input.min) : NaN;
        const max = input ? Number(input.max) : NaN;
        return clamp(
          number,
          Number.isFinite(min) ? min : number,
          Number.isFinite(max) ? max : number
        );
      }

      function readStoredSetting(key, value) {
        const defaultValue = DEFAULT_CONFIG[key];
        if (typeof defaultValue === 'boolean') {
          return typeof value === 'boolean' ? value : defaultValue;
        }
        if (key === 'colorPalette') {
          return Object.prototype.hasOwnProperty.call(COLOR_PALETTES, value)
            ? value
            : defaultValue;
        }
        if (key === 'cursorMode') {
          return Object.prototype.hasOwnProperty.call(CURSOR_MODES, value)
            ? value
            : defaultValue;
        }
        if (key === 'backgroundMode') {
          return ['solid', 'gradient', 'transparent'].includes(value) ? value : defaultValue;
        }
        if (key === 'backgroundColor') {
          return isValidHexColor(value) ? value : defaultValue;
        }
        if (key.startsWith('customColor')) {
          return isValidHexColor(value) ? value : defaultValue;
        }
        return readNumberSetting(key, value);
      }

      function loadSavedSettings() {
        try {
          const savedSettings = window.localStorage.getItem(CONSTANTS.STORAGE_KEY);
          if (!savedSettings) return;

          const parsedSettings = JSON.parse(savedSettings);
          if (!parsedSettings || typeof parsedSettings !== 'object') return;

          Object.keys(DEFAULT_CONFIG).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(parsedSettings, key)) {
              config[key] = readStoredSetting(key, parsedSettings[key]);
            }
          });
        } catch (error) {
          console.warn('Не удалось загрузить настройки:', error);
        }
      }

      function saveSettings() {
        try {
          window.localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
          console.warn('Не удалось сохранить настройки:', error);
        }
      }

      function clearSavedSettings() {
        try {
          window.localStorage.removeItem(CONSTANTS.STORAGE_KEY);
        } catch (error) {
          console.warn('Не удалось сбросить сохранённые настройки:', error);
        }
      }

      function resetSettings() {
        Object.assign(config, DEFAULT_CONFIG);
        clearSavedSettings();
        syncControlsFromConfig();
        syncCursorMode();
        createParticles();
      }

      function applyPreset(presetKey) {
        const preset = SETTINGS_PRESETS[presetKey];
        if (!preset) return;

        Object.assign(config, preset.settings);
        syncControlsFromConfig();
        syncCursorMode();
        createParticles();
        saveSettings();
      }

      function handleSettingInput(input) {
        const key = input.getAttribute(CONSTANTS.ATTR_SETTING);
        let value;
        if (input.type === 'checkbox') {
          value = handleCheckboxInput(input, key);
        } else if (input.type === 'color') {
          value = handleColorInput(input);
        } else if (input.tagName === 'SELECT') {
          value = handleSelectInput(input);
        } else {
          value = handleRangeInput(input, key);
        }

        config[key] = value;
        if (key === 'colorPalette') syncCustomPaletteVisibility();
        if (key === 'showFps') syncFpsIndicator();
        applySettings(key);
        syncPresetButtons();
        saveSettings();
      }

      function bindSettings() {
        getSettingsControls().forEach((input) => {
          const eventName =
            input.type === 'checkbox' || input.type === 'color' || input.tagName === 'SELECT'
              ? 'change'
              : 'input';
          input.addEventListener(eventName, () => handleSettingInput(input));
        });

        getPresetButtons().forEach((button) => {
          button.addEventListener('click', () => {
            applyPreset(button.getAttribute(CONSTANTS.ATTR_PRESET));
          });
        });
      }

      /* ── Event listeners ── */
      function setupCanvasMouseTracking() {
        canvas.addEventListener('mousemove', (e) => {
          updatePointerPosition(e.clientX, e.clientY);
        });

        canvas.addEventListener('mouseleave', resetPointerPosition);
      }

      function setupCanvasTouchTracking() {
        canvas.addEventListener(
          'touchstart',
          (e) => {
            const touch = e.touches[0];
            if (!touch) return;
            updatePointerPosition(touch.clientX, touch.clientY);
          },
          { passive: true }
        );

        canvas.addEventListener(
          'touchmove',
          (e) => {
            const touch = e.touches[0];
            if (!touch) return;
            updatePointerPosition(touch.clientX, touch.clientY);
          },
          { passive: true }
        );

        canvas.addEventListener('touchend', resetPointerPosition);
        canvas.addEventListener('touchcancel', resetPointerPosition);
      }

      function setupWindowResize() {
        window.addEventListener('resize', () => {
          resizeCanvas();
          createParticles();
        });
      }

      function setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            stopAnimation();
          } else {
            startAnimation();
          }
        });
      }

      function setupPanelEventListeners() {
        settingsToggle.addEventListener('click', openSettings);
        settingsClose.addEventListener('click', closeSettings);
        settingsReset.addEventListener('click', resetSettings);
        settingsOverlay.addEventListener('click', closeSettings);
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeSettings();
        });
      }

      /* ── Initialization ── */
      function init() {
        loadSavedSettings();
        syncControlsFromConfig();
        resizeCanvas();
        createParticles();
        stopAnimation();
        startAnimation();
        bindSettings();
        setupCanvasMouseTracking();
        setupCanvasTouchTracking();
        setupWindowResize();
        setupVisibilityHandling();
        setupPanelEventListeners();
      }

      init();
    })();
