/* One owner for wheel, keyboard and section links. Geometry changes only on
   resize/content changes; wheel momentum cannot start a second transition. */
(function (scope) {
  'use strict';
  function createController(win, doc) {
    const desktop = win.matchMedia('(min-width: 981px) and (hover: hover) and (pointer: fine)');
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    const root = doc.documentElement;
    const home = doc.body.classList.contains('rq-home-page');
    const projects = doc.body.classList.contains('rq-projects-page');
    if (!home && !projects) return null;
    const nodes = [...doc.querySelectorAll(home ? 'main [data-orbit-section]' : '.rq-projects-hero, .rq-project-showcase[id], .rq-project-atlas')];
    if (!nodes.length) return null;
    let entries = [], active = -1, frame = 0, syncFrame = 0, measureFrame = 0;
    let lastWheel = -Infinity, consumed = false, accumulated = 0, direction = 0;
    let running = false;
    const cleanups = [];
    const on = (target, name, callback, options) => {
      target.addEventListener(name, callback, options);
      cleanups.push(() => target.removeEventListener(name, callback, options));
    };
    const topOf = node => {
      let top = 0;
      for (let current = node; current; current = current.offsetParent) top += current.offsetTop;
      return top;
    };
    const maxScroll = () => Math.max(0, root.scrollHeight - win.innerHeight);
    const setActive = index => {
      if (index === active) return;
      active = index;
      const id = entries[index]?.node.id;
      nodes.forEach((node, i) => { if (home) node.classList.toggle('is-active-panel', i === index); });
      doc.querySelectorAll('.rq-orbit-progress a, .rq-project-index a').forEach(link => {
        const current = link.getAttribute('href') === `#${id}`;
        link.classList.toggle(home ? 'is-active' : 'is-current', current);
        if (current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    function currentIndex(y = win.scrollY) {
      // Keep oversized panels readable before considering the next heading.
      const inside = entries.findIndex(e => y >= e.top - 2 && y <= e.end + 2);
      if (inside >= 0) return inside;
      let nearest = 0;
      entries.forEach((entry, i) => { if (Math.abs(entry.top - y) < Math.abs(entries[nearest].top - y)) nearest = i; });
      return nearest;
    }
    function sync() { syncFrame = 0; if (!running) setActive(currentIndex()); }
    function queueSync() { if (!syncFrame && !doc.hidden) syncFrame = win.requestAnimationFrame(sync); }
    function measure() {
      measureFrame = 0;
      entries = nodes.map(node => {
        const offset = home ? 0 : parseFloat(win.getComputedStyle(node).scrollMarginTop) || 104;
        const top = Math.max(0, Math.min(maxScroll(), topOf(node) - offset));
        return { node, top, end: Math.max(top, Math.min(maxScroll(), topOf(node) + node.offsetHeight - win.innerHeight + (home ? 0 : 48))) };
      });
      root.classList.toggle('rq-section-scroll', desktop.matches);
      sync();
    }
    function requestMeasure() {
      if (!measureFrame && !doc.hidden) measureFrame = win.requestAnimationFrame(measure);
    }
    function cancel() {
      win.cancelAnimationFrame(frame); frame = 0; running = false;
      root.classList.remove('rq-scroll-moving');
    }
    function go(index, instant = false) {
      if (!entries[index]) return;
      cancel();
      const from = win.scrollY, to = entries[index].top;
      setActive(index);
      if (instant || reduced.matches || Math.abs(to - from) < 2) {
        win.scrollTo({ top: to, behavior: 'instant' }); return;
      }
      const start = win.performance.now();
      const duration = Math.min(680, Math.max(380, Math.abs(to - from) * .32));
      running = true;
      root.classList.add('rq-scroll-moving');
      function animate(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        win.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
        if (progress < 1) frame = win.requestAnimationFrame(animate);
        else { frame = 0; running = false; root.classList.remove('rq-scroll-moving'); sync(); }
      }
      frame = win.requestAnimationFrame(animate);
    }
    function blocked(event) {
      return event.defaultPrevented || event.ctrlKey || event.metaKey || doc.hidden ||
        doc.querySelector('dialog[open], .search-popup.active, .search-pop-overlay.active') ||
        event.target?.closest?.('input, textarea, select, [contenteditable="true"], [role="slider"]');
    }
    function nestedScroll(event, delta) {
      for (let node = event.target; node && node !== doc.body; node = node.parentElement) {
        if (node.scrollHeight <= node.clientHeight + 2) continue;
        if (!/auto|scroll/.test(win.getComputedStyle(node).overflowY)) continue;
        if (delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 2 : node.scrollTop > 2) return true;
      }
      return false;
    }
    function next(delta) {
      const index = currentIndex(), entry = entries[index], y = win.scrollY;
      if (delta > 0 && y < entry.top - 2) return index;
      if (delta > 0 && y < entry.end - 2) return null;
      if (delta < 0 && y > entry.top + 2 && y <= entry.end + 2) return null;
      const target = index + Math.sign(delta);
      return target >= 0 && target < entries.length ? target : null;
    }
    function wheel(event) {
      if (!desktop.matches || blocked(event) || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? win.innerHeight : 1);
      if (nestedScroll(event, delta)) return;
      const now = win.performance.now();
      if (now - lastWheel > 170) { consumed = false; accumulated = 0; }
      lastWheel = now;
      if (running || consumed) { event.preventDefault(); return; }
      const target = next(delta);
      if (target === null) return;
      event.preventDefault();
      if (direction !== Math.sign(delta)) accumulated = 0;
      direction = Math.sign(delta); accumulated += Math.abs(delta);
      if (accumulated < 18) return;
      consumed = true; accumulated = 0; go(target);
    }
    function click(event) {
      if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target?.closest?.('a[href^="#"]');
      if (!link) return;
      const index = entries.findIndex(e => `#${e.node.id}` === link.getAttribute('href'));
      if (index < 0) return;
      event.preventDefault();
      win.history.pushState(null, '', link.getAttribute('href'));
      go(index);
    }
    function key(event) {
      if (!desktop.matches || blocked(event) || event.altKey || event.shiftKey || event.target?.closest?.('button, a, [role="button"]')) return;
      const delta = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[event.key];
      if (delta) {
        if (running) { event.preventDefault(); return; }
        const index = next(delta);
        if (index !== null) { event.preventDefault(); go(index); }
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); go(event.key === 'Home' ? 0 : entries.length - 1);
      }
    }
    on(win, 'wheel', wheel, { passive: false });
    on(doc, 'click', click);
    on(doc, 'keydown', key);
    on(win, 'scroll', queueSync, { passive: true });
    on(win, 'resize', () => { cancel(); requestMeasure(); }, { passive: true });
    on(win, 'touchstart', cancel, { passive: true });
    on(doc, 'visibilitychange', () => {
      if (doc.hidden) { cancel(); win.cancelAnimationFrame(syncFrame); syncFrame = 0; win.cancelAnimationFrame(measureFrame); measureFrame = 0; }
      else requestMeasure();
    });
    on(doc, 'rq:themechange', requestMeasure);
    if (doc.fonts?.addEventListener) on(doc.fonts, 'loadingdone', requestMeasure);
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(requestMeasure);
      nodes.forEach(node => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    }
    measure();
    const hashIndex = entries.findIndex(e => `#${e.node.id}` === win.location.hash);
    if (hashIndex >= 0) go(hashIndex, true);
    return { go, measure, destroy() { cancel(); win.cancelAnimationFrame(syncFrame); win.cancelAnimationFrame(measureFrame); cleanups.forEach(clean => clean()); root.classList.remove('rq-section-scroll'); } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createController };
  if (!scope.document) return;
  function initialize() {
    scope.__RQ_SCROLL__?.destroy();
    scope.__RQ_SCROLL__ = createController(scope, scope.document);
  }
  if (scope.document.readyState === 'loading') scope.document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  scope.document.addEventListener('pjax:complete', initialize);
  scope.addEventListener('pagehide', () => scope.__RQ_SCROLL__?.destroy());
  scope.addEventListener('pageshow', event => { if (event.persisted) initialize(); });
})(typeof window !== 'undefined' ? window : {});
