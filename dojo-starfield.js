/**
 * Math Dojo Cosmic Starfield Engine
 * Renderiza un cielo nocturno estrellado orgánico y disperso
 * con parpadeo suave, destello en cruz y nebulosa en modo claro.
 * Sincronizado dinámicamente con Math Universe & Math Lab.
 */
(() => {
  const STAR_COLORS_DARK = [
    '#ffffff',
    '#e0e7ff',
    '#93c5fd',
    '#c4b5fd',
    '#7dd3fc',
    '#fde68a'
  ];

  const STAR_COLORS_LIGHT = [
    '#e11d48', // Rubí rosáceo
    '#f43f5e', // Coral brillante
    '#7c3aed', // Amatista estelar
    '#0284c7', // Azul cerúleo
    '#ea580c', // Ámbar solar
    '#059669', // Menta esmeralda
    '#be123c', // Rosa intenso
    '#d946ef'  // Magenta
  ];

  let canvas = null;
  let ctx = null;
  let animationFrameId = null;
  let stars = [];
  let width = 0;
  let height = 0;
  let isRunning = false;
  let scrollY = 0;

  const STAR_COUNT_DESKTOP = 150;
  const STAR_COUNT_MOBILE = 75;

  const isLightMode = () => document.documentElement.getAttribute('data-theme') === 'light';
  const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Secuencia Halton 2D (bases 2 y 3) para distribución uniforme y natural sin líneas ni cúmulos
  const halton = (index, base) => {
    let result = 0;
    let f = 1 / base;
    let i = index;
    while (i > 0) {
      result += f * (i % base);
      i = Math.floor(i / base);
      f /= base;
    }
    return result;
  };

  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  };

  const initStars = (count) => {
    stars = [];
    for (let i = 0; i < count; i++) {
      const idx = i + 1;
      const rawX = (halton(idx, 2) + (hash(i * 3 + 1) - 0.5) * 0.06 + 1) % 1;
      const rawY = (halton(idx, 3) + (hash(i * 7 + 5) - 0.5) * 0.06 + 1) % 1;

      const isBright = i % 10 === 0;
      const h3 = hash(i * 13 + 7);
      const h4 = hash(i * 19 + 3);

      stars.push({
        x: rawX * 0.96 + 0.02,
        y: rawY * 0.96 + 0.02,
        size: isBright ? 1.8 + h3 * 0.85 : 0.7 + h4 * 1.1,
        baseAlpha: isBright ? 0.7 + h3 * 0.3 : 0.22 + h4 * 0.45,
        twinkleSpeed: 0.65 + h3 * 1.75,
        twinklePhase: i * 2.39996 + h4 * 6.28,
        colorIdx: i % STAR_COLORS_LIGHT.length,
        isCross: isBright,
        parallax: isBright ? 0.26 : 0.12 + h3 * 0.12
      });
    }
  };

  const resize = () => {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = width < 768 ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP;
    if (stars.length !== targetCount) {
      initStars(targetCount);
    }
  };

  const render = (timeMs) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const isLight = isLightMode();
    const starPalette = isLight ? STAR_COLORS_LIGHT : STAR_COLORS_DARK;
    const timeSec = (timeMs || performance.now()) * 0.001;
    const scrollShift = scrollY * 0.00035;

    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];

      const sx = st.x * width;
      let sy = (st.y - scrollShift * st.parallax) % 1;
      if (sy < 0) sy += 1;
      sy = sy * height;

      // Parpadeo sinusoidal no sincronizado
      const twinkle = 0.55 + 0.45 * Math.sin(timeSec * st.twinkleSpeed + st.twinklePhase);
      const alpha = Math.min(1, st.baseAlpha * twinkle * (isLight ? 1.25 : 1.12));

      if (alpha < 0.03) continue;

      const color = starPalette[st.colorIdx % starPalette.length];
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;

      const r = isLight ? st.size * 1.15 : st.size;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Destello en cruz de 4 puntas en picos de brillo
      if (st.isCross && twinkle > 0.65) {
        const flare = r * (2.4 + twinkle * 1.8);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.85;
        ctx.globalAlpha = alpha * 0.65;
        ctx.beginPath();
        ctx.moveTo(sx - flare, sy);
        ctx.lineTo(sx + flare, sy);
        ctx.moveTo(sx, sy - flare);
        ctx.lineTo(sx, sy + flare);
        ctx.stroke();
      }
    }

    if (isRunning && !prefersReducedMotion()) {
      animationFrameId = requestAnimationFrame(render);
    }
  };

  const startLoop = () => {
    if (isRunning) return;
    isRunning = true;
    if (prefersReducedMotion()) {
      render(1000);
    } else {
      animationFrameId = requestAnimationFrame(render);
    }
  };

  const stopLoop = () => {
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const setup = () => {
    if (document.getElementById('dojoStarfield')) return;

    // Inyectar nebulosa suave para modo claro
    if (!document.querySelector('.dojo-nebula')) {
      const neb = document.createElement('div');
      neb.className = 'dojo-nebula';
      neb.setAttribute('aria-hidden', 'true');
      document.body.prepend(neb);
    }

    canvas = document.createElement('canvas');
    canvas.id = 'dojoStarfield';
    canvas.className = 'dojo-starfield-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    ctx = canvas.getContext('2d', { alpha: true });

    resize();
    startLoop();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        startLoop();
      }
    });

    // Observar cambio de tema (para actualizar estrellas al instante)
    const observer = new MutationObserver(() => {
      if (prefersReducedMotion()) {
        render(1000);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
