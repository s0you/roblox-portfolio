// Independent of app.js: a failed project request must never trap the visitor.
(() => {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const started = performance.now();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let finished = false;
  let content = [];
  root.classList.add('is-loading');

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(deadline);
    document.removeEventListener('keydown', onKey);
    const loader = document.querySelector('#site-loader');
    const restoreFocus = loader?.contains(document.activeElement);
    loader?.classList.add('is-leaving');
    if (loader) loader.inert = true;
    root.classList.remove('is-loading');
    content.forEach((element) => {
      element.inert = false;
    });
    if (restoreFocus) document.querySelector('header .brand')?.focus({ preventScroll: true });
    setTimeout(() => loader?.remove(), reducedMotion.matches ? 0 : 620);
  }
  function onKey(event) {
    if (event.key === 'Escape') finish();
  }
  const deadline = setTimeout(finish, 4500);
  document.addEventListener('keydown', onKey);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) finish();
  });

  document.addEventListener(
    'DOMContentLoaded',
    async () => {
      if (finished) {
        document.querySelector('#site-loader')?.remove();
        return;
      }
      content = [...document.querySelectorAll('body > header, body > main, body > footer')].filter(
        (element) => !element.inert
      );
      content.forEach((element) => {
        element.inert = true;
      });
      const portrait = document.querySelector('.hero-avatar');
      const portraitReady = portrait?.decode
        ? portrait.decode().catch(() => {})
        : Promise.resolve();
      const fontsReady = document.fonts
        ? Promise.race([document.fonts.ready, wait(800)])
        : Promise.resolve();
      await Promise.all([portraitReady, fontsReady]);
      await wait(Math.max(0, (reducedMotion.matches ? 0 : 2600) - (performance.now() - started)));
      finish();
    },
    { once: true }
  );
})();
