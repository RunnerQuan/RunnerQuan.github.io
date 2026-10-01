'use strict';

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = ' .·:+*#%@';
  const state = window.__RQ_SIGNAL_V11__ || { bound: false, frame: 0, fields: [] };
  window.__RQ_SIGNAL_V11__ = state;

  function draw(field) {
    const { canvas, host, type } = field;
    const rect = host.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
    const width = Math.round(host.clientWidth);
    const height = Math.round(host.clientHeight);
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * scale);
    const pixelHeight = Math.round(height * scale);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const step = width < 700 ? 13 : 15;
    const cols = Math.ceil(width / step);
    const rows = Math.ceil(height / step);
    const phase = reduced.matches ? 0 : Math.max(-1, Math.min(1, (innerHeight * .5 - (rect.top + rect.height * .5)) / innerHeight));
    const cx = type === 'mission' ? width * .39 : width * .31;
    const cy = height * .49;
    const radius = Math.min(width * .31, height * .42);
    if (field.cacheWidth !== width || field.cacheHeight !== height) {
      field.cacheWidth = width;
      field.cacheHeight = height;
      field.samples = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if ((col + row * 3) % 11 === 0) continue;
          const x = (col + .5) * step;
          const y = (row + .5) * step;
          const dx = (x - cx) / radius;
          const dy = (y - cy) / radius;
          field.samples.push({ x, y, r: Math.hypot(dx, dy), theta: Math.atan2(dy, dx), noise: Math.sin(col * 17.17 + row * 41.91) * Math.cos(col * 7.11 - row * 13.63) });
        }
      }
    }
    ctx.font = `${Math.max(9, step - 3)}px monospace`;
    ctx.textBaseline = 'middle';
    const channels = document.documentElement.dataset.rqTheme === 'light' ? '136,100,64' : '143,231,255';
    for (const { x, y, r, theta, noise } of field.samples) {
        const spiral = Math.sin(theta * (type === 'mission' ? 3 : 5) + r * 17 - phase * 3.4);
        const band = Math.exp(-Math.pow((r - .72 - spiral * .105) * 6, 2));
        const core = Math.exp(-Math.pow(r * 2.5, 2)) * .28;
        const strength = Math.max(0, band * (.62 + noise * .22) + core);
        if (strength < .13) continue;
        const index = Math.min(glyphs.length - 1, Math.floor(strength * (glyphs.length - 1)));
        ctx.fillStyle = `rgba(${channels},${Math.min(.64, strength * .56).toFixed(2)})`;
        ctx.fillText(glyphs[index], x, y);
    }
  }

  function render() {
    state.frame = 0;
    state.fields.forEach(draw);
  }

  function requestRender() {
    if (!state.frame && !document.hidden) state.frame = requestAnimationFrame(render);
  }

  function initialize() {
    state.fields = [];
    document.querySelectorAll('.rq-orbit-mission, .rq-orbit-story[data-orbit-section="system"]').forEach((host) => {
      let canvas = host.querySelector(':scope > .rq-signal-field');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'rq-signal-field';
        canvas.setAttribute('aria-hidden', 'true');
        host.prepend(canvas);
      }
      state.fields.push({ canvas, host, type: host.classList.contains('rq-orbit-mission') ? 'mission' : 'system' });
    });
    requestRender();
    if (state.bound) return;
    state.bound = true;
    addEventListener('scroll', requestRender, { passive: true });
    addEventListener('resize', requestRender, { passive: true });
    document.addEventListener('rq:themechange', requestRender);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(state.frame); state.frame = 0; }
      else requestRender();
    });
    document.addEventListener('pjax:complete', initialize);
    document.addEventListener('pjax:success', initialize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
