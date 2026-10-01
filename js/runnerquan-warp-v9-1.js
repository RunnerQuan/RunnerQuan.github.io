'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const state = window.__RQ_WARP_V9__ || {
    bound: false,
    canvas: null,
    context: null,
    stars: [],
    rings: [],
    frame: 0,
    lastFrame: 0,
    lastScrollY: window.scrollY,
    lastScrollAt: performance.now(),
    velocity: 0,
    energy: 0,
    direction: 1,
    scrollProgress: 0,
    pointerX: 0.5,
    pointerY: 0.48,
    centerX: 0.5,
    centerY: 0.48,
    hud: null,
    meter: null,
    edge: null,
    lastHudAt: 0,
    width: 0,
    height: 0,
    dpr: 1,
    hidden: document.hidden
  };

  window.__RQ_WARP_V9__ = state;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (from, to, amount) => from + (to - from) * amount;

  function randomStar(index, count) {
    const goldenAngle = 2.399963229728653;
    return {
      angle: index * goldenAngle + Math.random() * 0.28,
      depth: Math.random(),
      offset: Math.random() * Math.PI * 2,
      weight: 0.34 + Math.random() * 1.18,
      alpha: 0.2 + Math.random() * 0.68,
      lane: (index % Math.max(1, Math.floor(count / 9))) / Math.max(1, Math.floor(count / 9))
    };
  }

  function starCount() {
    if (coarsePointer.matches || window.innerWidth < 760) return 82;
    if (window.innerWidth < 1180) return 148;
    return 224;
  }

  function seedField() {
    const count = starCount();
    state.stars = Array.from({ length: count }, (_, index) => randomStar(index, count));
    state.rings = Array.from({ length: coarsePointer.matches ? 3 : 5 }, (_, index) => ({
      depth: (index + 1) / 6,
      offset: index * 0.7
    }));
  }

  function ensureCanvas() {
    let canvas = document.querySelector('.rq-warp-field');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'rq-warp-field';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    state.canvas = canvas;
    state.context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    resize();
  }

  function ensureMeter() {
    state.hud = document.querySelector('.rq-tactical-hud');
    const data = document.querySelector('.rq-hud-data');
    if (data && !data.querySelector('.rq-warp-meter')) {
      const meter = document.createElement('span');
      meter.className = 'rq-warp-meter';
      meter.innerHTML = '<b>WARP</b><em data-rq-warp-meter>0.00c</em>';
      data.prepend(meter);
    }
    state.meter = document.querySelector('[data-rq-warp-meter]');
  }

  function ensureEdge() {
    state.edge = document.querySelector('.rq-warp-edge');
    if (!state.edge) {
      state.edge = document.createElement('div');
      state.edge.className = 'rq-warp-edge';
      state.edge.setAttribute('aria-hidden', 'true');
      document.body.prepend(state.edge);
    }
  }

  function resize() {
    if (!state.canvas || !state.context) return;

    state.width = window.innerWidth;
    state.height = window.innerHeight;
    // Decorative trails do not need a full retina-sized viewport buffer.
    const pixelBudget = Math.sqrt(1990000 / Math.max(1, state.width * state.height));
    state.dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.15 : 1.3, pixelBudget);
    state.canvas.width = Math.round(state.width * state.dpr);
    state.canvas.height = Math.round(state.height * state.dpr);
    state.canvas.style.width = `${state.width}px`;
    state.canvas.style.height = `${state.height}px`;
    state.context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    seedField();
  }

  function onScroll() {
    const now = performance.now();
    const elapsed = clamp(now - state.lastScrollAt, 12, 64);
    const delta = window.scrollY - state.lastScrollY;
    const impulse = clamp(delta / elapsed, -4.5, 4.5);

    state.velocity = mix(state.velocity, impulse, 0.72);
    state.direction = Math.abs(delta) > 0.5 ? Math.sign(delta) : state.direction;
    state.lastScrollY = window.scrollY;
    state.lastScrollAt = now;

    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.scrollProgress = clamp(window.scrollY / scrollable, 0, 1);
  }

  function onPointerMove(event) {
    if (coarsePointer.matches) return;
    state.pointerX = clamp(event.clientX / Math.max(1, state.width), 0.25, 0.75);
    state.pointerY = clamp(event.clientY / Math.max(1, state.height), 0.28, 0.72);
  }

  function project(depth, angle, maxRadius, twist) {
    const travel = 1 - depth;
    const radius = Math.pow(travel, 1.82) * maxRadius;
    const curvedAngle = angle + travel * twist;
    return {
      x: Math.cos(curvedAngle) * radius,
      y: Math.sin(curvedAngle) * radius * 0.72
    };
  }

  function drawRings(ctx, centerX, centerY, maxRadius, dt, ink) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.lineWidth = 0.7;

    state.rings.forEach((ring, index) => {
      const ringSpeed = 0.00001 + state.energy * 0.000052 * state.direction;
      ring.depth -= dt * ringSpeed;
      if (ring.depth <= 0) ring.depth = 1;
      if (ring.depth > 1) ring.depth = 0.012;

      const travel = 1 - ring.depth;
      const radius = Math.pow(travel, 1.74) * maxRadius;
      if (radius < 5) return;

      ctx.beginPath();
      ctx.setLineDash([Math.max(3, radius * 0.026), Math.max(8, radius * 0.074)]);
      ctx.lineDashOffset = state.scrollProgress * 180 * state.direction + ring.offset * 32;
      ctx.ellipse(0, 0, radius, radius * 0.72, state.scrollProgress * 0.36, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ink},${0.025 + state.energy * 0.105 + index * 0.006})`;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFrame(now) {
    state.frame = 0;
    if (state.hidden || reducedMotion.matches || !state.context || !state.canvas) return;
    state.frame = window.requestAnimationFrame(drawFrame);

    const minFrame = coarsePointer.matches ? 32 : 15;
    if (now - state.lastFrame < minFrame) return;
    const dt = clamp(now - (state.lastFrame || now), 8, 34);
    state.lastFrame = now;

    const timeSinceScroll = now - state.lastScrollAt;
    if (timeSinceScroll > 48) state.velocity *= Math.pow(0.9, dt / 16.67);
    const targetEnergy = clamp(Math.abs(state.velocity) / 3.2, 0, 1);
    state.energy = mix(state.energy, targetEnergy, targetEnergy > state.energy ? 0.2 : 0.065);

    const ctx = state.context;
    const width = state.width;
    const height = state.height;
    // Ease the origin itself: raw pointer samples must not teleport all trails.
    const pointerBlend = 1 - Math.exp(-dt / 100);
    state.centerX = mix(state.centerX, state.pointerX, pointerBlend);
    state.centerY = mix(state.centerY, state.pointerY, pointerBlend);
    const centerX = width * mix(0.5, state.centerX, 0.36);
    const centerY = height * mix(0.48, state.centerY, 0.22);
    const maxRadius = Math.hypot(width, height) * 0.72;
    const speed = 0.000015 + state.energy * 0.000115 * state.direction;
    const twist = state.direction * (0.52 + state.energy * 2.6) + state.scrollProgress * Math.PI * 1.6;

    ctx.clearRect(0, 0, width, height);

    const horizon = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.28);
    const light = document.documentElement.dataset.rqTheme === 'light';
    const ink = light ? '139,106,69' : '143,231,255';
    horizon.addColorStop(0, `rgba(${ink},${0.055 + state.energy * 0.06})`);
    horizon.addColorStop(0.08, `rgba(${ink},${0.015 + state.energy * 0.035})`);
    horizon.addColorStop(0.62, `rgba(${ink},0.006)`);
    horizon.addColorStop(1, `rgba(${ink},0)`);
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, width, height);

    drawRings(ctx, centerX, centerY, maxRadius, dt, ink);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.lineCap = 'round';

    state.stars.forEach((star) => {
      const previousDepth = star.depth;
      star.depth -= dt * speed * (0.72 + star.weight * 0.38);
      if (star.depth <= 0.012) {
        star.depth = 1;
        star.angle += 0.31;
      }
      if (star.depth > 1) {
        star.depth = 0.012;
        star.angle -= 0.31;
      }

      const current = project(star.depth, star.angle + star.offset * 0.04, maxRadius, twist);
      const trailDepth = clamp(star.depth + 0.004 + state.energy * (0.018 + star.weight * 0.016), 0, 1);
      const previous = project(Math.max(previousDepth, trailDepth), star.angle + star.offset * 0.04, maxRadius, twist);
      const travel = 1 - star.depth;
      const alpha = star.alpha * (0.08 + travel * 0.34 + state.energy * 0.52);

      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(current.x, current.y);
      ctx.strokeStyle = `rgba(${light ? ink : star.lane > 0.72 ? '232,251,255' : ink},${clamp(alpha, 0, 0.86)})`;
      ctx.lineWidth = Math.min(2.2, 0.28 + travel * star.weight + state.energy * 0.48);
      ctx.stroke();
    });

    ctx.restore();

    // Keep inherited variables out of the document root. The edge has a static
    // painted glow; only its compositor opacity changes while stars are moving.
    if (state.edge) state.edge.style.opacity = String(state.energy * 0.34);
    if (now - state.lastHudAt >= 100) {
      state.lastHudAt = now;
      const energy = state.energy.toFixed(2);
      if (state.hud && state.hudEnergy !== energy) {
        state.hud.style.setProperty('--rq-warp-energy', energy);
        state.hudEnergy = energy;
      }
      const reading = `${(state.energy * 0.92).toFixed(2)}c`;
      if (state.meter && state.meter.textContent !== reading) state.meter.textContent = reading;
    }
  }

  function onVisibilityChange() {
    state.hidden = document.hidden;
    if (state.hidden) {
      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    } else if (!reducedMotion.matches && state.context && !state.frame) {
      state.lastFrame = performance.now();
      state.frame = window.requestAnimationFrame(drawFrame);
    }
  }

  function bindEvents() {
    if (state.bound) return;
    state.bound = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('pjax:complete', initWarp);
    document.addEventListener('pjax:success', initWarp);
  }

  function initWarp() {
    document.documentElement.classList.add('rq-interface-v9');
    ensureMeter();
    bindEvents();
    onScroll();

    if (reducedMotion.matches) {
      document.querySelector('.rq-warp-field')?.remove();
      return;
    }

    ensureCanvas();
    ensureEdge();
    if (!state.frame) state.frame = window.requestAnimationFrame(drawFrame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWarp, { once: true });
  } else {
    initWarp();
  }
})();
