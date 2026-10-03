/* Data-driven project cockpit. */
(function () {
  'use strict';
  function initialize() {
    const terminal = document.querySelector('#rq-flight-deck');
    const trigger = document.querySelector('[data-open-deck]');
    if (!terminal || terminal.dataset.bound) return;
    terminal.dataset.bound = 'true';
    trigger.addEventListener('click', () => terminal.showModal());
    terminal.querySelector('[data-close-deck]').addEventListener('click', () => terminal.close());
    terminal.addEventListener('click', event => { if (event.target === terminal) terminal.close(); });
    terminal.addEventListener('close', () => trigger.focus({ preventScroll: true }));
    terminal.querySelectorAll('[data-deck-select]').forEach(button => button.addEventListener('click', () => {
      terminal.querySelectorAll('[data-deck-select]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      terminal.querySelectorAll('[data-deck-panel]').forEach(panel => { panel.hidden = panel.dataset.deckPanel !== button.dataset.deckSelect; });
    }));
    terminal.querySelectorAll('a').forEach(link => link.addEventListener('click', () => terminal.close()));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  document.addEventListener('pjax:complete', initialize);
})();
