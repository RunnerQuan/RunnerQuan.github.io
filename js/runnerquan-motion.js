(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pageHidden = document.hidden;

  function setupPageTransition() {
    if (reduceMotion || document.body.dataset.rqTransitionReady === '1') return;

    document.body.dataset.rqTransitionReady = '1';

    let layer = document.querySelector('.rq-page-transition');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'rq-page-transition';
      layer.setAttribute('aria-hidden', 'true');
      document.body.append(layer);
    }

    window.requestAnimationFrame(() => {
      document.body.classList.add('rq-page-entered');
      document.body.classList.remove('rq-page-leaving');
    });

    window.addEventListener('pageshow', () => {
      document.body.classList.add('rq-page-entered');
      document.body.classList.remove('rq-page-leaving');
    });

    document.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const link = event.target.closest('a[href]');
        if (!link) return;
        if (link.target && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;

        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

        const destination = new URL(href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) return;

        event.preventDefault();
        document.body.classList.add('rq-page-leaving');
        document.body.classList.remove('rq-page-entered');

        window.setTimeout(() => {
          window.location.href = destination.href;
        }, 430);
      },
      true
    );
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

  function setupArchiveIndex() {
    const archive = document.querySelector('.archives-container');
    if (!archive || archive.querySelector('.rq-archive-hero')) return;

    const posts = [...archive.querySelectorAll('.post-item')];
    const years = [...archive.querySelectorAll('.archive-year')]
      .map((year) => year.textContent.trim())
      .filter(Boolean);
    const latest = posts[0]?.querySelector('.post-title')?.textContent.trim() || 'Latest writing';
    const yearLabel = years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0] || 'Archive';

    const hero = document.createElement('section');
    hero.className = 'rq-archive-hero rq-reveal';
    hero.innerHTML = `
      <div class="rq-archive-hero-copy">
        <span>WRITING INDEX</span>
        <h1>Blog</h1>
        <p>技术写作、产品复盘和工程笔记汇成一条可继续增长的索引。</p>
      </div>
      <div class="rq-archive-hero-panel" aria-label="Archive summary">
        <span>${yearLabel}</span>
        <strong>${String(posts.length).padStart(2, '0')}</strong>
        <em>published notes</em>
        <p>${latest}</p>
      </div>`;

    archive.prepend(hero);

    const archiveItem = archive.querySelector('.archive-item');
    if (!archiveItem || !posts.length) return;

    const firstTitle = posts[0].querySelector('.post-title')?.textContent.trim() || 'Latest writing';
    const firstDate = posts[0].querySelector('.post-date')?.textContent.trim() || yearLabel;
    const preview = document.createElement('aside');
    preview.className = 'rq-archive-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = `
      <div class="rq-archive-preview-visual">
        <img src="/images/runnerquan-writing-lab.png" alt="" loading="eager" decoding="async">
      </div>
      <div class="rq-archive-preview-copy">
        <span>ACTIVE NOTE / 01</span>
        <strong>${escapeHtml(firstTitle)}</strong>
        <em>${escapeHtml(firstDate)} / READ TRACE</em>
      </div>`;

    archiveItem.classList.add('rq-archive-item-preview');
    archiveItem.append(preview);

    const previewLabel = preview.querySelector('span');
    const previewTitle = preview.querySelector('strong');
    const previewDate = preview.querySelector('em');

    const updatePreview = (post, index) => {
      const title = post.querySelector('.post-title')?.textContent.trim() || 'Untitled note';
      const date = post.querySelector('.post-date')?.textContent.trim() || yearLabel;
      posts.forEach((item) => item.classList.toggle('is-preview-active', item === post));
      previewLabel.textContent = `ACTIVE NOTE / ${String(index + 1).padStart(2, '0')}`;
      previewTitle.textContent = title;
      previewDate.textContent = `${date} / READ TRACE`;
      preview.style.setProperty('--rq-preview-index', String(index));
      preview.style.setProperty('--rq-preview-shift-x', `${(index - 1) * 3.5}%`);
      preview.style.setProperty('--rq-preview-shift-y', `${index * -2.5}%`);
      preview.classList.remove('is-changing');
      void preview.offsetWidth;
      preview.classList.add('is-changing');
    };

    posts.forEach((post, index) => {
      post.dataset.rqPreview = String(index + 1).padStart(2, '0');
      post.addEventListener('pointerenter', () => updatePreview(post, index));
      post.addEventListener('focusin', () => updatePreview(post, index));
    });

    updatePreview(posts[0], 0);
  }

  function setupProjectProgress() {
    const projects = [...document.querySelectorAll('.rq-project-showcase')];
    if (!projects.length || document.querySelector('.rq-project-progress')) return;

    const progress = document.createElement('aside');
    progress.className = 'rq-project-progress';
    progress.setAttribute('aria-label', 'Project progress');
    progress.innerHTML = `
      <b>BUILD INDEX</b>
      <strong>01 / ${String(projects.length).padStart(2, '0')}</strong>
      <div>${projects.map((project, index) => {
        const id = project.id || `project-${String(index + 1).padStart(2, '0')}`;
        project.id = id;
        return `<a href="#${id}" aria-label="${escapeHtml(project.dataset.rqProjectName || `Project ${index + 1}`)}"></a>`;
      }).join('')}</div>`;
    document.body.append(progress);

    const label = progress.querySelector('strong');
    const links = [...progress.querySelectorAll('a')];
    let ticking = false;

    const sync = () => {
      const viewportCenter = window.innerHeight / 2;
      let activeIndex = 0;
      let nearest = Number.POSITIVE_INFINITY;

      projects.forEach((project, index) => {
        const rect = project.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < nearest) {
          nearest = distance;
          activeIndex = index;
        }
      });

      label.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
      links.forEach((link, index) => {
        link.classList.toggle('is-active', index === activeIndex);
        link.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      });
      ticking = false;
    };

    links.forEach((link, index) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        projects[index].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    });

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }, { passive: true });

    sync();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char]
    ));
  }

  function setupTaxonomyIndex() {
    const configs = [
      {
        page: document.querySelector('.tag-page-container'),
        content: document.querySelector('.tag-page-container .tagcloud-content'),
        nodes: [...document.querySelectorAll('.tag-page-container .tagcloud-content a')],
        eyebrow: 'KNOWLEDGE MAP',
        title: 'Tags',
        label: 'tag nodes',
        description: '把零散主题整理成可探索的知识节点，方便沿着兴趣快速跳转。'
      },
      {
        page: document.querySelector('.category-page-container'),
        content: document.querySelector('.category-page-container .category-list-content'),
        nodes: [...document.querySelectorAll('.category-page-container .site-all-category-list-item')],
        eyebrow: 'CONTENT ROUTES',
        title: 'Categories',
        label: 'routes',
        description: '按内容路径重新整理文章脉络，让主题关系比普通列表更容易被看见。'
      }
    ];

    configs.forEach((config) => {
      if (!config.page || !config.content || !config.nodes.length || config.page.querySelector('.rq-taxonomy-hero')) return;

      config.page.classList.add('rq-taxonomy-page');
      config.nodes.forEach((node, index) => {
        node.classList.add('rq-taxonomy-node', 'rq-reveal');
        node.dataset.rqNode = String(index + 1).padStart(2, '0');
        node.style.setProperty('--rq-node-index', String(index));
      });

      const featuredNode = config.nodes[0];
      const featured = (featuredNode?.querySelector('a') || featuredNode)?.textContent.trim().replace(/\s+/g, ' ') || config.title;
      const hero = document.createElement('section');
      hero.className = 'rq-taxonomy-hero rq-reveal';
      hero.innerHTML = `
        <div class="rq-taxonomy-copy">
          <span>${config.eyebrow}</span>
          <h1>${config.title}</h1>
          <p>${config.description}</p>
        </div>
        <div class="rq-taxonomy-panel" aria-label="${config.title} summary">
          <span>${config.label}</span>
          <strong>${String(config.nodes.length).padStart(2, '0')}</strong>
          <em>active index</em>
          <p>${escapeHtml(featured)}</p>
        </div>`;

      config.page.prepend(hero);
    });
  }

  function setupTermArchiveIndex() {
    const configs = [
      {
        container: document.querySelector('.tag-archive-container'),
        name: document.querySelector('.tag-archive-container .tag-name'),
        eyebrow: 'TAG TRACE',
        kind: 'tag'
      },
      {
        container: document.querySelector('.category-archive-container'),
        name: document.querySelector('.category-archive-container .category-name'),
        eyebrow: 'CATEGORY TRACE',
        kind: 'category'
      }
    ];

    configs.forEach((config) => {
      const { container, name } = config;
      if (!container || !name || container.querySelector('.rq-term-hero')) return;

      const posts = [...container.querySelectorAll('.post-item')];
      const years = [...container.querySelectorAll('.archive-year')]
        .map((year) => year.textContent.trim())
        .filter(Boolean);
      const term = name.textContent.trim().replace(/\s+/g, ' ');
      const latest = posts[0]?.querySelector('.post-title')?.textContent.trim() || 'Latest note';
      const yearLabel = years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0] || 'Archive';

      container.classList.add('rq-term-page');
      const hero = document.createElement('section');
      hero.className = 'rq-term-hero rq-reveal';
      hero.innerHTML = `
        <div>
          <span>${config.eyebrow}</span>
          <h1>${escapeHtml(term)}</h1>
          <p>${escapeHtml(term)} ${config.kind} 下的文章被整理成一组可继续扩展的阅读线索。</p>
        </div>
        <aside class="rq-term-panel" aria-label="${config.kind} summary">
          <span>${yearLabel}</span>
          <strong>${String(posts.length).padStart(2, '0')}</strong>
          <em>linked notes</em>
          <p>${escapeHtml(latest)}</p>
        </aside>`;

      name.replaceWith(hero);
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll(
      '.rq-orbit-reveal, .rq-reveal, .rq-project-card, .rq-blog-row, .post-item, .rq-about-tags span, .rq-build-flow li, .rq-taxonomy-node'
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

    document.querySelectorAll('.rq-project-card, .rq-blog-row, .rq-blog-feature, .rq-writing-visual, .rq-orbit-mission-copy, .rq-projects-hero-visual, .rq-project-showcase, .rq-about-hero-copy, .rq-about-identity, .rq-about-grid section, .rq-about-panel, .rq-about-tags span, .rq-build-flow li, .rq-about-contact, .rq-about-actions a, .rq-archive-hero-panel, .rq-taxonomy-panel, .rq-term-panel, .post-page-container .post-header, .post-content.keep-markdown-body > p:first-of-type, figure.highlight, .post-item, .rq-taxonomy-node, .tag-list-content a, .category-list-content a').forEach((surface) => {
      let pointerFrame = 0;

      const syncPointer = (event) => {
        surface.classList.add('is-pointer-active');
        if (pointerFrame) return;

        pointerFrame = window.requestAnimationFrame(() => {
          const rect = surface.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          surface.style.setProperty('--rq-pointer-x', `${(x * 100).toFixed(2)}%`);
          surface.style.setProperty('--rq-pointer-y', `${(y * 100).toFixed(2)}%`);
          surface.style.setProperty('--rq-x', (x - 0.5).toFixed(3));
          surface.style.setProperty('--rq-y', (y - 0.5).toFixed(3));
          pointerFrame = 0;
        });
      };

      surface.addEventListener('pointerenter', () => surface.classList.add('is-pointer-active'));
      surface.addEventListener('pointermove', syncPointer);
      surface.addEventListener('pointerleave', () => {
        surface.classList.remove('is-pointer-active');
        if (pointerFrame) {
          window.cancelAnimationFrame(pointerFrame);
          pointerFrame = 0;
        }
        surface.style.removeProperty('--rq-pointer-x');
        surface.style.removeProperty('--rq-pointer-y');
        surface.style.removeProperty('--rq-x');
        surface.style.removeProperty('--rq-y');
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
      element.textContent = text;

      if (reduceMotion || window.matchMedia('(max-width: 640px)').matches) {
        element.classList.add('is-typed');
        return;
      }

      const duration = Math.min(1500, 520 + text.length * 7);

      window.setTimeout(() => {
        element.classList.add('is-typing');
        window.setTimeout(() => {
          element.classList.remove('is-typing');
          element.classList.add('is-typed');
        }, duration);
      }, index * 180 + 120);
    });
  }

  function setupCriticalImages() {
    document.querySelectorAll('.rq-about-portrait img[data-src]').forEach((image) => {
      if (!image.getAttribute('src') && image.dataset.src) {
        image.setAttribute('src', image.dataset.src);
      }
    });
  }

  function setupSearchConsole() {
    const overlay = document.querySelector('.search-pop-overlay');
    const popup = overlay?.querySelector('.search-popup');
    const input = popup?.querySelector('.search-input');
    const nav = document.querySelector('.rq-nav nav');

    if (!overlay || !popup) return;

    popup.classList.add('rq-search-console');
    popup.dataset.rqLabel = 'SEARCH CONSOLE';

    if (nav && !nav.querySelector('.rq-nav-search')) {
      const searchButton = document.createElement('button');
      searchButton.type = 'button';
      searchButton.className = 'rq-nav-search search-popup-trigger';
      searchButton.setAttribute('aria-label', 'Search notes, projects, ideas');
      searchButton.innerHTML = '<span>Search</span>';
      nav.append(searchButton);
    }

    if (input) {
      input.placeholder = 'Search notes, projects, ideas...';
      input.setAttribute('aria-label', 'Search notes, projects, ideas');
    }

    const setEmptyState = () => {
      const noResult = popup.querySelector('#no-result');
      if (!noResult || noResult.dataset.rqEmptyReady === '1') return;

      noResult.dataset.rqEmptyReady = '1';
      noResult.innerHTML = '<span>Search console online</span><strong>Type a note, project, or idea.</strong>';
    };

    const openSearch = () => {
      overlay.classList.add('active');
      window.setTimeout(() => input?.focus(), 120);
      setEmptyState();
    };

    document.querySelectorAll('.search-popup-trigger').forEach((trigger) => {
      if (trigger.dataset.rqSearchBound === '1') return;

      trigger.dataset.rqSearchBound = '1';
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openSearch();
      });
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isTyping = target?.matches?.('input, textarea, select, [contenteditable="true"]');
      if (isTyping) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    });

    window.setTimeout(setEmptyState, 320);
  }

  function init() {
    document.body.classList.add('rq-motion-ready');
    setupCriticalImages();
    setupPageTransition();
    setupNav();
    setupHomePanels();
    setupArchiveIndex();
    setupProjectProgress();
    setupTaxonomyIndex();
    setupTermArchiveIndex();
    setupReveal();
    setupPointerMotion();
    setupWarp();
    setupStars();
    setupCoreMap();
    setupReadingProgress();
    setupTypewriters();
    setupSearchConsole();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
