'use strict';

(() => {
  const orbitLabels = [
    'Home',
    'Mission',
    'Build Mode',
    'Projects',
    'Systems',
    'Agent',
    'Blog',
    'About',
    'Signal'
  ];

  let projectObserver = null;

  function bindOrbitLabels() {
    document.querySelectorAll('.rq-orbit-progress a').forEach((link, index) => {
      const label = orbitLabels[index] || `Orbit ${index + 1}`;
      link.dataset.label = label;
      link.setAttribute('aria-label', label);
    });
  }

  function bindSpotlights() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const targets = document.querySelectorAll(
      '.rq-project-card, .rq-about-grid section, .rq-about-panel, .rq-project-showcase-copy, .archives-timeline'
    );

    targets.forEach((target) => {
      if (target.dataset.rqSpotlightBound === 'true') return;
      target.dataset.rqSpotlightBound = 'true';

      target.addEventListener('pointermove', (event) => {
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--rq-pointer-x', `${x.toFixed(2)}%`);
        target.style.setProperty('--rq-pointer-y', `${y.toFixed(2)}%`);
      });

      target.addEventListener('pointerleave', () => {
        target.style.removeProperty('--rq-pointer-x');
        target.style.removeProperty('--rq-pointer-y');
      });
    });
  }

  function bindProjectIndex() {
    if (projectObserver) {
      projectObserver.disconnect();
      projectObserver = null;
    }

    const nav = document.querySelector('.rq-project-index');
    if (!nav || !('IntersectionObserver' in window)) return;

    const links = [...nav.querySelectorAll('a[data-project-target]')];
    const linkById = new Map(links.map((link) => [link.dataset.projectTarget, link]));
    const projects = [...document.querySelectorAll('.rq-project-showcase[id]')];

    const setCurrent = (id) => {
      links.forEach((link) => {
        const active = link.dataset.projectTarget === id;
        link.classList.toggle('is-current', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    projectObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && linkById.has(visible.target.id)) setCurrent(visible.target.id);
    }, {
      rootMargin: '-20% 0px -48% 0px',
      threshold: [0.08, 0.25, 0.5]
    });

    projects.forEach((project) => projectObserver.observe(project));
    if (projects[0]) setCurrent(projects[0].id);
  }

  function initInterface() {
    document.documentElement.classList.add('rq-interface-v7');
    bindOrbitLabels();
    bindSpotlights();
    bindProjectIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInterface, { once: true });
  } else {
    initInterface();
  }

  document.addEventListener('pjax:complete', initInterface);
  document.addEventListener('pjax:success', initInterface);
})();
