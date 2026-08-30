'use strict';

(() => {
  const state = window.__RQ_TACTICAL_V8__ || {
    bound: false,
    frame: 0,
    pointerFrame: 0,
    pointerX: -80,
    pointerY: -80,
    modules: [],
    clockTimer: 0
  };

  window.__RQ_TACTICAL_V8__ = state;

  const moduleNames = {
    home: 'HOME / 00',
    mission: 'MISSION / 01',
    warp: 'BUILD MODE / 02',
    projects: 'PROJECTS / 03',
    system: 'SYSTEMS / 04',
    agent: 'AGENT CORE / 05',
    blog: 'TRANSMISSION / 06',
    about: 'OPERATOR / 07',
    footer: 'SIGNAL / 08'
  };

  function makeElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;

    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });

    return element;
  }

  function ensureSystemChrome() {
    if (!document.querySelector('.rq-system-grid')) {
      document.body.append(makeElement('div', 'rq-system-grid', { 'aria-hidden': 'true' }));
    }

    let hud = document.querySelector('.rq-tactical-hud');
    if (!hud) {
      hud = makeElement('aside', 'rq-tactical-hud', { 'aria-hidden': 'true' });
      hud.innerHTML = `
        <div class="rq-hud-status">
          <i></i>
          <b>SYS</b>
          <em data-rq-hud-module>ONLINE</em>
        </div>
        <div class="rq-hud-track"></div>
        <div class="rq-hud-data">
          <span><b>ROUTE</b><em data-rq-hud-route>/</em></span>
          <span><b>VIEW</b><em data-rq-hud-view>0000×0000</em></span>
          <span><b>UTC</b><em data-rq-hud-clock>00:00:00</em></span>
          <span><b>POS</b><em data-rq-hud-scroll>000%</em></span>
        </div>`;
      document.body.append(hud);
    }

    if (
      window.matchMedia('(pointer: fine)').matches &&
      !document.querySelector('.rq-reticle')
    ) {
      const reticle = makeElement('div', 'rq-reticle', { 'aria-hidden': 'true' });
      reticle.append(makeElement('i', ''));
      document.body.append(reticle);
    }
  }

  function ensureHeroTelemetry() {
    const hero = document.querySelector('.rq-hero-stage');
    if (!hero || hero.querySelector(':scope > .rq-hero-telemetry')) return;

    const telemetry = makeElement('div', 'rq-hero-telemetry', { 'aria-hidden': 'true' });
    telemetry.innerHTML = `
      <span><b>Status</b><em>Online</em></span>
      <span><b>Route</b><em data-rq-hero-route>/</em></span>
      <span><b>View</b><em data-rq-hero-view>0000×0000</em></span>
      <span><b>Scroll</b><em data-rq-hero-scroll>000%</em></span>`;
    hero.append(telemetry);
  }

  function addCorners(panel) {
    if (panel.querySelector(':scope > .rq-panel-corners')) return;

    const corners = makeElement('span', 'rq-panel-corners', { 'aria-hidden': 'true' });
    corners.innerHTML = '<i></i><i></i><i></i><i></i>';
    panel.append(corners);
  }

  function addPanelCode(panel, label) {
    let code = panel.querySelector(':scope > .rq-panel-code');
    if (!code) {
      code = makeElement('span', 'rq-panel-code', { 'aria-hidden': 'true' });
      panel.append(code);
    }
    code.textContent = label;
  }

  function decoratePanel(panel, label, { showCode = true } = {}) {
    if (!panel) return;
    panel.classList.add('rq-tactical-panel');
    panel.dataset.rqModule = label;
    addCorners(panel);
    if (showCode) addPanelCode(panel, label);
  }

  function decorateHomepagePanels() {
    document.querySelectorAll('[data-orbit-section]').forEach((panel, index) => {
      const key = panel.dataset.orbitSection || `module-${index}`;
      const label = moduleNames[key] || `MODULE / ${String(index).padStart(2, '0')}`;
      decoratePanel(panel, label, {
        showCode: !panel.classList.contains('rq-section') || key === 'projects' || key === 'blog'
      });
    });
  }

  function decorateInnerPages() {
    const innerHero = document.querySelector('.rq-inner-hero');
    if (innerHero) {
      let label = 'SYSTEM / PAGE';
      if (document.body.classList.contains('rq-blog-page')) label = 'TRANSMISSION / INDEX';
      if (document.body.classList.contains('rq-about-page')) label = 'OPERATOR / PROFILE';
      decoratePanel(innerHero, label);
    }

    const projectsHero = document.querySelector('.rq-projects-hero');
    if (projectsHero) decoratePanel(projectsHero, 'PROJECT ARCHIVE / 00');

    document.querySelectorAll('.rq-project-showcase').forEach((project, index) => {
      const label = `CASEFILE / ${String(index + 1).padStart(2, '0')}`;
      decoratePanel(project, label);

      const shot = project.querySelector('.rq-project-shot');
      if (shot && !shot.querySelector('.rq-media-scan')) {
        shot.append(makeElement('span', 'rq-media-scan', { 'aria-hidden': 'true' }));
      }
    });

    const archive = document.querySelector('.archives-timeline');
    if (archive) decoratePanel(archive, 'TRANSMISSION / LOG');

    document.querySelectorAll('.rq-about-grid section, .rq-about-panel').forEach((panel, index) => {
      decoratePanel(panel, `OPERATOR MODULE / ${String(index + 1).padStart(2, '0')}`);
    });
  }

  function decorateTilesAndLogs() {
    document.querySelectorAll('.rq-project-card').forEach((card) => {
      card.classList.add('rq-tactical-tile');
      if (!card.querySelector(':scope > .rq-tile-scan')) {
        card.append(makeElement('span', 'rq-tile-scan', { 'aria-hidden': 'true' }));
      }
    });

    document.querySelectorAll('.post-item').forEach((item, index) => {
      if (item.querySelector(':scope > .rq-log-code')) return;
      const code = makeElement('span', 'rq-log-code', { 'aria-hidden': 'true' });
      code.textContent = `TX-${String(index + 1).padStart(2, '0')}`;
      item.append(code);
    });
  }

  function routeLabel() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') return 'HOME//ROOT';
    return path
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean)
      .join('//')
      .toUpperCase();
  }

  function collectModules() {
    state.modules = [...document.querySelectorAll('[data-rq-module]')];
  }

  function currentModule() {
    if (!state.modules.length) return 'SYSTEM / READY';

    const probe = window.innerHeight * 0.52;
    const candidates = state.modules.filter((module) => {
      const rect = module.getBoundingClientRect();
      return rect.top <= probe && rect.bottom >= probe;
    });

    if (!candidates.length) {
      return state.modules[0].dataset.rqModule || 'SYSTEM / READY';
    }

    candidates.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.height - bRect.height;
    });

    return candidates[0].dataset.rqModule || 'SYSTEM / READY';
  }

  function updateTelemetry() {
    state.frame = 0;

    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const percent = Math.max(0, Math.min(100, (window.scrollY / scrollable) * 100));
    const percentText = `${String(Math.round(percent)).padStart(3, '0')}%`;
    const viewportText = `${window.innerWidth}×${window.innerHeight}`;
    const activeLabel = currentModule();

    document.documentElement.style.setProperty('--rq-scroll', `${percent.toFixed(2)}%`);

    document.querySelectorAll('.rq-tactical-panel.is-rq-current').forEach((panel) => {
      panel.classList.remove('is-rq-current');
    });

    const activePanel = state.modules.find((panel) => panel.dataset.rqModule === activeLabel);
    if (activePanel) activePanel.classList.add('is-rq-current');

    const moduleNode = document.querySelector('[data-rq-hud-module]');
    const routeNode = document.querySelector('[data-rq-hud-route]');
    const viewNode = document.querySelector('[data-rq-hud-view]');
    const scrollNode = document.querySelector('[data-rq-hud-scroll]');
    const heroRoute = document.querySelector('[data-rq-hero-route]');
    const heroView = document.querySelector('[data-rq-hero-view]');
    const heroScroll = document.querySelector('[data-rq-hero-scroll]');

    if (moduleNode) moduleNode.textContent = activeLabel;
    if (routeNode) routeNode.textContent = routeLabel();
    if (viewNode) viewNode.textContent = viewportText;
    if (scrollNode) scrollNode.textContent = percentText;
    if (heroRoute) heroRoute.textContent = routeLabel();
    if (heroView) heroView.textContent = viewportText;
    if (heroScroll) heroScroll.textContent = percentText;
  }

  function queueTelemetry() {
    if (state.frame) return;
    state.frame = window.requestAnimationFrame(updateTelemetry);
  }

  function updateClock() {
    const clock = document.querySelector('[data-rq-hud-clock]');
    if (clock) clock.textContent = new Date().toISOString().slice(11, 19);
  }

  function updateReticle() {
    state.pointerFrame = 0;
    const reticle = document.querySelector('.rq-reticle');
    if (!reticle) return;

    reticle.style.transform = `translate3d(${state.pointerX}px, ${state.pointerY}px, 0) translate(-50%, -50%)`;
  }

  function queueReticle(event) {
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    const reticle = document.querySelector('.rq-reticle');
    if (reticle) reticle.classList.add('is-visible');

    if (!state.pointerFrame) {
      state.pointerFrame = window.requestAnimationFrame(updateReticle);
    }
  }

  function updateReticleTarget(event) {
    const reticle = document.querySelector('.rq-reticle');
    if (!reticle) return;
    const target = event.target instanceof Element
      ? event.target.closest('a, button, input, textarea, select, [role="button"]')
      : null;
    reticle.classList.toggle('is-target', Boolean(target));
  }

  function hideReticle() {
    const reticle = document.querySelector('.rq-reticle');
    if (reticle) reticle.classList.remove('is-visible', 'is-target');
  }

  function handleCrossShellNavigation(event) {
    if (
      !window.pjax ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link = event.target instanceof Element
      ? event.target.closest('a[href]')
      : null;

    if (
      !link ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    ) return;

    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return;

    const entersCustomShell = target.pathname === '/' || target.pathname.startsWith('/projects/');
    if (!entersCustomShell) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(target.href);
  }

  function bindGlobalEvents() {
    if (!state.crossShellBound) {
      state.crossShellBound = true;
      document.addEventListener('click', handleCrossShellNavigation, true);
    }

    if (state.bound) return;
    state.bound = true;

    window.addEventListener('scroll', queueTelemetry, { passive: true });
    window.addEventListener('resize', queueTelemetry, { passive: true });
    document.addEventListener('pointermove', queueReticle, { passive: true });
    document.addEventListener('pointerover', updateReticleTarget, { passive: true });
    document.addEventListener('pointerout', updateReticleTarget, { passive: true });
    document.documentElement.addEventListener('mouseleave', hideReticle);
    window.addEventListener('blur', hideReticle);
    document.addEventListener('pjax:complete', initTacticalInterface);
    document.addEventListener('pjax:success', initTacticalInterface);

    window.clearInterval(state.clockTimer);
    state.clockTimer = window.setInterval(updateClock, 1000);
  }

  function initTacticalInterface() {
    document.documentElement.classList.add('rq-interface-v8');
    ensureSystemChrome();
    ensureHeroTelemetry();
    decorateHomepagePanels();
    decorateInnerPages();
    decorateTilesAndLogs();
    collectModules();
    bindGlobalEvents();
    updateClock();
    queueTelemetry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTacticalInterface, { once: true });
  } else {
    initTacticalInterface();
  }
})();

