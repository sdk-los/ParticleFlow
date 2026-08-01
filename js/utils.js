/* ── Utility functions ── */
window.ParticleSystem = window.ParticleSystem || {};

(function () {
  const { ParticleSystem, ParticleSystem: { CONSTANTS, config, COLOR_PALETTES } } = window;

  ParticleSystem.randomBetween = function randomBetween(min, max) {
    return min + (Math.random() - 0.5) * (max - min);
  };

  ParticleSystem.clamp = function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  ParticleSystem.distance = function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  ParticleSystem.toHslString = function toHslString(hue) {
    return `hsl(${hue}, ${CONSTANTS.HSL_SATURATION}, ${CONSTANTS.HSL_LIGHTNESS})`;
  };

  ParticleSystem.normalizeHue = function normalizeHue(hue) {
    return ((hue % 360) + 360) % 360;
  };

  ParticleSystem.isValidHexColor = function isValidHexColor(value) {
    return typeof value === 'string' && CONSTANTS.HEX_COLOR_PATTERN.test(value);
  };

  ParticleSystem.hexToRgb = function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map((character) => character + character).join('')
      : normalized;
    const intValue = Number.parseInt(value, 16);
    return [(intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255];
  };

  ParticleSystem.calculateSelfDrift = function calculateSelfDrift(particle, time, intensity, speed) {
    if (!particle || !Number.isFinite(intensity) || !Number.isFinite(speed)) {
      return { vx: 0, vy: 0 };
    }

    const driftStrength = intensity * (0.3 + (particle.size || 0) * 0.04);
    const timeAngle = (time * 0.001 * speed) + particle.driftPhase + particle.y * 0.001;

    switch (config.selfDriftMode) {
      case 'horizontal':
        return {
          vx: Math.cos(timeAngle) * driftStrength,
          vy: 0,
        };

      case 'vertical':
        return {
          vx: 0,
          vy: Math.sin(timeAngle) * driftStrength,
        };

      case 'upDown':
        return {
          vx: 0,
          vy: Math.sin(timeAngle) * driftStrength,
        };

      case 'leftRight':
        return {
          vx: Math.cos(timeAngle) * driftStrength,
          vy: 0,
        };

      case 'up':
        return {
          vx: 0,
          vy: -Math.abs(Math.sin(timeAngle)) * driftStrength,
        };

      case 'down':
        return {
          vx: 0,
          vy: Math.abs(Math.sin(timeAngle)) * driftStrength,
        };

      case 'left':
        return {
          vx: -Math.abs(Math.cos(timeAngle)) * driftStrength,
          vy: 0,
        };

      case 'right':
        return {
          vx: Math.abs(Math.cos(timeAngle)) * driftStrength,
          vy: 0,
        };

      case 'directional': {
        const fixedAngle = config.selfDriftDirection * Math.PI / 180;
        return {
          vx: Math.cos(fixedAngle) * driftStrength,
          vy: Math.sin(fixedAngle) * driftStrength,
        };
      }

      default: // 'random'
        return {
          vx: Math.cos(timeAngle) * driftStrength,
          vy: Math.sin(timeAngle) * driftStrength,
        };
    }
  };

  ParticleSystem.getBackgroundAccentColor = function getBackgroundAccentColor() {
    const [r, g, b] = ParticleSystem.hexToRgb(config.backgroundColor);
    const mix = 0.2 + config.backgroundGradientStrength * 0.45;
    const mixR = Math.round(r * (1 - mix) + 0 * mix);
    const mixG = Math.round(g * (1 - mix) + 0 * mix);
    const mixB = Math.round(b * (1 - mix) + 30 * mix);
    return `rgb(${mixR}, ${mixG}, ${mixB})`;
  };

  ParticleSystem.getCustomPaletteColors = function getCustomPaletteColors() {
    return [config.customColor1, config.customColor2, config.customColor3].filter(
      ParticleSystem.isValidHexColor
    );
  };

  ParticleSystem.getParticleColor = function getParticleColor() {
    const palette = COLOR_PALETTES[config.colorPalette] || COLOR_PALETTES.mono;

    if (config.colorPalette === 'custom') {
      const colors = ParticleSystem.getCustomPaletteColors();
      return colors.length
        ? colors[Math.floor(Math.random() * colors.length)]
        : ParticleSystem.DEFAULT_CONFIG.customColor1;
    }

    if (palette.hues.length > 0) {
      const baseHue = palette.hues[Math.floor(Math.random() * palette.hues.length)];
      return ParticleSystem.toHslString(
        ParticleSystem.normalizeHue(baseHue + ParticleSystem.randomBetween(-CONSTANTS.PALETTE_HUE_VARIANCE, CONSTANTS.PALETTE_HUE_VARIANCE))
      );
    }

    return ParticleSystem.toHslString(
      ParticleSystem.normalizeHue(config.hue + ParticleSystem.randomBetween(-CONSTANTS.HUE_VARIANCE, CONSTANTS.HUE_VARIANCE))
    );
  };
})();