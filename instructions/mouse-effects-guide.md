# Эффекты при движении курсора мыши в проекте AutoGivex

## 📋 Содержание

1. [Общее описание](#1-общее-описание)
2. [Эффект №1 — Радиальный градиент, следующий за курсором (поля ввода)](#2-эффект-1--радиальный-градиент-следующий-за-курсором-поля-ввода)
3. [Эффект №2 — Радиальный градиент для UI-компонентов (кнопки, карточки)](#3-эффект-2--радиальный-градиент-для-ui-компонентов-кнопки-карточки)
4. [Эффект №3 — Система частиц на Canvas](#4-эффект-3--система-частиц-на-canvas)
5. [Эффект №4 — CSS-анимации при наведении (градиентные кнопки)](#5-эффект-4--css-анимации-при-наведении-градиентные-кнопки)
6. [CSS-переменные цветов](#6-css-переменные-цветов)
7. [Схема взаимодействия компонентов](#7-схема-взаимодействия-компонентов)
8. [Как воспроизвести каждый эффект](#8-как-воспроизвести-каждый-эффект)

---

## 1. Общее описание

В проекте **AutoGivex** реализовано **4 типа эффектов**, связанных с движением курсора мыши:

| № | Эффект | Технология | Где используется |
|---|--------|-----------|------------------|
| 1 | Радиальный градиент за курсором | CSS `radial-gradient` + React inline styles | Поля ввода (`Input`-компонент) |
| 2 | Радиальный градиент для UI | CSS `radial-gradient` + React inline styles | Кнопки, карточки, селекты |
| 3 | Система частиц | HTML5 Canvas 2D | Фоновые анимации |
| 4 | Hover-анимации | CSS transitions + псевдокласс `:hover` | Градиентные кнопки |

Все эффекты используют единую цветовую схему через CSS-переменные (см. [раздел 6](#6-css-переменные-цветов)).

---

## 2. Эффект №1 — Радиальный градиент, следующий за курсором (поля ввода)

### 2.1. Исходный код

Файл: [`AutoGivex_files/page-3734bb2cdaab7cb4.js`](AutoGivex_files/page-3734bb2cdaab7cb4.js:1)

```javascript
// Шаблон градиента (функция h)
function h() {
  let e = s([
    "\n\t\t\t\t\tradial-gradient(\n\t\t\t\t\t",
    " circle at ",
    "px ",
    "px,\n\t\t\t\t\t",
    ",\n\t\t\t\t\ttransparent 80%\n\t\t\t\t)"
  ]);
  return (h = function () { return e }), e;
}

// Компонент Input
let p = l.forwardRef((e, t) => {
  let {
    className: i,
    type: s,
    mouseX: l,
    mouseY: d,
    error: c = !1,
    visible: p,
    ...A
  } = e;

  return (0, a.jsx)(n.E.div, {
    className: "p-[2px] rounded-[33px]",
    style: {
      background: o(
        h(),
        "150px",   // радиус градиента
        l,         // mouseX
        d,         // mouseY
        c ? "var(--red-custom)" : "var(--green-custom)"
      ),
    },
    children: (0, a.jsx)("input", { ... }),
  });
});
p.displayName = "Input";
```

### 2.2. Как это работает «под капотом»

1. **Функция `h()`** — это шаблонизатор (tagged template literal). Она возвращает строку-шаблон CSS-функции `radial-gradient()` с четырьмя «слотами» для подстановки значений:
   - Радиус градиента (фиксированное значение `150px`)
   - Координата X курсора (`mouseX`)
   - Координата Y курсора (`mouseY`)
   - Цвет градиента (зелёный или красный)

2. **Функция `o()`** — динамический CSS-генератор. Она принимает шаблон и подставляет в него переданные значения. Результат — готовая строка CSS для свойства `background`.

3. **Компонент `Input`**:
   - Принимает пропсы `mouseX` и `mouseY` — координаты курсора **относительно элемента**
   - Оборачивает `<input>` в `<div>` с `padding: 2px` (`p-[2px]`) и скруглением `33px`
   - На внешний `div` накладывается `radial-gradient` с центром в позиции курсора
   - Внутренний `<input>` имеет белый фон (`bg-gray-input`), поэтому градиент просвечивает только через padding — создаётся эффект **«светящейся обводки»**

4. **Смена цвета при ошибке**: если пропс `error === true`, цвет градиента меняется с `var(--green-custom)` на `var(--red-custom)`.

### 2.3. Визуальный результат

```
┌─────────────────────────────────────┐
│  div (p-[2px], rounded-[33px])      │
│  background: radial-gradient(...)   │  ← градиент跟随 за курсором
│  ┌───────────────────────────────┐  │
│  │  input (bg-gray-input)        │  │  ← белый фон, перекрывает центр
│  │                               │  │
│  └───────────────────────────────┘  │
│       ← padding 2px →               │  ← здесь виден градиент
└─────────────────────────────────────┘
```

---

## 3. Эффект №2 — Радиальный градиент для UI-компонентов (кнопки, карточки)

### 3.1. Исходный код

Файл: [`AutoGivex_files/page-3734bb2cdaab7cb4.js`](AutoGivex_files/page-3734bb2cdaab7cb4.js:1)

```javascript
function b() {
  let e = s([
    "\n                    radial-gradient(\n                    ",
    " circle at ",
    "px ",
    "px,\n                    ",
    ",\n                    transparent 80%\n                )"
  ]);
  return (b = function () { return e }), e;
}

let f = () => {
  let [e, t] = l.useState("sm");
  // ... обработчик изменения размера
};
```

### 3.2. Как это работает

Этот эффект **полностью идентичен** эффекту №1 по механике, но используется для других UI-компонентов:

- Функция `b()` — тот же шаблон `radial-gradient` с теми же слотами
- Компонент `f` — более общий UI-компонент (вероятно, кнопка или карточка)
- Отличие: шаблон имеет другое форматирование отступов, но структура та же

**Ключевые параметры:**
- Радиус градиента: передаётся как аргумент (не обязательно `150px`)
- Координаты: `mouseX`, `mouseY` — позиция курсора
- Цвет: CSS-переменная или конкретное значение

---

## 4. Эффект №3 — Система частиц на Canvas

### 4.1. Исходный код

Файл: [`AutoGivex_files/page-3734bb2cdaab7cb4.js`](AutoGivex_files/page-3734bb2cdaab7cb4.js:1)

```javascript
class eD {
  drawParticle() {
    this.ctx.fillStyle = "hsl(".concat(this.hue, ", 100%, 50%)");
    this.ctx.shadowColor = "#0acf83";
    this.ctx.shadowBlur = this.shadowBlur;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, Math.abs(this.size), 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update() {
    // ... обновление позиции/состояния частицы
  }
}
```

### 4.2. Как это работает «под капотом»

1. **Класс `eD` (Particle)** — каждая частица представлена экземпляром этого класса.

2. **Свойства частицы:**
   - `this.x`, `this.y` — координаты на Canvas
   - `this.size` — радиус частицы (используется `Math.abs()` для защиты от отрицательных значений)
   - `this.hue` — оттенок в цветовой модели HSL (0–360)
   - `this.ctx` — ссылка на Canvas 2D rendering context
   - `this.shadowBlur` — интенсивность свечения

3. **Метод `drawParticle()`:**
   - Устанавливает цвет заливки: `hsl(hue, 100%, 50%)` — чистый оттенок с полной насыщенностью
   - Устанавливает цвет тени: `#0acf83` (фирменный зелёный)
   - Устанавливает размытие тени: `shadowBlur`
   - Рисует круг через `arc(x, y, radius, 0, 2π)`
   - Заполняет круг через `fill()`

4. **Метод `update()`** — вызывается каждый кадр анимации (через `requestAnimationFrame`). Обновляет позицию частицы (движение, гравитация, притяжение к курсору и т.д.).

5. **Эффект свечения:** достигается комбинацией:
   - `shadowColor: #0acf83` — зелёная тень
   - `shadowBlur` — размытие создаёт эффект «неона»
   - Яркие цвета HSL — частицы выглядят насыщенно

### 4.3. Визуальный результат

```
  ✦  ✦
    ✦  ← частицы с зелёным свечением
  ✦     ✦
    ✦  ✦
```

Каждая частица — это круг с неоновым зелёным ореолом, движущийся по Canvas.

---

## 5. Эффект №4 — CSS-анимации при наведении (градиентные кнопки)

### 5.1. Исходный код

Файл: [`AutoGivex_files/12a8062b90730b14.css`](AutoGivex_files/12a8062b90730b14.css:1)

```css
.Button_gradientButton__hTWAP {
  position: relative;
  border-radius: 40px;
  overflow: hidden;
  background: #fff;
  z-index: 1;
  transition: color .3s;
}

.Button_gradientButton__hTWAP .Button_arrow__Pi_KL {
  position: relative;
  color: #fff;
  transition: color .3s, transform .3s;
  transform: translateX(-5px);
}

.Button_gradientButton__hTWAP .Button_arrowPath__vL_v8 {
  opacity: 0;
  transition: opacity .3s;
}

.Button_gradientButton__hTWAP:hover,
.Button_gradientButton__hTWAP:hover span {
  color: var(--green-custom);
}

.Button_gradientButton__hTWAP:hover .Button_arrow__Pi_KL {
  color: var(--green-custom);
  transform: translateX(0);
}

.Button_gradientButton__hTWAP:hover .Button_arrowPath__vL_v8 {
  opacity: 1;
}
```

### 5.2. Как это работает «под капотом»

1. **Базовая кнопка (`.Button_gradientButton__hTWAP`):**
   - `border-radius: 40px` — сильное скругление
   - `overflow: hidden` — скрывает выходящие за пределы элементы (например, фоновый градиент)
   - `background: #fff` — белый фон
   - `transition: color .3s` — плавное изменение цвета текста за 300ms

2. **Стрелка (`.Button_arrow__Pi_KL`):**
   - Изначально сдвинута влево: `translateX(-5px)`
   - Цвет: белый
   - При hover: сдвигается в исходное положение `translateX(0)` и меняет цвет на зелёный
   - `transition: color .3s, transform .3s` — обе анимации длятся 300ms

3. **Путь стрелки (`.Button_arrowPath__vL_v8`):**
   - Изначально скрыт: `opacity: 0`
   - При hover: плавно появляется: `opacity: 1`
   - Используется для создания эффекта «прорисовки» стрелки

4. **Текст кнопки:**
   - При hover: `color: var(--green-custom)` — текст становится зелёным

### 5.3. Временная диаграмма анимации

```
Состояние          | hover false → true
───────────────────┼──────────────────────────────►
Текст (color)      | ■■■■■■■■■■■■■■■■■■■■ 300ms
Стрелка (color)    | ■■■■■■■■■■■■■■■■■■■■ 300ms
Стрелка (transform) | ■■■■■■■■■■■■■■■■■■■■ 300ms
Путь стрелки (opacity) | ■■■■■■■■■■■■■■■■■■■■ 300ms
                   |
t = 0              t = 300ms
```

---

## 6. CSS-переменные цветов

Все эффекты используют единую систему CSS-переменных:

| Переменная | Значение | Назначение |
|-----------|----------|------------|
| `--green-custom` | `#0acf83` | Основной зелёный (фирменный цвет) |
| `--red-custom` | — | Красный для состояний ошибки |
| `--green-pale` | — | Бледно-зелёный для свечения при hover |
| `--red-pale` | — | Бледно-красный для свечения при ошибке |
| `--neutral-700` | — | Нейтральный оттенок для теней |

**Где используются:**
- `var(--green-custom)` — цвет градиента в полях ввода, цвет текста при hover на кнопках, цвет частиц (`#0acf83`)
- `var(--red-custom)` — цвет градиента при ошибке в поле ввода
- `var(--green-pale)` — внешняя тень поля ввода при hover: `hover:shadow-[0px_4px_30px_0px_var(--green-pale)]`
- `var(--red-pale)` — внешняя тень поля ввода при ошибке + hover
- `var(--neutral-700)` — стандартная тень поля ввода: `shadow-[0px_0px_1px_1px_var(--neutral-700)]`

---

## 7. Схема взаимодействия компонентов

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Родительский компонент                        │
│                                                                     │
│  Отслеживает положение курсора мыши (onMouseMove)                   │
│  Хранит mouseX, mouseY в состоянии                                 │
└──────────┬──────────────────────────────────┬──────────────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐        ┌──────────────────────────┐
│   Input (компонент p) │        │  UI-компонент (f)        │
│                      │        │                          │
│  Принимает:          │        │  Принимает:              │
│  ├─ mouseX, mouseY   │        │  ├─ mouseX, mouseY       │
│  ├─ error (bool)     │        │  ├─ размер (sm/md/lg)    │
│  └─ type, className  │        │  └─ children             │
│                      │        │                          │
│  Рендерит:           │        │  Рендерит:               │
│  └─ div с radial-    │        │  └─ элемент с radial-    │
│     gradient по      │        │     gradient по          │
│     координатам      │        │     координатам          │
└──────────────────────┘        └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Canvas (система частиц)                         │
│                                                                     │
│  class eD (Particle) {                                              │
│    drawParticle() — рисует круг с тенью #0acf83                     │
│    update() — обновляет позицию (вызывается каждый кадр)            │
│  }                                                                  │
│                                                                     │
│  Массив частиц обновляется через requestAnimationFrame              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CSS-стили (градиентные кнопки)                    │
│                                                                     │
│  .Button_gradientButton__hTWAP                                      │
│  ├── :hover → color: var(--green-custom)                            │
│  ├── .Button_arrow__Pi_KL → translateX(-5px) → 0                   │
│  └── .Button_arrowPath__vL_v8 → opacity: 0 → 1                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Порядок инициализации эффектов

1. **Пользователь загружает страницу** → CSS-стили применяются сразу
2. **Пользователь двигает мышью** → родительский компонент обновляет `mouseX`, `mouseY`
3. **Поля ввода и UI-компоненты** получают новые координаты → `radial-gradient` перерисовывается
4. **Canvas-анимация** запускается через `requestAnimationFrame` → частицы движутся независимо
5. **При hover на кнопку** → CSS-транзишены плавно меняют цвет и позицию элементов

---

## 8. Как воспроизвести каждый эффект

### 8.1. Эффект радиального градиента (поля ввода)

```jsx
import React, { useState, useRef } from 'react';

const GradientInput = ({ error = false }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={{
        padding: '2px',
        borderRadius: '33px',
        background: `radial-gradient(
          150px circle at ${mousePos.x}px ${mousePos.y}px,
          ${error ? 'var(--red-custom)' : 'var(--green-custom)'},
          transparent 80%
        )`,
      }}
    >
      <input
        type="text"
        style={{
          width: '100%',
          height: '50px',
          border: 'none',
          borderRadius: '31px',
          padding: '0 20px',
          background: '#f0f0f0',
          outline: 'none',
        }}
      />
    </div>
  );
};
```

**Tailwind-версия:**
```jsx
<div
  onMouseMove={handleMouseMove}
  className="p-[2px] rounded-[33px]"
  style={{
    background: `radial-gradient(150px circle at ${x}px ${y}px, var(--green-custom), transparent 80%)`,
  }}
>
  <input className="flex h-[50px] w-full border-none bg-gray-input text-black rounded-[31px] px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-green-custom shadow-[0px_0px_1px_1px_var(--neutral-700)] transition hover:shadow-[0px_4px_30px_0px_var(--green-pale)] duration-500" />
</div>
```

### 8.2. Эффект радиального градиента (UI-компоненты)

```jsx
const GradientCard = ({ children }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, var(--green-custom), transparent 80%)`,
        borderRadius: '20px',
        padding: '20px',
      }}
    >
      {children}
    </div>
  );
};
```

### 8.3. Система частиц на Canvas

```jsx
import React, { useRef, useEffect } from 'react';

class Particle {
  constructor(x, y, size, hue, ctx) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = hue;
    this.ctx = ctx;
    this.shadowBlur = 20;
  }

  drawParticle() {
    this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    this.ctx.shadowColor = '#0acf83';
    this.ctx.shadowBlur = this.shadowBlur;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, Math.abs(this.size), 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update() {
    // Логика движения частицы
    this.x += (Math.random() - 0.5) * 2;
    this.y += (Math.random() - 0.5) * 2;
  }
}

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];

    // Создаём частицы
    for (let i = 0; i < 50; i++) {
      particles.push(
        new Particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 5 + 1,
          Math.random() * 360,
          ctx
        )
      );
    }

    // Анимационный цикл
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.drawParticle();
      });
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ background: '#1a1a2e' }}
    />
  );
};
```

### 8.4. CSS-анимация градиентной кнопки

```css
.gradient-button {
  position: relative;
  border-radius: 40px;
  overflow: hidden;
  background: #fff;
  z-index: 1;
  transition: color 0.3s;
  cursor: pointer;
  padding: 16px 32px;
  border: none;
  font-size: 16px;
}

.gradient-button .arrow {
  display: inline-block;
  position: relative;
  color: #fff;
  transition: color 0.3s, transform 0.3s;
  transform: translateX(-5px);
  margin-left: 8px;
}

.gradient-button .arrow-path {
  opacity: 0;
  transition: opacity 0.3s;
}

.gradient-button:hover,
.gradient-button:hover span {
  color: var(--green-custom);
}

.gradient-button:hover .arrow {
  color: var(--green-custom);
  transform: translateX(0);
}

.gradient-button:hover .arrow-path {
  opacity: 1;
}
```

```jsx
const GradientButton = ({ children }) => {
  return (
    <button className="gradient-button">
      <span>{children}</span>
      <span className="arrow">
        →
        <span className="arrow-path">→</span>
      </span>
    </button>
  );
};
```

---

## Приложение: CSS-переменные (для подключения)

```css
:root {
  --green-custom: #0acf83;
  --red-custom: #ff4d4d;
  --green-pale: rgba(10, 207, 131, 0.3);
  --red-pale: rgba(255, 77, 77, 0.3);
  --neutral-700: rgba(0, 0, 0, 0.1);
}
```

---

*Документация составлена на основе анализа исходного кода проекта AutoGivex (Next.js + React + Tailwind CSS + Canvas 2D).*