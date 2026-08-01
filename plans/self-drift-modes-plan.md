# План: Новые режимы само-дрейфа

## Этап 1: Орбитальный (orbit), Волновой (wave), Спиральный (spiral)

### Изменяемые файлы

| Файл | Что меняем |
|------|-----------|
| `js/particle.js` | Добавить `this.anchorX` и `this.anchorY` в конструктор (нужно для orbit) |
| `js/utils.js` | Добавить 3 новых `case` в `calculateSelfDrift()` |
| `js/config.js` | Добавить ключи `orbit`, `wave`, `spiral` в валидацию `selfDriftMode` |
| `index.html` | Добавить 3 новых `<option>` в `<select data-setting="selfDriftMode">` |

---

### 1.1. `js/particle.js` — конструктор Particle

Добавить поля `anchorX` и `anchorY`, которые фиксируют начальную позицию частицы. Нужны для орбитального режима.

```js
this.anchorX = x;
this.anchorY = y;
```

---

### 1.2. `js/utils.js` — функция `calculateSelfDrift()`

Добавить три новых `case` после `case 'directional'`:

#### `case 'orbit'` — Орбитальный

```js
case 'orbit': {
  const orbitRadius = driftStrength * (0.5 + (particle.size || 0) * 0.08);
  const orbitAngle = timeAngle * 0.6;
  const targetX = particle.anchorX + Math.cos(orbitAngle) * orbitRadius;
  const targetY = particle.anchorY + Math.sin(orbitAngle) * orbitRadius;
  return {
    vx: (targetX - particle.x) * 0.05,
    vy: (targetY - particle.y) * 0.05,
  };
}
```

**Логика:** частица стремится к точке на окружности вокруг своего `anchor`. Коэффициент `0.05` — это скорость «притяжения» к целевой точке, создающая плавное орбитальное движение.

#### `case 'wave'` — Волновой

```js
case 'wave': {
  const waveX = Math.sin(timeAngle + particle.y * 0.005) * driftStrength;
  const waveY = Math.cos(timeAngle + particle.x * 0.005) * driftStrength;
  return { vx: waveX, vy: waveY };
}
```

**Логика:** каждая частица получает сдвиг фазы в зависимости от своей позиции `x` или `y`. Это создаёт эффект распространяющейся волны — частицы движутся согласованно, как рябь.

#### `case 'spiral'` — Спиральный

```js
case 'spiral': {
  const spiralRadius = driftStrength * (0.3 + 0.7 * Math.abs(Math.sin(timeAngle * 0.4)));
  const spiralAngle = timeAngle;
  return {
    vx: Math.cos(spiralAngle) * spiralRadius,
    vy: Math.sin(spiralAngle) * spiralRadius,
  };
}
```

**Логика:** радиус спирали пульсирует по синусоиде (`0.3 + 0.7 * |sin|`), создавая эффект раскручивающейся и закручивающейся спирали. Угол вращается равномерно.

---

### 1.3. `js/config.js` — валидация `selfDriftMode`

В строке валидации (строка 211) добавить новые ключи:

```js
if (key === 'selfDriftMode') {
  return ['random', 'horizontal', 'vertical', 'upDown', 'leftRight', 'up', 'down', 'left', 'right', 'directional', 'orbit', 'wave', 'spiral'].includes(value)
    ? value
    : defaultValue;
}
```

---

### 1.4. `index.html` — селект режимов

Добавить три новых `<option>` в `<select data-setting="selfDriftMode">`:

```html
<option value="orbit">Орбитальный</option>
<option value="wave">Волновой</option>
<option value="spiral">Спиральный</option>
```

---

### Порядок реализации

1. `js/particle.js` — добавить `anchorX`, `anchorY`
2. `js/utils.js` — добавить 3 `case`
3. `js/config.js` — добавить ключи в валидацию
4. `index.html` — добавить `<option>`

---

## Этап 2: Остальные режимы (отдельная задача)

| Режим | Ключ | Сложность | Описание |
|-------|------|-----------|----------|
| ⚡ Импульсный | `burst` | Средняя | Рывки и паузы |
| 🧲 Маятниковый | `pendulum` | Низкая | Качание вдоль оси |
| 🌪️ Вихревой | `vortex` | Средняя | Общий водоворот |
| 🦋 Лиссажу | `lissajous` | Низкая | Геометрические узоры |
| 🎲 Броуновский | `brownian` | Средняя | Органичное хаотичное движение |

Для каждого режима потребуется:
1. Добавить `case` в `js/utils.js`
2. Добавить ключ в валидацию `js/config.js`
3. Добавить `<option>` в `index.html`