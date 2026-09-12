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
    const data = document.querySelector('.rq-hud-data');
    if (!data || data.querySelector('.rq-warp-meter')) return;

    const meter = document.createElement('span');
    meter.className = 'rq-warp-meter';
    meter.innerHTML = '<b>WARP</b><em data-rq-warp-meter>0.00c</em>';
    data.prepend(meter);
  }

  function resize() {
    if (!state.canvas || !state.context) return;

    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.15 : 1.6);
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

  function drawRings(ctx, centerX, centerY, maxRadius, dt) {
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
      ctx.strokeStyle = `rgba(143,231,255,${0.025 + state.energy * 0.105 + index * 0.006})`;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFrame(now) {
    state.frame = window.requestAnimationFrame(drawFrame);
    if (state.hidden || !state.context || !state.canvas) return;

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
    const centerX = width * mix(0.5, state.pointerX, 0.36);
    const centerY = height * mix(0.48, state.pointerY, 0.22);
    const maxRadius = Math.hypot(width, height) * 0.72;
    const speed = 0.000015 + state.energy * 0.000115 * state.direction;
    const twist = state.direction * (0.52 + state.energy * 2.6) + state.scrollProgress * Math.PI * 1.6;

    ctx.clearRect(0, 0, width, height);

    const horizon = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.28);
    horizon.addColorStop(0, `rgba(143,231,255,${0.055 + state.energy * 0.06})`);
    horizon.addColorStop(0.08, `rgba(143,231,255,${0.015 + state.energy * 0.035})`);
    horizon.addColorStop(0.62, 'rgba(143,231,255,0.006)');
    horizon.addColorStop(1, 'rgba(143,231,255,0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, width, height);

    drawRings(ctx, centerX, centerY, maxRadius, dt);

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
      ctx.strokeStyle = `rgba(${star.lane > 0.72 ? '232,251,255' : '143,231,255'},${clamp(alpha, 0, 0.86)})`;
      ctx.lineWidth = Math.min(2.2, 0.28 + travel * star.weight + state.energy * 0.48);
      ctx.stroke();
    });

    ctx.restore();

    document.documentElement.style.setProperty('--rq-warp-energy', state.energy.toFixed(3));
    document.documentElement.style.setProperty('--rq-warp-direction', String(state.direction));
    document.documentElement.style.setProperty('--rq-warp-x', `${(centerX / width * 100).toFixed(2)}%`);
    document.documentElement.style.setProperty('--rq-warp-y', `${(centerY / height * 100).toFixed(2)}%`);

    const meter = document.querySelector('[data-rq-warp-meter]');
    if (meter) meter.textContent = `${(state.energy * 0.92).toFixed(2)}c`;
  }

  function onVisibilityChange() {
    state.hidden = document.hidden;
    if (!state.hidden) state.lastFrame = performance.now();
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
    if (!state.frame) state.frame = window.requestAnimationFrame(drawFrame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWarp, { once: true });
  } else {
    initWarp();
  }
})();
