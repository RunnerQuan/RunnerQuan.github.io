(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pageHidden = document.hidden;

  function setupSiteIcon() {
    const iconHref = '/images/runnerquan-logo.svg';
    const applyIcon = () => {
      const links = [...document.querySelectorAll('link[rel~="icon"]')];

      if (!links.length) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = iconHref;
        link.dataset.rqSiteIcon = 'true';
        document.head.append(link);
        return;
      }

      links.forEach((link) => {
        if (link.getAttribute('href') === iconHref && link.type === 'image/svg+xml') return;
        link.type = 'image/svg+xml';
        link.href = iconHref;
        link.dataset.rqSiteIcon = 'true';
      });
    };

    applyIcon();

    const observer = new MutationObserver(() => applyIcon());
    observer.observe(document.head, { childList: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }

  function setupNav() {
    const nav = document.querySelector('.rq-nav');
    if (!nav) return;

    if (!nav.querySelector('.rq-menu-button')) {
      const button = document.createElement('button');
      button.className = 'rq-menu-button';
      button.type = 'button';
      button.setAttribute('aria-label', 'Toggle navigation');
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<span></span><span></span>';
      nav.append(button);

      button.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('rq-menu-open');
        button.setAttribute('aria-expanded', String(isOpen));
      });

      nav.querySelectorAll('nav a').forEach((link) => {
        link.addEventListener('click', () => {
          nav.classList.remove('rq-menu-open');
          button.setAttribute('aria-expanded', 'false');
        });
      });
    }

    let ticking = false;
    const sync = () => {
      nav.classList.toggle('rq-nav-scrolled', window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      },
      { passive: true }
    );

    sync();
  }

  function setupHomePanels() {
    if (!document.body.classList.contains('rq-home-page')) return;

    document.documentElement.classList.add('rq-home-orbit');

    const panels = [
      document.querySelector('.rq-hero-stage'),
      document.querySelector('.rq-orbit-mission'),
      document.querySelector('.rq-orbit-warp-stage'),
      document.querySelector('#projects'),
      ...document.querySelectorAll('.rq-orbit-story'),
      document.querySelector('#blog'),
      document.querySelector('.rq-orbit-about'),
      document.querySelector('.rq-orbit-footer')
    ].filter(Boolean);

    panels.forEach((panel, index) => {
      panel.classList.add('rq-orbit-panel');
      panel.id = panel.id || `rq-orbit-panel-${index + 1}`;
    });

    document.querySelector('.rq-orbit-progress')?.remove();
    const progress = document.createElement('aside');
    progress.className = 'rq-orbit-progress';
    progress.innerHTML =
      '<b>ORBIT</b>' +
      panels.map((panel, index) => `<a href="#${panel.id}" data-panel="${index}" aria-label="Section ${index + 1}"></a>`).join('');
    document.body.append(progress);

    let ticking = false;
    const sync = () => {
      const viewportCenter = window.innerHeight / 2;
      let activeIndex = 0;
      let nearest = Number.POSITIVE_INFINITY;

      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < nearest) {
          nearest = distance;
          activeIndex = index;
        }
      });

      panels.forEach((panel, index) => panel.classList.toggle('is-active-panel', index === activeIndex));
      progress.querySelectorAll('a').forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      },
      { passive: true }
    );

    sync();
  }

  function setupReveal() {
    const items = document.querySelectorAll(
      '.rq-orbit-reveal, .rq-reveal, .rq-project-card, .rq-blog-row, .rq-about-tags span, .rq-build-flow li'
    );

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8%' }
    );

    items.forEach((item, index) => {
      item.style.setProperty('--rq-delay', `${(index % 7) * 45}ms`);
      observer.observe(item);
    });
  }

  function setupPointerMotion() {
    if (reduceMotion || !document.body.classList.contains('rq-home-page')) return;

    const hero = document.querySelector('.rq-hero-stage');
    hero?.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--rq-hero-x', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      hero.style.setProperty('--rq-hero-y', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
    });

    hero?.addEventListener('pointerleave', () => {
      hero.style.setProperty('--rq-hero-x', '0');
      hero.style.setProperty('--rq-hero-y', '0');
    });

    document.querySelectorAll('.rq-project-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--rq-x', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
        card.style.setProperty('--rq-y', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--rq-x');
        card.style.removeProperty('--rq-y');
      });
    });
  }

  function setupWarp() {
    const warp = document.querySelector('.rq-orbit-warp-stage');
    if (!warp || reduceMotion) return;

    let ticking = false;
    const sync = () => {
      const rect = warp.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, 1 - Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight));
      warp.style.setProperty('--rq-warp', progress.toFixed(3));
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      },
      { passive: true }
    );

    sync();
  }

  function setupStars() {
    const canvas = document.querySelector('.rq-orbit-canvas');
    if (!canvas || reduceMotion) return;

    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let stars = [];
    let speed = 0.08;
    let targetSpeed = 0.08;
    let lastScrollY = window.scrollY;
    let lastTimestamp = performance.now();
    let frame = 0;

    function resize() {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * density;
      canvas.height = height * density;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(density, 0, 0, density, 0, 0);

      const area = width * height;
      const cap = width < 700 ? 80 : width < 1200 ? 130 : 190;
      stars = Array.from({ length: Math.min(cap, Math.floor(area / 9200)) }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 0.94 + 0.06,
        alpha: Math.random() * 0.65 + 0.2
      }));
    }

    function draw() {
      if (pageHidden) {
        frame = window.requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);
      speed += (targetSpeed - speed) * 0.055;
      targetSpeed += (0.08 - targetSpeed) * 0.02;

      stars.forEach((star) => {
        star.z -= speed * 0.0015;
        if (star.z < 0.05) {
          star.z = 1;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const perspective = 1 / star.z;
        const x = width / 2 + star.x * perspective * 0.3;
        const y = height / 2 + star.y * perspective * 0.3;
        const size = Math.max(0.8, perspective * 0.34);

        context.globalAlpha = Math.min(0.76, star.alpha * (1.18 - star.z));
        context.fillStyle = '#fff';
        context.fillRect(x, y, size, size);
      });

      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }

    window.addEventListener(
      'scroll',
      () => {
        const now = performance.now();
        const distance = Math.abs(window.scrollY - lastScrollY);
        const elapsed = Math.max(16, now - lastTimestamp);
        targetSpeed = Math.min(1.7, 0.08 + (distance / elapsed) * 3.2);
        lastScrollY = window.scrollY;
        lastTimestamp = now;
      },
      { passive: true }
    );

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      pageHidden = document.hidden;
    });

    resize();
    draw();

    window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
  }

  function setupCoreMap() {
    const targets = document.querySelectorAll('.rq-agent-orchestrator, .rq-agent-coremap, .rq-footer-signal');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.remove('is-running'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-running', entry.isIntersecting);
        });
      },
      { threshold: 0.28 }
    );

    targets.forEach((target) => observer.observe(target));
  }

  function setupReadingProgress() {
    if (!document.body.classList.contains('rq-inner-page') || !document.querySelector('.post-content')) return;

    const bar = document.createElement('div');
    bar.className = 'rq-reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);

    let ticking = false;
    const sync = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.setProperty('--rq-progress', `${progress.toFixed(2)}%`);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      },
      { passive: true }
    );

    sync();
  }

  function setupTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach((element, index) => {
      const text = element.dataset.typewriter || element.textContent || '';
      if (reduceMotion) {
        element.classList.add('is-typed');
        return;
      }

      window.setTimeout(() => {
        element.textContent = '';
        element.classList.add('is-typing');
        let cursor = 0;

        const tick = () => {
          element.textContent = text.slice(0, cursor++);
          if (cursor <= text.length) {
            window.setTimeout(tick, index ? 12 : 34);
          } else {
            element.classList.remove('is-typing');
            element.classList.add('is-typed');
          }
        };

        tick();
      }, index * 500 + 160);
    });
  }

  function init() {
    document.body.classList.add('rq-motion-ready');
    setupSiteIcon();
    setupNav();
    setupHomePanels();
    setupReveal();
    setupPointerMotion();
    setupWarp();
    setupStars();
    setupCoreMap();
    setupReadingProgress();
    setupTypewriters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
