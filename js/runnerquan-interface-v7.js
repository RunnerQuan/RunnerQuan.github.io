'use strict';

(() => {
  const orbitLabels = { home: 'Home', projects: 'Projects', mission: 'Mission', system: 'Systems', agent: 'Agent', blog: 'Blog', about: 'About', footer: 'Signal' };

function bindOrbitLabels() {
    document.querySelectorAll('.rq-orbit-progress a').forEach((link, index) => {
      const panel = document.getElementById(link.getAttribute('href').slice(1));
      const label = orbitLabels[panel?.dataset.orbitSection] || `Orbit ${index + 1}`;
      link.dataset.label = label;
      link.setAttribute('aria-label', label);
    });
  }

  function initInterface() {
    document.documentElement.classList.add('rq-interface-v7');
    bindOrbitLabels();
    // Dynamics owns the shared, frame-coalesced spotlight and tilt handler.
    // The shared scroll controller owns the project index.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInterface, { once: true });
  } else {
    initInterface();
  }

  document.addEventListener('pjax:complete', initInterface);
  document.addEventListener('pjax:success', initInterface);
})();
