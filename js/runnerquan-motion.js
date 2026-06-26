(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function typeText(element, text, speed) {
    if (!element || !text || prefersReducedMotion) {
      element?.classList.add('is-typed');
      return;
    }

    element.textContent = '';
    element.classList.add('is-typing');
    let index = 0;

    const tick = () => {
      element.textContent = text.slice(0, index);
      index += 1;

      if (index <= text.length) {
        window.setTimeout(tick, speed);
      } else {
        element.classList.remove('is-typing');
        element.classList.add('is-typed');
      }
    };

    tick();
  }

  function setupTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach((element, idx) => {
      const text = element.getAttribute('data-typewriter') || element.textContent || '';
      const speed = idx === 0 ? 34 : 12;
      window.setTimeout(() => typeText(element, text, speed), idx * 900 + 250);
    });
  }

  function setupReveal() {
    const revealItems = document.querySelectorAll('.rq-reveal, .rq-project-card, .rq-blog-row, .rq-about-tags span, .rq-build-flow li');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.14
    });

    revealItems.forEach((item, idx) => {
      item.style.setProperty('--rq-delay', `${Math.min(idx % 8, 7) * 70}ms`);
      observer.observe(item);
    });
  }

  function setupPointerDrift() {
    document.querySelectorAll('.rq-about-panel, .rq-about-grid section, .rq-project-card').forEach((panel) => {
      panel.addEventListener('pointermove', (event) => {
        const rect = panel.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
        const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);
        panel.style.setProperty('--rq-x', x);
        panel.style.setProperty('--rq-y', y);
      });

      panel.addEventListener('pointerleave', () => {
        panel.style.removeProperty('--rq-x');
        panel.style.removeProperty('--rq-y');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('rq-motion-ready');
    setupTypewriters();
    setupReveal();
    setupPointerDrift();
  });
})();
