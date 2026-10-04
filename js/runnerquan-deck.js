/* Data-driven project cockpit. */
(function () {
  'use strict';
  function initialize() {
    const terminal = document.querySelector('#rq-flight-deck');
    const trigger = document.querySelector('[data-open-deck]');
    if (!terminal || !trigger || terminal.dataset.bound) return;
    terminal.dataset.bound = 'true';
    trigger.addEventListener('click', () => terminal.showModal());
    terminal.querySelector('[data-close-deck]').addEventListener('click', () => terminal.close());
    // Only an actual backdrop click dismisses the dialog; its padding is usable space.
    terminal.addEventListener('click', event => {
      if (event.target !== terminal) return;
      const rect = terminal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) terminal.close();
    });
    terminal.addEventListener('close', () => trigger.focus({ preventScroll: true }));
    terminal.querySelectorAll('[data-deck-select]').forEach(button => button.addEventListener('click', () => {
      terminal.querySelectorAll('[data-deck-select]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      terminal.querySelectorAll('[data-deck-panel]').forEach(panel => { panel.hidden = panel.dataset.deckPanel !== button.dataset.deckSelect; });
    }));
    terminal.querySelector('.rq-deck-switch').addEventListener('keydown', event => {
      const buttons = [...terminal.querySelectorAll('[data-deck-select]')];
      const index = buttons.indexOf(event.target);
      if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      buttons[next].click();
    });
    terminal.querySelectorAll('a').forEach(link => link.addEventListener('click', () => terminal.close()));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  document.addEventListener('pjax:complete', initialize);
})();
