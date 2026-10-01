'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const state = window.__RQ_DYNAMICS_V10__ || {
    bound: false,
    frame: 0,
    lastScrollY: window.scrollY,
    lastScrollAt: performance.now(),
    speed: 0,
    progress: 0,
    revealObserver: null,
    sectionObserver: null,
    path: null,
    tracer: null,
    pathLength: 0,
    scan: null,
    focusFrame: 0,
    focusSample: null,
    parallaxNodes: []
  };

  window.__RQ_DYNAMICS_V10__ = state;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function makeElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function shouldRunBoot() {
    if (reducedMotion.matches) return false;
    try {
      if (sessionStorage.getItem('rq-v10-booted')) return false;
      sessionStorage.setItem('rq-v10-booted', '1');
      return true;
    } catch (_) {
      return true;
    }
  }

  function runBootSequence() {
    if (!shouldRunBoot() || document.querySelector('.rq-boot-sequence')) return;

    const boot = makeElement('div', 'rq-boot-sequence', { 'aria-hidden': 'true' });
    boot.innerHTML = `
      <i class="rq-boot-blade"></i><i class="rq-boot-blade"></i>
      <i class="rq-boot-blade"></i><i class="rq-boot-blade"></i>
      <span class="rq-boot-core"><b>RQ // NAV CORE</b>CALIBRATING TRAJECTORY</span>`;
    document.body.append(boot);

    requestAnimationFrame(() => requestAnimationFrame(() => boot.classList.add('is-launching')));
    window.setTimeout(() => boot.remove(), 650);
  }

  function createSvgElement(name, attributes = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function ensureHyperlane() {
    let svg = document.querySelector('.rq-hyperlane');
    if (!svg) {
      svg = createSvgElement('svg', {
        class: 'rq-hyperlane',
        viewBox: '0 0 1000 1000',
        preserveAspectRatio: 'none',
        'aria-hidden': 'true'
      });

      const route = 'M -80 820 C 160 650 300 235 515 420 S 820 790 1080 210';
      const base = createSvgElement('path', { class: 'rq-hyperlane-base', d: route });
      const progress = createSvgElement('path', {
        class: 'rq-hyperlane-progress',
        d: route,
        pathLength: '1'
      });
      const tracer = createSvgElement('circle', { class: 'rq-hyperlane-node', r: '3.4', cx: '-80', cy: '820' });
      svg.append(base, progress, tracer);
      document.body.prepend(svg);
    }

    state.path = svg.querySelector('.rq-hyperlane-progress');
    state.tracer = svg.querySelector('.rq-hyperlane-node');
    state.pathLength = state.path?.getTotalLength() || 0;
  }

  function ensurePhaseScan() {
    state.scan = document.querySelector('.rq-phase-scan');
    if (!state.scan) {
      state.scan = makeElement('div', 'rq-phase-scan', { 'aria-hidden': 'true' });
      document.body.prepend(state.scan);
    }
  }

  function addFocusLayer(surface) {
    if (surface.querySelector(':scope > .rq-focus-glow')) return;
    surface.classList.add('rq-focus-surface');
    surface.append(makeElement('span', 'rq-focus-glow', { 'aria-hidden': 'true' }));
  }

  function decorateNodes() {
    const revealSelectors = [
      '.rq-section-head',
      '.rq-project-card',
      '.rq-blog-row',
      '.rq-projects-hero > *',
      '.rq-projects-section-head',
      '.rq-project-showcase',
      '.post-item',
      '.rq-about-grid section',
      '.rq-about-panel',
      '.rq-inner-hero > *'
    ];

    document.querySelectorAll(revealSelectors.join(',')).forEach((node, index) => {
      node.classList.add('rq-depth-node');
      node.dataset.rqDepth = String((index % 4) + 1);
    });

    const parallaxSelectors = [
      '.rq-hero-copy',
      '.rq-section-head',
      '.rq-projects-hero > h1',
      '.rq-projects-hero > p',
      '.rq-inner-hero > *'
    ];

    state.parallaxNodes = [...document.querySelectorAll(parallaxSelectors.join(','))];
    state.parallaxNodes.forEach((node) => node.classList.add('rq-parallax-node'));

    document.querySelectorAll('.rq-project-card, .rq-project-showcase').forEach(addFocusLayer);
  }

  function observeNodes() {
    state.revealObserver?.disconnect();
    state.sectionObserver?.disconnect();

    const revealNodes = [...document.querySelectorAll('.rq-depth-node')];
    const sectionNodes = [...document.querySelectorAll(
      '[data-orbit-section], .rq-project-showcase, .rq-inner-hero, .post-item, .rq-about-panel'
    )];

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealNodes.forEach((node) => node.classList.add('is-v10-visible'));
      return;
    }

    state.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-v10-visible');
        state.revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '10% 0px 5%', threshold: 0.06 });

    revealNodes.forEach((node) => state.revealObserver.observe(node));

    state.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('rq-v10-active', entry.isIntersecting && entry.intersectionRatio > 0.32);
      });
    }, { threshold: [0.12, 0.32, 0.58] });

    sectionNodes.forEach((node) => state.sectionObserver.observe(node));
  }

  function updateHyperlane() {
    if (!state.path || !state.tracer) return;

    const point = state.path.getPointAtLength(state.pathLength * state.progress);
    state.path.style.strokeDashoffset = String(1 - state.progress);
    state.path.style.setProperty('--rq-v10-speed', state.speed.toFixed(3));
    state.tracer.setAttribute('cx', point.x.toFixed(2));
    state.tracer.setAttribute('cy', point.y.toFixed(2));
    state.tracer.setAttribute('r', (2.6 + state.speed * 2.4).toFixed(2));
  }

  function measureParallax() {
    if (reducedMotion.matches) return [];
    const viewportCenter = window.innerHeight * 0.5;
    return state.parallaxNodes.map((node, index) => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return null;
      const distance = (rect.top + rect.height * 0.5 - viewportCenter) / Math.max(1, window.innerHeight);
      const amount = clamp(-distance * (index % 2 ? 13 : 9), -13, 13);
      return { node, value: `${amount.toFixed(2)}px` };
    }).filter(Boolean);
  }

  function renderScrollState() {
    state.frame = 0;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.progress = clamp(window.scrollY / scrollable, 0, 1);
    // Complete geometry reads before writing SVG or CSS styles.
    const parallax = measureParallax();
    updateHyperlane();
    if (state.scan) {
      state.scan.style.transform = `translate3d(0,${(window.innerHeight * (0.12 + state.progress * 0.76) - 44).toFixed(1)}px,0)`;
      state.scan.style.opacity = String(0.08 + state.speed * 0.28);
    }
    parallax.forEach(({ node, value }) => {
      if (node.dataset.rqDepthY === value) return;
      node.style.setProperty('--rq-depth-y', value);
      node.dataset.rqDepthY = value;
    });
  }

  function queueRender() {
    if (state.frame || document.hidden) return;
    state.frame = requestAnimationFrame(renderScrollState);
  }

  function onScroll() {
    const now = performance.now();
    const delta = window.scrollY - state.lastScrollY;
    const elapsed = clamp(now - state.lastScrollAt, 12, 80);
    const impulse = clamp(Math.abs(delta) / elapsed / 3.8, 0, 1);

    state.speed = Math.max(impulse, state.speed * 0.78);
    state.lastScrollY = window.scrollY;
    state.lastScrollAt = now;
    queueRender();

    window.clearTimeout(state.decayTimer);
    state.decayTimer = window.setTimeout(decaySpeed, 90);
  }

  function decaySpeed() {
    state.speed *= 0.72;
    if (state.speed < 0.012) state.speed = 0;
    queueRender();
    if (state.speed > 0) state.decayTimer = window.setTimeout(decaySpeed, 70);
  }

  function updateFocus(event) {
    if (reducedMotion.matches || !finePointer.matches || document.hidden || !(event.target instanceof Element)) return;
    const surface = event.target.closest('.rq-focus-surface') || event.target.closest('.rq-about-grid section, .rq-about-panel, .rq-project-showcase-copy, .archives-timeline');
    if (!surface) return;
    const samples = event.getCoalescedEvents?.();
    const point = samples?.length ? samples[samples.length - 1] : event;
    const spotlight = event.target.closest('.rq-project-showcase-copy') || surface;
    state.focusSample = { surface, spotlight, clientX: point.clientX, clientY: point.clientY };
    if (!state.focusFrame) state.focusFrame = requestAnimationFrame(renderFocus);
  }

  function renderFocus() {
    state.focusFrame = 0;
    if (!state.focusSample || document.hidden) return;
    const { surface, spotlight, clientX, clientY } = state.focusSample;
    const rect = surface.getBoundingClientRect();
    const spotRect = spotlight === surface ? rect : spotlight.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const y = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    const tiltScale = surface.classList.contains('rq-project-showcase') ? 0.36 : 1;
    spotlight.style.setProperty('--rq-pointer-x', `${(clamp((clientX - spotRect.left) / Math.max(1, spotRect.width), 0, 1) * 100).toFixed(2)}%`);
    spotlight.style.setProperty('--rq-pointer-y', `${(clamp((clientY - spotRect.top) / Math.max(1, spotRect.height), 0, 1) * 100).toFixed(2)}%`);
    surface.style.setProperty('--rq-focus-x', `${(x * 100).toFixed(2)}%`);
    surface.style.setProperty('--rq-focus-y', `${(y * 100).toFixed(2)}%`);
    surface.style.setProperty('--rq-tilt-x', `${((0.5 - y) * 5.2 * tiltScale).toFixed(2)}deg`);
    surface.style.setProperty('--rq-tilt-y', `${((x - 0.5) * 6.4 * tiltScale).toFixed(2)}deg`);
    surface.classList.add('is-rq-focused');
  }

  function clearFocus(event) {
    if (!(event.target instanceof Element)) return;
    const surface = event.target.closest('.rq-focus-surface') || event.target.closest('.rq-about-grid section, .rq-about-panel, .rq-project-showcase-copy, .archives-timeline');
    if (!surface || surface.contains(event.relatedTarget)) return;
    if (state.focusSample?.surface === surface) {
      state.focusSample.spotlight.style.removeProperty('--rq-pointer-x');
      state.focusSample.spotlight.style.removeProperty('--rq-pointer-y');
      state.focusSample = null;
      cancelAnimationFrame(state.focusFrame);
      state.focusFrame = 0;
    }
    surface.classList.remove('is-rq-focused');
    surface.style.setProperty('--rq-tilt-x', '0deg');
    surface.style.setProperty('--rq-tilt-y', '0deg');
    surface.style.removeProperty('--rq-pointer-x');
    surface.style.removeProperty('--rq-pointer-y');
  }

  function bindEvents() {
    if (state.bound) return;
    state.bound = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', queueRender, { passive: true });
    document.addEventListener('pointermove', updateFocus, { passive: true });
    document.addEventListener('pointerout', clearFocus, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { queueRender(); return; }
      state.focusSample?.surface.classList.remove('is-rq-focused');
      cancelAnimationFrame(state.focusFrame);
      cancelAnimationFrame(state.frame);
      state.focusFrame = state.frame = 0;
      state.focusSample = null;
      window.clearTimeout(state.decayTimer);
    });
    document.addEventListener('pjax:complete', initDynamics);
    document.addEventListener('pjax:success', initDynamics);
  }

  function initDynamics() {
    document.documentElement.classList.add('rq-interface-v10');
    runBootSequence();
    bindEvents();
    decorateNodes();

    if (!reducedMotion.matches) {
      ensureHyperlane();
      ensurePhaseScan();
    }

    observeNodes();
    document.documentElement.classList.add('rq-v10-ready');
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDynamics, { once: true });
  } else {
    initDynamics();
  }
})();
