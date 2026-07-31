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

    let routeStage = layer.querySelector('.rq-page-transition-stage');
    if (!routeStage) {
      routeStage = document.createElement('div');
      routeStage.className = 'rq-page-transition-stage';

      const routeMeta = document.createElement('span');
      routeMeta.className = 'rq-page-transition-meta';
      routeMeta.textContent = 'ROUTE / 00';

      const routeTitle = document.createElement('strong');
      routeTitle.className = 'rq-page-transition-title';
      routeTitle.textContent = 'HOME';

      const routePath = document.createElement('span');
      routePath.className = 'rq-page-transition-path';
      routePath.textContent = '/';

      const routeSignal = document.createElement('i');
      routeSignal.className = 'rq-page-transition-signal';

      routeStage.append(routeMeta, routeTitle, routePath, routeSignal);
      layer.append(routeStage);
    }

    const routeNames = [
      { match: (path) => path === '/', index: '00', title: 'HOME' },
      { match: (path) => path.startsWith('/projects'), index: '01', title: 'PROJECTS' },
      { match: (path) => path.startsWith('/blog') || path.startsWith('/archives'), index: '02', title: 'BLOG' },
      { match: (path) => path.startsWith('/about'), index: '03', title: 'ABOUT' },
      { match: (path) => path.startsWith('/contact'), index: '04', title: 'CONTACT' },
      { match: (path) => /^\/\d{4}\//.test(path), index: '05', title: 'ARTICLE' },
      { match: (path) => path.startsWith('/tags') || path.startsWith('/categories'), index: '06', title: 'ARCHIVE' }
    ];

    const setRouteTarget = (destination) => {
      const route = routeNames.find((item) => item.match(destination.pathname)) || {
        index: '07',
        title: 'PAGE'
      };
      const path = decodeURIComponent(destination.pathname || '/');

      routeStage.querySelector('.rq-page-transition-meta').textContent = `ROUTE / ${route.index}`;
      routeStage.querySelector('.rq-page-transition-title').textContent = route.title;
      routeStage.querySelector('.rq-page-transition-path').textContent = path;
    };

    window.requestAnimationFrame(() => {
      document.body.classList.add('rq-page-entered');
      document.body.classList.remove('rq-page-leaving');
    });

    window.addEventListener('pageshow', () => {
      document.body.classList.add('rq-page-entered');
      document.body.classList.remove('rq-page-leaving');
      document.body.removeAttribute('aria-busy');
    });

    document.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented || document.body.classList.contains('rq-page-leaving')) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

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
        setRouteTarget(destination);
        document.body.setAttribute('aria-busy', 'true');
        document.body.classList.add('rq-page-leaving');
        document.body.classList.remove('rq-page-entered');

        window.setTimeout(() => {
          window.location.href = destination.href;
        }, 520);
      },
      true
    );
  }

  function setupPostDossier() {
    const post = document.querySelector('.post-page-container .post-content');
    if (!post) return;

    document.body.classList.add('rq-post-reading');

    const sectionCount = post.querySelectorAll('h1, h2').length;
    post.dataset.rqSections = String(sectionCount).padStart(2, '0');

    const postNav = document.querySelector('.post-nav');
    if (postNav) {
      const links = postNav.querySelectorAll('.prev-post, .next-post');
      postNav.dataset.rqLinkCount = String(links.length);

      links.forEach((item) => {
        const isPrevious = item.classList.contains('prev-post');
        const link = item.querySelector('a');
        const title = item.querySelector('.post-nav-title-item')?.textContent?.trim();
        item.dataset.rqDirection = isPrevious ? 'PREVIOUS NOTE' : 'NEXT NOTE';
        if (link && title) link.setAttribute('aria-label', `${isPrevious ? '上一篇' : '下一篇'}：${title}`);
      });
    }

    document.querySelectorAll('.post-tools .tools-item').forEach((tool) => {
      if (tool.classList.contains('toggle-show-toc')) tool.setAttribute('aria-label', '打开文章目录');
      if (tool.classList.contains('full-screen')) tool.setAttribute('aria-label', '切换全屏阅读');
      tool.setAttribute('tabindex', '0');
    });
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
    const nav = document.querySelector('.rq-nav nav');
    let overlay = document.querySelector('.search-pop-overlay');

    if (!overlay) {
      let host = document.body;
      if (!document.body.classList.contains('rq-inner-page')) {
        host = document.querySelector('.rq-search-host');
        if (!host) {
          host = document.createElement('div');
          host.className = 'rq-search-host rq-inner-page';
          document.body.append(host);
        }
      }

      host.insertAdjacentHTML(
        'beforeend',
        `<div class="search-pop-overlay rq-search-owned" aria-hidden="true">
          <section class="popup search-popup" role="dialog" aria-modal="true" aria-label="Search RunnerQuan">
            <div class="search-header">
              <span class="search-input-field-pre" role="button" tabindex="0" aria-label="Clear search">
                <i class="fas fa-keyboard" aria-hidden="true"></i>
              </span>
              <div class="search-input-container">
                <input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="search" class="search-input">
              </div>
              <button class="close-popup-btn" type="button" aria-label="Close search">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <div id="search-result" aria-live="polite"></div>
          </section>
        </div>`
      );
      overlay = host.querySelector('.search-pop-overlay');
    }

    if (!overlay || overlay.dataset.rqSearchReady === '1') return;
    overlay.dataset.rqSearchReady = '1';

    const popup = overlay.querySelector('.search-popup');
    const sourceInput = popup?.querySelector('.search-input');
    const sourceResult = popup?.querySelector('#search-result');
    if (!popup || !sourceInput || !sourceResult) return;

    // Detach Keep's page-specific listener so every route uses the same complete index.
    const input = sourceInput.cloneNode(true);
    const resultContent = sourceResult.cloneNode(false);
    sourceInput.replaceWith(input);
    sourceResult.replaceWith(resultContent);

    popup.classList.add('rq-search-console');
    popup.dataset.rqLabel = 'SEARCH CONSOLE';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', 'Search RunnerQuan');
    overlay.setAttribute('aria-hidden', 'true');

    if (nav && !nav.querySelector('.rq-nav-search')) {
      const searchButton = document.createElement('button');
      searchButton.type = 'button';
      searchButton.className = 'rq-nav-search search-popup-trigger';
      searchButton.setAttribute('aria-label', 'Search notes, projects, ideas');
      searchButton.setAttribute('aria-haspopup', 'dialog');
      searchButton.innerHTML = '<span>Search</span>';
      nav.append(searchButton);
    }

    input.placeholder = 'Search notes, projects, ideas...';
    input.setAttribute('aria-label', 'Search notes, projects, ideas');

    const setSearchState = (label, message, state = 'ready') => {
      resultContent.replaceChildren();
      const empty = document.createElement('div');
      empty.id = 'no-result';
      empty.dataset.state = state;

      const status = document.createElement('span');
      status.textContent = label;
      const detail = document.createElement('strong');
      detail.textContent = message;
      empty.append(status, detail);
      resultContent.append(empty);
    };

    const plainText = (html) => {
      const parsed = new DOMParser().parseFromString(html || '', 'text/html');
      return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim();
    };

    let indexPromise;
    const loadSearchIndex = () => {
      if (indexPromise) return indexPromise;

      indexPromise = Promise.allSettled([
        fetch('/search.xml').then((response) => {
          if (!response.ok) throw new Error(`Search index returned ${response.status}`);
          return response.text();
        }),
        fetch('/projects/').then((response) => {
          if (!response.ok) throw new Error(`Project index returned ${response.status}`);
          return response.text();
        })
      ]).then(([notesResponse, projectsResponse]) => {
        const items = [
          {
            title: 'Projects',
            url: '/projects/',
            content: 'AI-native products, system engineering, reusable tools, and shipped experiments.',
            kind: 'PAGE'
          },
          {
            title: 'Blog archive',
            url: '/archives/',
            content: 'Technical writing, product retrospectives, and engineering notes.',
            kind: 'PAGE'
          },
          {
            title: 'About RunnerQuan',
            url: '/about/',
            content: 'AI-native full-stack builder and agentic product developer.',
            kind: 'PAGE'
          }
        ];

        if (notesResponse.status === 'fulfilled') {
          const xml = new DOMParser().parseFromString(notesResponse.value, 'text/xml');
          xml.querySelectorAll('entry').forEach((entry) => {
            const title = entry.querySelector('title')?.textContent?.trim();
            const url = entry.querySelector('url')?.textContent?.trim();
            if (!title || !url) return;
            items.push({
              title,
              url,
              content: plainText(entry.querySelector('content')?.textContent || ''),
              kind: 'NOTE'
            });
          });
        }

        if (projectsResponse.status === 'fulfilled') {
          const projectDocument = new DOMParser().parseFromString(projectsResponse.value, 'text/html');
          projectDocument.querySelectorAll('.rq-project-showcase').forEach((project, index) => {
            const title = project.dataset.rqProjectName || project.querySelector('h3')?.textContent?.trim();
            if (!title) return;
            const id = project.id || `project-${String(index + 1).padStart(2, '0')}`;
            const content = [
              project.querySelector('.rq-project-meta-line')?.textContent,
              project.querySelector('.rq-project-showcase-copy p')?.textContent,
              ...[...project.querySelectorAll('.rq-tags span')].map((tag) => tag.textContent)
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            items.push({ title, url: `/projects/#${id}`, content, kind: 'PROJECT' });
          });
        }

        const seen = new Set();
        return items.filter((item) => {
          const key = `${item.url}|${item.title}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });

      return indexPromise;
    };

    const appendHighlighted = (target, text, words) => {
      const usefulWords = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
      if (!usefulWords.length) {
        target.textContent = text;
        return;
      }

      const escaped = usefulWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const expression = new RegExp(`(${escaped.join('|')})`, 'ig');
      text.split(expression).forEach((part) => {
        if (usefulWords.some((word) => word.toLowerCase() === part.toLowerCase())) {
          const mark = document.createElement('mark');
          mark.className = 'search-keyword';
          mark.textContent = part;
          target.append(mark);
        } else {
          target.append(document.createTextNode(part));
        }
      });
    };

    const renderResults = (items, rawQuery) => {
      const query = rawQuery.trim().toLowerCase();
      const words = query.split(/[-\s]+/).filter(Boolean);
      if (!words.length) {
        setSearchState('SEARCH CONSOLE ONLINE', 'Type a note, project, or idea.');
        return;
      }

      const matches = items
        .map((item) => {
          const title = item.title.toLowerCase();
          const content = item.content.toLowerCase();
          const searchable = `${title} ${content}`;
          if (!words.every((word) => searchable.includes(word))) return null;
          const score = words.reduce((total, word) => {
            const titleHits = title.split(word).length - 1;
            const contentHits = content.split(word).length - 1;
            return total + titleHits * 8 + Math.min(contentHits, 5);
          }, title.includes(query) ? 16 : 0);
          return { ...item, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, 9);

      if (!matches.length) {
        setSearchState('NO SIGNAL FOUND', `No result for “${rawQuery.trim()}”.`, 'empty');
        return;
      }

      const list = document.createElement('ul');
      list.className = 'search-result-list';
      matches.forEach((item) => {
        const row = document.createElement('li');
        const kind = document.createElement('span');
        kind.className = 'rq-search-kind';
        kind.textContent = item.kind;

        const title = document.createElement('a');
        title.className = 'search-result-title';
        title.href = item.url;
        appendHighlighted(title, item.title, words);

        const firstHit = words.reduce((best, word) => {
          const index = item.content.toLowerCase().indexOf(word);
          return index >= 0 && (best < 0 || index < best) ? index : best;
        }, -1);
        const start = Math.max(0, firstHit - 34);
        const excerpt = `${start > 0 ? '...' : ''}${item.content.slice(start, start + 165)}${item.content.length > start + 165 ? '...' : ''}`;
        const summary = document.createElement('p');
        summary.className = 'search-result';
        appendHighlighted(summary, excerpt, words);

        row.append(kind, title, summary);
        list.append(row);
      });
      resultContent.replaceChildren(list);
    };

    let lastTrigger = null;
    let previousOverflow = '';
    const openSearch = (trigger) => {
      lastTrigger = trigger || document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      setSearchState('INDEXING SIGNALS', 'Loading notes and project transmissions...', 'loading');
      loadSearchIndex()
        .then((items) => renderResults(items, input.value))
        .catch(() => setSearchState('INDEX OFFLINE', 'The local index could not be loaded.', 'error'));
      window.setTimeout(() => input.focus(), 120);
    };

    const closeSearch = () => {
      if (!overlay.classList.contains('active')) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = previousOverflow;
      if (lastTrigger instanceof HTMLElement) lastTrigger.focus({ preventScroll: true });
    };

    document.querySelectorAll('.search-popup-trigger').forEach((trigger) => {
      if (trigger.dataset.rqSearchBound === '1') return;

      trigger.dataset.rqSearchBound = '1';
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openSearch(trigger);
      });
    });

    input.addEventListener('input', (event) => {
      event.stopImmediatePropagation();
      loadSearchIndex()
        .then((items) => renderResults(items, input.value))
        .catch(() => setSearchState('INDEX OFFLINE', 'The local index could not be loaded.', 'error'));
    }, true);

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      const firstResult = resultContent.querySelector('.search-result-title');
      if (firstResult) {
        event.preventDefault();
        firstResult.focus();
      }
    });

    resultContent.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const links = [...resultContent.querySelectorAll('.search-result-title')];
      const index = links.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'ArrowDown' ? Math.min(index + 1, links.length - 1) : Math.max(index - 1, 0);
      links[next]?.focus();
    });

    resultContent.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) closeSearch();
    });

    const clearControl = popup.querySelector('.search-input-field-pre');
    const clearSearch = () => {
      input.value = '';
      input.focus();
      loadSearchIndex().then((items) => renderResults(items, ''));
    };
    clearControl?.addEventListener('click', clearSearch);
    clearControl?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        clearSearch();
      }
    });

    popup.querySelector('.close-popup-btn')?.addEventListener('click', closeSearch);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isTyping = target?.matches?.('input, textarea, select, [contenteditable="true"]');
      if (event.key === 'Escape' && overlay.classList.contains('active')) {
        event.preventDefault();
        closeSearch();
        return;
      }
      if (isTyping) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch(document.querySelector('.rq-nav-search'));
      }
    });

    setSearchState('SEARCH CONSOLE ONLINE', 'Type a note, project, or idea.');
  }

  function setupUtilityLayer() {
    const labels = [
      ['.tool-font-adjust-plus', '增大正文字号'],
      ['.tool-font-adjust-minus', '减小正文字号'],
      ['.tool-toggle-theme-mode', '切换明暗主题'],
      ['.tool-scroll-to-bottom', '滚动到页面底部'],
      ['.toggle-show-toc-tablet', '打开文章目录'],
      ['.tool-toggle-show', '展开页面工具'],
      ['.tool-scroll-to-top', '返回页面顶部'],
      ['.post-tools .toggle-show-toc', '打开文章目录'],
      ['.post-tools .full-screen', '切换全屏阅读']
    ];

    labels.forEach(([selector, label]) => {
      document.querySelectorAll(selector).forEach((tool) => {
        tool.setAttribute('role', 'button');
        tool.setAttribute('tabindex', '0');
        tool.setAttribute('aria-label', label);
        tool.setAttribute('title', label);
        tool.querySelector('.fa-spin')?.classList.remove('fa-spin');
        if (tool.dataset.rqKeyboardReady === '1') return;
        tool.dataset.rqKeyboardReady = '1';
        tool.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          tool.click();
        });
      });
    });

    const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
    document.querySelectorAll('.footer .count-item .item-value').forEach((value) => {
      const formatCount = () => {
        const text = value.textContent.trim();
        if (!/^\d{4,}$/.test(text)) return;
        const count = Number(text);
        if (!Number.isFinite(count)) return;
        value.title = count.toLocaleString('en');
        value.textContent = formatter.format(count);
      };
      new MutationObserver(formatCount).observe(value, { childList: true, characterData: true, subtree: true });
      formatCount();
    });

    document.body.classList.add('rq-utility-ready');
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
    setupPostDossier();
    setupReadingProgress();
    setupTypewriters();
    setupSearchConsole();
    setupUtilityLayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
