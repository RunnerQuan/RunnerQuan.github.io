(function () {
  'use strict';

  function addStyle(href, id) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  addStyle('/css/runnerquan-kimi.css', 'rq-kimi-style');
  addStyle('/css/runnerquan-fullpage-v2.css', 'rq-fullpage-v2-style');
  addStyle('/css/runnerquan-fixes-v3.css', 'rq-fixes-v3-style');

  if (!document.getElementById('rq-fullpage-v2-script')) {
    const script = document.createElement('script');
    script.id = 'rq-fullpage-v2-script';
    script.src = '/js/runnerquan-fullpage-v2.js';
    script.defer = true;
    document.head.appendChild(script);
  }
})();