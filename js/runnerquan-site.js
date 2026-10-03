'use strict';

(() => {
  if (window.__RQ_SITE__) {
    window.__RQ_SITE__.initialize();
    return;
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const state = { fields: [], frame: 0, observer: null, sections: null, reticle: null, pointer: null };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function theme() {
    const dark = root.dataset.rqTheme === 'dark';
    document.querySelectorAll('.rq-theme-button').forEach(button => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '切换到日间主题' : '切换到夜间主题');
      button.title = dark ? '日间主题 / Light' : '夜间主题 / Dark';
    });
    // Keep's code blocks and tools also use these variables on inner pages.
    root.style.setProperty('--background-color', dark ? '#000000' : '#f5f2eb');
    root.style.setProperty('--text-color', dark ? '#f3f6fa' : '#27251f');
    root.classList.toggle('dark-mode', dark);
    root.classList.toggle('light-mode', !dark);
    state.fields.forEach(field => { field.palette = null; });
    document.dispatchEvent(new Event('rq:themechange'));
    requestRender();
  }

  function closeMenu() {
    document.querySelectorAll('.rq-menu-open').forEach(nav => nav.classList.remove('rq-menu-open'));
    document.querySelectorAll('.rq-menu-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      const overlay = document.querySelector('.search-pop-overlay.active');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelector('.rq-search-button')?.focus();
      }
    }
    const overlay = document.querySelector('.search-pop-overlay.active');
    if (overlay && event.key === 'Tab') {
      const items = [...overlay.querySelectorAll('input, button, a[href], [tabindex="0"]')];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.matches('.close-popup-btn')) {
      event.preventDefault();
      document.activeElement.click();
    }
  }

  function onClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('.rq-theme-button, .rq-menu-button, .rq-search-button');
    if (button?.classList.contains('rq-search-button')) {
      if (!document.querySelector('.search-pop-overlay')) window.location.assign(button.dataset.searchUrl);
      else queueMicrotask(() => document.querySelector('.search-pop-overlay.active .search-input')?.focus());
      return;
    }
    if (button?.classList.contains('rq-theme-button')) {
      const value = root.dataset.rqTheme === 'dark' ? 'light' : 'dark';
      root.dataset.rqTheme = value;
      try { localStorage.setItem('rq-theme-space', value); } catch (_) { /* Storage is optional. */ }
      theme();
      return;
    }
    if (button?.classList.contains('rq-menu-button')) {
      const open = button.closest('.rq-nav').classList.toggle('rq-menu-open');
      button.setAttribute('aria-expanded', String(open));
      return;
    }
    if (event.target.closest('.close-popup-btn')) queueMicrotask(() => document.querySelector('.rq-search-button')?.focus());
    if (event.target.closest('.rq-nav nav a') || !event.target.closest('.rq-nav')) closeMenu();
  }

  // The reticle takes the latest pointer coordinates synchronously. No easing,
  // queued frame, geometry read, or canvas work is part of its critical path.
  function moveReticle(event) {
    if (!state.reticle || !fine.matches || reduced.matches || event.pointerType === 'touch') return;
    const samples = event.getCoalescedEvents?.();
    const point = samples?.length ? samples[samples.length - 1] : event;
    state.reticle.style.transform = `translate3d(${point.clientX - 12}px,${point.clientY - 12}px,0)`;
    state.reticle.classList.add('is-visible');
    state.pointer = [point.clientX, point.clientY];
    if (state.fields.some(field => field.visible)) requestRender();
  }

  function hideReticle() {
    state.reticle?.classList.remove('is-visible', 'is-target');
    state.pointer = null;
  }

  function targetReticle(event) {
    if (!state.reticle || !(event.target instanceof Element)) return;
    state.reticle.classList.toggle('is-target', Boolean(event.target.closest('a, button, input, textarea, select')));
  }

  function configureReticle() {
    if (!fine.matches || reduced.matches) {
      state.reticle?.remove();
      state.reticle = null;
      return;
    }
    state.reticle = document.querySelector('.rq-reticle');
    if (!state.reticle) {
      state.reticle = document.createElement('div');
      state.reticle.className = 'rq-reticle';
      state.reticle.setAttribute('aria-hidden', 'true');
      document.body.append(state.reticle);
    }
    if (!state.pointerBound) {
      document.addEventListener('pointermove', moveReticle, { passive: true });
      document.addEventListener('pointerover', targetReticle, { passive: true });
      state.pointerBound = true;
    }
  }

  function reveal() {
    state.sections?.disconnect();
    const nodes = document.querySelectorAll('.rq-project-card, .rq-project-showcase, .rq-orbit-story-copy, .rq-blog-row');
    if (reduced.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(node => node.classList.add('is-visible'));
      return;
    }
    state.sections = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        state.sections.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px 40px', threshold: .04 });
    for (const node of nodes) {
      // First-view content is always readable before JavaScript initializes.
      if (node.getBoundingClientRect().top < innerHeight) node.classList.add('is-visible');
      else node.classList.add('rq-reveal-pending');
      state.sections.observe(node);
    }
  }

  function createField(host, type) {
    let canvas = host.querySelector('.rq-ascii-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'rq-ascii-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      host.append(canvas);
    }
    const context = canvas.getContext('2d', { alpha: true });
    return { host, canvas, context, type, glyphs: [], width: 0, height: 0, visible: true, phase: -1, palette: null, pointerX: -1, pointerY: -1 };
  }

  function cacheGlyphs(field, width, height) {
    const step = width < 380 ? 7 : 8;
    const cx = width * .5;
    const cy = height * .5;
    const radius = Math.min(width * .36, height * .35);
    const glyphs = ' .:+*#%@';
    field.glyphs = [];
    for (let row = 0; row < height / step; row++) {
      const y = row * step;
      for (let col = 0; col < width / step; col++) {
        const x = col * step;
        const dx = (x - cx) / radius;
        const dy = (y - cy) / radius;
        const r = Math.hypot(dx, dy);
        let strength = 0;
        if (field.type === 'system') {
          const spiral = Math.sin(Math.atan2(dy, dx) * 3 + r * 13);
          strength = Math.exp(-Math.pow((r - .84 - spiral * .18) * 6, 2)) * .72;
        } else {
          if (r < 1) {
            const z = Math.sqrt(1 - r * r);
            const light = clamp((-dx * .42 - dy * .48 + z * .72), .1, 1);
            const texture = Math.sin(dx * 18 + Math.sin(dy * 11) * 3) * Math.cos(dy * 21 + dx * 9);
            strength = light * (.5 + texture * .22);
          }
          // Tilted elliptical orbit lines give the field an original orbital silhouette.
          const a = dx * .92 + dy * .4;
          const b = -dx * .4 + dy * .92;
          const ring = Math.hypot(a / 1.45, b / .43);
          if (Math.abs(ring - 1) < .035 && (r > 1 || b > 0)) strength = .6;
          const outer = Math.hypot(dx / 1.7, dy / 1.3);
          if (Math.abs(outer - 1) < .022 && (row + col) % 4 === 0) strength = .24;
        }
        const noise = ((row * 17 + col * 31) % 29) / 29;
        if (strength < .12 || noise < .065) continue;
        field.glyphs.push({ x, y, char: glyphs[Math.min(7, Math.max(1, Math.floor(strength * 9)))], alpha: clamp(strength * .92, .16, .82) });
      }
    }
    field.context.font = '8px Consolas, monospace';
    field.context.textBaseline = 'middle';
  }

  function draw(field) {
    if (!field.visible || !field.context) return;
    const rect = field.host.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (!width || !height) return;
    const changed = width !== field.width || height !== field.height;
    if (changed) {
      field.width = width;
      field.height = height;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      field.canvas.width = Math.round(width * dpr);
      field.canvas.height = Math.round(height * dpr);
      field.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      cacheGlyphs(field, width, height);
    }
    // Scroll shifts the cached diagram slightly; it never recomputes the field.
    const phase = reduced.matches ? 0 : Math.round(clamp((innerHeight * .5 - rect.top - height * .5) / innerHeight, -1, 1) * 12);
    const inside = !reduced.matches && state.pointer && state.pointer[0] >= rect.left && state.pointer[0] <= rect.right && state.pointer[1] >= rect.top && state.pointer[1] <= rect.bottom;
    const pointerX = inside ? Math.round((state.pointer[0] - rect.left) / 12) * 12 : -1;
    const pointerY = inside ? Math.round((state.pointer[1] - rect.top) / 12) * 12 : -1;
    if (!changed && field.palette && phase === field.phase && pointerX === field.pointerX && pointerY === field.pointerY) return;
    field.phase = phase;
    field.pointerX = pointerX;
    field.pointerY = pointerY;
    field.palette = getComputedStyle(field.host).color;
    const ctx = field.context;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = field.palette;
    for (const glyph of field.glyphs) {
      const distance = inside ? Math.hypot(glyph.x - pointerX, glyph.y - pointerY) : 1000;
      ctx.globalAlpha = clamp(glyph.alpha + Math.max(0, 1 - distance / 90) * .3, 0, 1);
      ctx.fillText(glyph.char, glyph.x + phase * .35, glyph.y + phase * .6);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    state.frame = 0;
    if (document.hidden) return;
    state.fields.forEach(draw);
    const progress = document.querySelector('.rq-reading-progress');
    if (progress) {
      const range = Math.max(1, root.scrollHeight - innerHeight);
      progress.style.setProperty('--rq-progress', String(clamp(scrollY / range, 0, 1)));
    }
  }

  function requestRender() {
    if (!state.frame && !document.hidden) state.frame = requestAnimationFrame(render);
  }

  function initialize() {
    state.observer?.disconnect();
    state.fields = [...document.querySelectorAll('[data-rq-field]')].map(host => createField(host, host.dataset.rqField));
    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const field = state.fields.find(item => item.host === entry.target);
          if (field) field.visible = entry.isIntersecting;
        }
        requestRender();
      }, { rootMargin: '60px' });
      state.fields.forEach(field => state.observer.observe(field.host));
    }
    configureReticle();
    reveal();
    // Original effects create stacking contexts around article content. Keep the
    // search dialog at the body level so it can cover the header and mobile menu.
    const overlay = document.querySelector('.search-pop-overlay');
    if (overlay && overlay.parentElement !== document.body) document.body.append(overlay);
    state.searchVisibility?.disconnect();
    if (overlay && 'MutationObserver' in window) {
      let wasOpen = false;
      const synchronizeDialog = () => {
        const open = overlay.classList.contains('active');
        overlay.toggleAttribute('inert', !open);
        overlay.setAttribute('aria-hidden', String(!open));
        if (open !== wasOpen) {
          wasOpen = open;
          (open ? overlay.querySelector('.search-input') : document.querySelector('.rq-search-button'))?.focus();
        }
      };
      state.searchVisibility = new MutationObserver(synchronizeDialog);
      state.searchVisibility.observe(overlay, { attributes: true, attributeFilter: ['class'] });
      synchronizeDialog();
    }
    const dialog = document.querySelector('.search-popup');
    state.searchObserver?.disconnect();
    if (dialog) {
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', '搜索文章');
      const close = dialog.querySelector('.close-popup-btn');
      close?.setAttribute('role', 'button');
      close?.setAttribute('tabindex', '0');
      close?.setAttribute('aria-label', '关闭搜索');
      dialog.querySelector('.search-input')?.setAttribute('aria-label', '搜索关键词');
      const result = dialog.querySelector('#search-result');
      if (result && 'MutationObserver' in window) {
        const describeEmptyResult = () => {
          const empty = result.querySelector('#no-result');
          if (!empty || empty.querySelector('.rq-search-empty')) return;
          const message = document.createElement('p');
          message.className = 'rq-search-empty';
          message.textContent = dialog.querySelector('.search-input')?.value.trim() ? '没有找到相关文章，试试更短的关键词。' : '输入关键词，搜索文章标题和内容。';
          empty.setAttribute('role', 'status');
          empty.append(message);
        };
        state.searchObserver = new MutationObserver(describeEmptyResult);
        state.searchObserver.observe(result, { childList: true, subtree: true });
        describeEmptyResult();
      }
    }
    if (document.querySelector('.post-content') && !document.querySelector('.rq-reading-progress')) {
      const progress = document.createElement('div');
      progress.className = 'rq-reading-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.append(progress);
    }
    theme();
    requestRender();
  }

  window.__RQ_SITE__ = { initialize };
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  // Only bind pointer work on devices that actually use it.
  document.documentElement.addEventListener('mouseleave', hideReticle);
  window.addEventListener('blur', hideReticle);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  document.addEventListener('visibilitychange', () => {
    hideReticle();
    root.classList.toggle('rq-page-hidden', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    } else requestRender();
  });
  fine.addEventListener('change', configureReticle);
  reduced.addEventListener('change', () => { configureReticle(); reveal(); requestRender(); });
  // These listeners are installed once; observers are replaced when PJAX loads a page.
  document.addEventListener('pjax:complete', initialize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  const openRequestedSearch = () => {
    theme();
    if (new URL(document.URL).searchParams.get('search') === '1' && document.querySelector('.search-pop-overlay')) {
      requestAnimationFrame(() => document.querySelector('.rq-search-button')?.click());
    }
  };
  // Keep initializes on window's DOMContentLoaded. This script is injected last:
  // using the same target lets Keep finish before we synchronize theme/search.
  // A document listener would run before Keep and have its theme overwritten.
  window.addEventListener('DOMContentLoaded', openRequestedSearch, { once: true });
  if (document.readyState === 'complete') openRequestedSearch();
})();
