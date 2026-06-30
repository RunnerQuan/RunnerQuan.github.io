(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function circleText(text) {
    return [...text]
      .map((char, index) => `<span style="--i:${index};--total:${text.length}">${char === ' ' ? '&nbsp;' : char}</span>`)
      .join('');
  }

  function buildPage() {
    const body = document.body;
    if (!body.classList.contains('rq-home-page') || body.dataset.rqV2 === '1') return;

    body.dataset.rqV2 = '1';
    document.documentElement.classList.add('rq-fullpage-root');

    if (!document.querySelector('.rq-orbit-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.className = 'rq-orbit-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      body.prepend(canvas);
    }

    if (!document.querySelector('.rq-orbit-noise')) {
      const noise = document.createElement('div');
      noise.className = 'rq-orbit-noise';
      noise.setAttribute('aria-hidden', 'true');
      body.append(noise);
    }

    const nav = document.querySelector('.rq-nav');
    if (nav && !nav.querySelector('.rq-orbit-menu')) {
      const button = document.createElement('button');
      button.className = 'rq-orbit-menu';
      button.type = 'button';
      button.setAttribute('aria-label', 'Toggle navigation');
      button.innerHTML = '<span></span><span></span>';
      nav.append(button);
      button.addEventListener('click', () => nav.classList.toggle('rq-menu-open'));
      nav.querySelectorAll('nav a').forEach((link) => {
        link.addEventListener('click', () => nav.classList.remove('rq-menu-open'));
      });
    }

    const hero = document.querySelector('.rq-hero');
    if (hero && !hero.closest('.rq-hero-stage')) {
      const stage = document.createElement('section');
      stage.className = 'rq-hero-stage';
      stage.id = 'orbit-home';
      stage.dataset.orbitSection = 'home';
      hero.before(stage);
      stage.append(hero);
      hero.insertAdjacentHTML(
        'beforeend',
        `<div class="rq-hero-orbit" aria-hidden="true">
          <div class="rq-hero-orbit-ring">${circleText(' RUNNERQUAN · CODE THE UNKNOWN · BUILD THE FUTURE ·')}</div>
          <div class="rq-hero-orbit-core">RQ</div>
        </div>
        <a class="rq-hero-scroll" href="#orbit-mission"><span>SCROLL TO EXPLORE</span><i></i></a>`
      );
    }

    const cockpit = document.querySelector('.rq-cockpit');
    if (cockpit && !cockpit.querySelector('.rq-scene-moon')) {
      cockpit.insertAdjacentHTML('beforeend', '<div class="rq-scene-moon" aria-hidden="true"></div>');
    }

    const heroStage = document.querySelector('.rq-hero-stage');
    if (heroStage && !document.querySelector('#orbit-mission')) {
      heroStage.insertAdjacentHTML(
        'afterend',
        `<section class="rq-orbit-mission" id="orbit-mission" data-orbit-section="mission">
          <div class="rq-orbit-mission-moon" aria-hidden="true"></div>
          <div class="rq-orbit-mission-copy rq-orbit-reveal">
            <span class="rq-orbit-eyebrow">00 / MISSION</span>
            <h2>From idea<br>to orbit.</h2>
            <p>把问题拆解成可以运行的系统，把想法推进到真实世界。</p>
            <div class="rq-orbit-tags"><span>AI Native</span><span>Full Stack</span><span>Agentic Product</span></div>
          </div>
        </section>`
      );
    }

    const projects = document.querySelector('#projects');
    if (projects) {
      projects.dataset.orbitSection = 'projects';
      if (!document.querySelector('.rq-orbit-warp-stage')) {
        const lines = Array.from({ length: 28 }, (_, index) => `<i style="--i:${index}"></i>`).join('');
        projects.insertAdjacentHTML(
          'beforebegin',
          `<section class="rq-orbit-warp-stage" data-orbit-section="warp">
            <div class="rq-orbit-warp">
              <div class="rq-orbit-warp-lines" aria-hidden="true">${lines}</div>
              <div class="rq-orbit-warp-copy rq-orbit-reveal">
                <span class="rq-orbit-eyebrow">ENTER / BUILD MODE</span>
                <h2>Build your own work.</h2>
                <p>Products · Systems · Experiments · Writing</p>
              </div>
            </div>
          </section>`
        );
      }
    }

    const blog = document.querySelector('#blog');
    if (blog) {
      blog.dataset.orbitSection = 'blog';
      if (!document.querySelector('.rq-orbit-story-wrap')) {
        blog.insertAdjacentHTML(
          'beforebegin',
          `<section class="rq-orbit-story-wrap">
            <article class="rq-orbit-story" data-orbit-section="system">
              <div class="rq-orbit-story-visual" aria-hidden="true"><i></i><i></i><i></i></div>
              <div class="rq-orbit-story-copy rq-orbit-reveal">
                <span class="rq-orbit-eyebrow">ENGINEERING / SYSTEM</span>
                <h2>The systems<br>behind the screen.</h2>
                <p>从协议、数据流与服务治理，到面向真实用户的 AI 产品，把复杂系统变成可理解、可验证、可持续迭代的体验。</p>
              </div>
            </article>
            <article class="rq-orbit-story" data-orbit-section="agent">
              <div class="rq-orbit-story-copy rq-orbit-reveal">
                <span class="rq-orbit-eyebrow">AI / PRODUCT</span>
                <h2>The agentic<br>product journey.</h2>
                <p>让模型不只生成答案，也能理解上下文、调用工具、承担任务，并在人的判断下完成闭环。</p>
              </div>
              <div class="rq-agent-orchestrator" aria-hidden="true">
                <div class="rq-agent-orbit"><span></span><span></span><span></span></div>
                <div class="rq-agent-core">AGENT<br>CORE</div>
                <div class="rq-agent-flow"><i></i><i></i><i></i><i></i><i></i></div>
                <div class="rq-agent-node rq-agent-node-ctx"><b>01</b><span>CTX</span></div>
                <div class="rq-agent-node rq-agent-node-llm"><b>02</b><span>LLM</span></div>
                <div class="rq-agent-node rq-agent-node-tool"><b>03</b><span>TOOL</span></div>
                <div class="rq-agent-node rq-agent-node-mem"><b>04</b><span>MEM</span></div>
                <div class="rq-agent-node rq-agent-node-hitl"><b>05</b><span>HITL</span></div>
                <div class="rq-agent-terminal">
                  <b>RUN / PRODUCT LOOP</b>
                  <span>context.pack()</span>
                  <span>model.plan()</span>
                  <span>tool.call()</span>
                  <span>memory.write()</span>
                  <span>human.approve()</span>
                </div>
              </div>
            </article>
          </section>`
        );
      }
    }

    const about = document.querySelector('.rq-about-strip');
    if (about && !about.classList.contains('rq-orbit-about')) {
      about.classList.add('rq-orbit-about');
      about.dataset.orbitSection = 'about';
      about.insertAdjacentHTML('afterbegin', '<div class="rq-orbit-about-moon" aria-hidden="true"></div>');

      const copy = [...about.children].find(
        (element) => element.tagName === 'DIV' && !element.classList.contains('rq-orbit-about-moon')
      );
      const link = [...about.children].find((element) => element.tagName === 'A');

      if (copy) {
        copy.classList.add('rq-orbit-about-copy', 'rq-orbit-reveal');
        const heading = copy.querySelector('h2');
        if (heading) heading.innerHTML = 'Keep building.<br>Keep exploring.';

        const actions = document.createElement('div');
        actions.className = 'rq-orbit-about-actions';
        if (link) {
          link.textContent = 'About me →';
          actions.append(link);
        }
        actions.insertAdjacentHTML('beforeend', '<a href="mailto:runnerquan@foxmail.com">Contact ↗</a>');
        copy.append(actions);
      }
    }

    const shell = document.querySelector('.rq-page-shell');
    if (shell && !shell.querySelector('.rq-orbit-footer')) {
      shell.insertAdjacentHTML(
        'beforeend',
        `<footer class="rq-orbit-footer" data-orbit-section="footer">
          <div class="rq-footer-signal" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span>
            <i></i><i></i><i></i>
          </div>
          <div class="rq-footer-brand">
            <a href="#orbit-home">RunnerQuan</a>
            <p>Code the unknown. Build the future.</p>
          </div>
          <div class="rq-footer-links" aria-label="Footer links">
            <a href="https://github.com/RunnerQuan" target="_blank" rel="noopener">GitHub</a>
            <a href="/archives/">Blog</a>
            <a href="mailto:runnerquan@foxmail.com">Email</a>
          </div>
          <div class="rq-footer-meta">
            <span>© ${new Date().getFullYear()} RunnerQuan</span>
            <span>SYS READY / KEEP BUILDING</span>
          </div>
        </footer>`
      );
    }

    document
      .querySelectorAll('.rq-section-head, .rq-project-card, .rq-blog-row')
      .forEach((element) => element.classList.add('rq-orbit-reveal'));
  }

  function setupPanels() {
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
      panel.classList.add('rq-fullpage-panel');
      panel.dataset.panelIndex = String(index);
    });

    document.querySelector('.rq-orbit-progress')?.remove();
    const progress = document.createElement('aside');
    progress.className = 'rq-orbit-progress';
    progress.innerHTML =
      '<b>ORBIT</b>' +
      panels.map((_, index) => `<a href="#" data-panel="${index}" aria-label="Section ${index + 1}"></a>`).join('');
    document.body.append(progress);

    let animationFrame = 0;

    function syncActivePanel() {
      let activeIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      const viewportCenter = window.innerHeight / 2;

      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          activeIndex = index;
        }
      });

      panels.forEach((panel, index) => panel.classList.toggle('is-active-panel', index === activeIndex));
      progress
        .querySelectorAll('a')
        .forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
      document.querySelector('.rq-nav')?.classList.toggle('rq-nav-scrolled', activeIndex > 0 || window.scrollY > 32);
    }

    progress.querySelectorAll('a').forEach((dot) => {
      dot.addEventListener('click', (event) => {
        event.preventDefault();
        const target = panels[Number(dot.dataset.panel)];
        target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });

    window.addEventListener(
      'scroll',
      () => {
        if (animationFrame) return;
        animationFrame = window.requestAnimationFrame(() => {
          syncActivePanel();
          animationFrame = 0;
        });
      },
      { passive: true }
    );

    syncActivePanel();
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
      item.style.setProperty('--rq-delay', `${(index % 7) * 55}ms`);
      observer.observe(item);
    });
  }

  function setupPointerMotion() {
    if (reduceMotion) return;

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

    document.querySelectorAll('.rq-project-card, .rq-about-panel, .rq-about-grid section').forEach((card) => {
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

  function setupStars() {
    const canvas = document.querySelector('.rq-orbit-canvas');
    if (!canvas || reduceMotion) return;

    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let stars = [];
    let speed = 0.1;
    let targetSpeed = 0.1;
    let lastScrollY = window.scrollY;
    let lastTimestamp = performance.now();

    function resize() {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * density;
      canvas.height = height * density;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(density, 0, 0, density, 0, 0);
      stars = Array.from({ length: Math.min(210, Math.floor((width * height) / 7600)) }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 0.94 + 0.06,
        alpha: Math.random() * 0.65 + 0.2
      }));
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      speed += (targetSpeed - speed) * 0.055;
      targetSpeed += (0.1 - targetSpeed) * 0.02;

      stars.forEach((star) => {
        star.z -= speed * 0.0016;
        if (star.z < 0.05) {
          star.z = 1;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const perspective = 1 / star.z;
        const x = width / 2 + star.x * perspective * 0.3;
        const y = height / 2 + star.y * perspective * 0.3;
        const size = Math.max(0.8, perspective * 0.36);

        context.globalAlpha = Math.min(0.76, star.alpha * (1.18 - star.z));
        context.fillStyle = '#fff';
        context.fillRect(x, y, size, size);
      });

      context.globalAlpha = 1;
      window.requestAnimationFrame(draw);
    }

    window.addEventListener(
      'scroll',
      () => {
        const now = performance.now();
        const distance = Math.abs(window.scrollY - lastScrollY);
        const elapsed = Math.max(16, now - lastTimestamp);
        targetSpeed = Math.min(2.4, 0.1 + (distance / elapsed) * 4.5);
        lastScrollY = window.scrollY;
        lastTimestamp = now;
      },
      { passive: true }
    );

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
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
      }, index * 750 + 180);
    });
  }

  function init() {
    buildPage();
    document.body.classList.add('rq-motion-ready');

    if (document.body.classList.contains('rq-home-page')) {
      setupPanels();
      setupPointerMotion();
      setupStars();
    }

    setupReveal();
    setupTypewriters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
