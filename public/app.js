// Small, interruptible transitions. No animation libraries required.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const modalAnimations = new WeakMap();
const modalCloseTasks = new WeakMap();
const imageAnimations = new WeakMap();
const revealOrder = new WeakMap();
const revealObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            revealObserver.unobserve(entry.target);
            if (motionPreference.matches || !entry.target.animate) return;
            entry.target.animate(
              [
                { opacity: 0, transform: 'translateY(15px)' },
                { opacity: 1, transform: 'translateY(0)' }
              ],
              {
                duration: 390,
                delay: Math.min((revealOrder.get(entry.target) || 0) * 45, 135),
                easing: 'cubic-bezier(.22,1,.36,1)',
                fill: 'backwards'
              }
            );
          });
        },
        { threshold: 0.08 }
      )
    : null;
function revealProjects() {
  revealObserver?.disconnect();
  document.querySelectorAll('#projects .project').forEach((card, index) => {
    revealOrder.set(card, index);
    if (!motionPreference.matches) revealObserver?.observe(card);
  });
}
function openModal(modal) {
  if (modal.open) return;
  modalAnimations.get(modal)?.cancel();
  modal.showModal();
  modal.scrollTop = 0;
  if (motionPreference.matches || !modal.animate) return;
  const animation = modal.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 360,
    easing: 'cubic-bezier(.22,1,.36,1)'
  });
  modalAnimations.set(modal, animation);
}
function closeModal(modal) {
  if (!modal.open) return Promise.resolve();
  if (modalCloseTasks.has(modal)) return modalCloseTasks.get(modal);
  const task = (async () => {
    if (modal === dialog && lightbox.open) await closeModal(lightbox);
    const current = getComputedStyle(modal);
    const start = { opacity: current.opacity };
    modalAnimations.get(modal)?.cancel();
    modal.dataset.closing = 'true';
    if (!motionPreference.matches && modal.animate) {
      const animation = modal.animate([start, { opacity: 0 }], {
        duration: 200,
        easing: 'cubic-bezier(.4,0,1,1)',
        fill: 'forwards'
      });
      modalAnimations.set(modal, animation);
      try {
        await animation.finished;
      } catch {}
    }
    if (modal.open) modal.close();
    modalAnimations.get(modal)?.cancel();
    delete modal.dataset.closing;
  })();
  modalCloseTasks.set(modal, task);
  const clear = () => modalCloseTasks.delete(modal);
  void task.then(clear, clear);
  return task;
}
document.querySelectorAll('#project-dialog, #gallery-lightbox').forEach((modal) => {
  modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    void closeModal(modal);
  });
});
document.addEventListener(
  'load',
  (event) => {
    const image = event.target;
    if (
      !['gallery-image', 'lightbox-image'].includes(image.id) ||
      motionPreference.matches ||
      !image.animate
    )
      return;
    imageAnimations.get(image)?.cancel();
    imageAnimations.set(
      image,
      image.animate([{ opacity: 0.4 }, { opacity: 1 }], {
        duration: 280,
        easing: 'cubic-bezier(.22,1,.36,1)'
      })
    );
  },
  true
);

const icon = (name) =>
  `<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
const list = document.querySelector('#projects');
const filters = document.querySelector('#project-filters');
const dialog = document.querySelector('#project-dialog');
const lightbox = document.querySelector('#gallery-lightbox');
const modalContent = document.querySelector('#modal-content');
const closeProjectButton = document.querySelector('.modal-close');
let projects = [];
let activeProject = null;
let imageIndex = 0;
let restoreInitialAnchor = true;

const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
function safeURL(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}
const padded = (n) => String(n).padStart(2, '0');
const imagesFor = (p) =>
  p.images?.length ? p.images : [{ src: p.thumbnail, alt: p.thumbnailAlt || p.title, caption: '' }];

function renderProjects(filter = 'all') {
  const shown = projects.filter((p) => filter === 'all' || p.category === filter);
  list.innerHTML = shown.length
    ? shown
        .map((p) => {
          const visual = /^visual-[a-z-]+$/.test(p.visual || '') ? p.visual : '';
          return /* HTML */ `<article class="project">
            <button
              class="project-button"
              data-project="${escape(p.id)}"
              aria-label="View details: ${escape(p.title)}"
            >
              <div class="project-visual ${visual}">
                <span class="project-chip">${escape(p.label)}</span>
                <img
                  src="${escape(safeURL(p.thumbnail))}"
                  alt="${escape(p.thumbnailAlt || p.title)}"
                  loading="lazy"
                  width="640"
                  height="520"
                />
                <span class="card-media-error" hidden>Image unavailable</span>
                <span class="project-image-count"
                  >▧ ${imagesFor(p).length} ${imagesFor(p).length === 1 ? 'image' : 'images'}</span
                >
                <span class="project-arrow" aria-hidden="true">${icon('right')}</span>
              </div>
              <div class="project-info">
                <div>
                  <h3>${escape(p.title)}</h3>
                  <p>${escape(p.subtitle)}</p>
                </div>
                <span>${escape(p.type)}</span>
              </div>
            </button>
            <div class="project-tags">
              ${(p.tags || []).map((t) => `<span>${escape(t)}</span>`).join('')}
            </div>
          </article>`;
        })
        .join('')
    : '<p class="projects-message">No projects in this category yet.</p>';
  document.querySelector('#filter-status').textContent =
    `${shown.length} ${shown.length === 1 ? 'project' : 'projects'} shown`;
  revealProjects();
}

async function loadProjects() {
  list.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/data/projects.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Project data unavailable');
    const data = await response.json();
    if (!Array.isArray(data.projects) || !Array.isArray(data.categories))
      throw new Error('Invalid data');
    projects = data.projects;
    document.querySelectorAll('[data-project-count]').forEach((el) => {
      el.textContent = padded(projects.length);
    });
    const categories = [
      { id: 'all', name: 'All projects' },
      ...data.categories.filter((c) => projects.some((p) => p.category === c.id))
    ];
    filters.innerHTML = categories
      .map((c) => {
        const count =
          c.id === 'all' ? projects.length : projects.filter((p) => p.category === c.id).length;
        return `<button class="${c.id === 'all' ? 'active' : ''}" data-filter="${escape(c.id)}" aria-pressed="${c.id === 'all'}">${escape(c.name)} <sup>${padded(count)}</sup></button>`;
      })
      .join('');
    renderProjects();
    // JSON renders after the first fragment navigation; restore that position once.
    if (restoreInitialAnchor) {
      restoreInitialAnchor = false;
      const initialHash = location.hash;
      const anchor = document.getElementById(initialHash.slice(1));
      if (anchor)
        requestAnimationFrame(() => {
          if (location.hash === initialHash)
            anchor.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
    }
  } catch {
    list.innerHTML =
      '<div class="projects-message"><p>Projects could not be loaded.</p><button class="button dark" data-retry>Try again ↻</button></div>';
    document.querySelector('#filter-status').textContent = 'Projects could not be loaded.';
  } finally {
    list.setAttribute('aria-busy', 'false');
  }
}
filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  filters.querySelectorAll('button').forEach((el) => {
    el.classList.toggle('active', el === button);
    el.setAttribute('aria-pressed', String(el === button));
  });
  renderProjects(button.dataset.filter);
});

function openProject(p) {
  activeProject = p;
  imageIndex = 0;
  const images = imagesFor(p);
  modalContent.innerHTML = /* HTML */ `<div class="project-modal-header">
      <span class="modal-category">${escape(p.label)}</span>
      <h2 class="modal-title" id="modal-title">${escape(p.title)}</h2>
      <p class="modal-subtitle-line">${escape(p.subtitle)}</p>
    </div>
    <div class="project-modal-layout">
      <div class="gallery-column">
        <div class="gallery-stage" data-swipe>
          <img id="gallery-image" alt="" width="640" height="520" />
          <span class="gallery-media-error" hidden>Image unavailable.</span>
          <button class="gallery-expand" data-expand aria-label="View image fullscreen">
            ⛶ <span>Expand</span>
          </button>
        </div>
        <div class="gallery-toolbar">
          <span class="gallery-counter" id="gallery-counter" aria-live="polite"> </span>
          <div class="gallery-controls" ${images.length < 2 ? 'hidden' : ''}>
            <button class="gallery-control" data-gallery-prev aria-label="Previous image">
              ${icon('prev')}
            </button>
            <button class="gallery-control" data-gallery-next aria-label="Next image">
              ${icon('next')}
            </button>
          </div>
        </div>
        <div
          class="gallery-thumbnails"
          aria-label="Choose a project image"
          ${images.length < 2 ? 'hidden' : ''}
        >
          ${images
            .map(
              (image, index) => /* HTML */ `
                <button
                  data-gallery-index="${index}"
                  aria-label="View image ${index + 1}: ${escape(image.alt || p.title)}"
                  aria-pressed="false"
                >
                  <img src="${escape(safeURL(image.src))}" alt="" loading="lazy" />
                </button>
              `
            )
            .join('')}
        </div>
        <p class="gallery-caption" id="gallery-caption"></p>
      </div>
      <div class="project-detail-column">
        <p class="modal-intro">${escape(p.intro)}</p>
        <h3 class="modal-subtitle">Contributions & features</h3>
        <ul class="modal-list">
          ${(p.details || []).map((d) => `<li>${escape(d)}</li>`).join('')}
        </ul>
        ${p.note ? `<p class="modal-note">${escape(p.note)}</p>` : ''}
        <div class="modal-actions">
          ${safeURL(p.link)
            ? `<a class="button dark" href="${escape(safeURL(p.link))}" target="_blank" rel="noreferrer">View experience ${icon('external')}</a>`
            : ''}<a class="modal-contact text-link" href="#contact"
            >Discuss a project ${icon('right')}</a
          >
        </div>
      </div>
    </div>`;
  modalContent.querySelector('.project-modal-header').append(closeProjectButton);
  dialog.setAttribute('aria-labelledby', 'modal-title');
  updateGallery();
  openModal(dialog);
  document.documentElement.classList.add('has-dialog');
}
function setImage(element, image) {
  const src = safeURL(image.src);
  element.alt = image.alt || activeProject.title;
  // Preserve the current image and animation when the selection has not changed.
  if (element.getAttribute('src') === src) return;
  imageAnimations.get(element)?.cancel();
  element.hidden = false;
  element.parentElement.classList.remove('has-image-error');
  const error = element.parentElement.querySelector('.gallery-media-error');
  if (error) error.hidden = true;
  element.src = src;
}
function updateGallery() {
  if (!activeProject) return;
  const images = imagesFor(activeProject);
  const image = images[imageIndex];
  setImage(document.querySelector('#gallery-image'), image);
  const counter = `${padded(imageIndex + 1)} / ${padded(images.length)}`;
  document.querySelector('#gallery-counter').textContent = counter;
  document.querySelector('#gallery-caption').textContent = image.caption || '';
  document.querySelectorAll('[data-gallery-index]').forEach((button) => {
    const selected = Number(button.dataset.galleryIndex) === imageIndex;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('selected', selected);
  });
  document.querySelectorAll('[data-gallery-prev]').forEach((button) => {
    button.disabled = imageIndex === 0;
  });
  document.querySelectorAll('[data-gallery-next]').forEach((button) => {
    button.disabled = imageIndex === images.length - 1;
  });
  if (lightbox.open) {
    setImage(document.querySelector('#lightbox-image'), image);
    document.querySelector('#lightbox-caption').textContent =
      image.caption || image.alt || activeProject.title;
    document.querySelector('#lightbox-counter').textContent = counter;
  }
}
function stepGallery(direction) {
  if (!activeProject) return;
  const nextIndex = Math.max(
    0,
    Math.min(imagesFor(activeProject).length - 1, imageIndex + direction)
  );
  if (nextIndex === imageIndex) return;
  imageIndex = nextIndex;
  updateGallery();
}
list.addEventListener('click', (event) => {
  if (event.target.closest('[data-retry]')) {
    loadProjects();
    return;
  }
  const button = event.target.closest('[data-project]');
  const project = projects.find((p) => p.id === button?.dataset.project);
  if (project) openProject(project);
});
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-gallery-prev]')) stepGallery(-1);
  if (event.target.closest('[data-gallery-next]')) stepGallery(1);
  const thumbnail = event.target.closest('[data-gallery-index]');
  if (thumbnail) {
    imageIndex = Number(thumbnail.dataset.galleryIndex);
    updateGallery();
  }
  if (event.target.closest('[data-expand]')) {
    openModal(lightbox);
    updateGallery();
  }
});
document.addEventListener('keydown', (event) => {
  if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepGallery(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
let touchOrigin = null;
document.addEventListener(
  'touchstart',
  (event) => {
    const stage = event.target.closest('[data-swipe]');
    touchOrigin =
      stage && event.touches.length === 1
        ? { stage, x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
  },
  { passive: true }
);
document.addEventListener(
  'touchend',
  (event) => {
    if (!touchOrigin || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchOrigin.x;
    const dy = event.changedTouches[0].clientY - touchOrigin.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) stepGallery(dx < 0 ? 1 : -1);
    touchOrigin = null;
  },
  { passive: true }
);
document.addEventListener(
  'error',
  (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest('.gallery-thumbnails')) {
      img.hidden = true;
      return;
    }
    const parent = img.parentElement;
    const message = parent.querySelector('.gallery-media-error, .card-media-error');
    if (message) {
      img.hidden = true;
      message.hidden = false;
    }
  },
  true
);
closeProjectButton.addEventListener('click', () => {
  void closeModal(dialog);
});
document.querySelector('.lightbox-close').addEventListener('click', () => {
  void closeModal(lightbox);
});
dialog.addEventListener('close', () => {
  if (lightbox.open) void closeModal(lightbox);
  document.documentElement.classList.remove('has-dialog');
  activeProject = null;
});
for (const modal of [dialog, lightbox])
  modal.addEventListener('click', (event) => {
    if (event.target.closest('.modal-contact')) {
      event.preventDefault();
      void closeModal(dialog).then(() => {
        location.hash = 'contact';
      });
      return;
    }
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      void closeModal(modal);
  });

const menu = document.querySelector('.menu-button');
const nav = document.querySelector('nav');
const mobileLayout = matchMedia('(max-width: 700px)');
function syncMenuAccessibility() {
  nav.inert = mobileLayout.matches && !nav.classList.contains('open');
}
function closeMenu() {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open menu');
  menu.textContent = '☰';
  syncMenuAccessibility();
}
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.textContent = open ? '×' : '☰';
  syncMenuAccessibility();
});
mobileLayout.addEventListener('change', closeMenu);
syncMenuAccessibility();
document.querySelectorAll('header a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
loadProjects();

// Both editions share the same content, fonts, and project galleries.
const themeButtons = document.querySelectorAll('[data-set-theme]');
let themeTransition;
function setTheme(theme) {
  const chosen = theme === 'light' ? 'light' : 'dark';
  document.body.dataset.theme = chosen;
  themeButtons.forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.setTheme === chosen))
  );
  document.querySelector('#edition-label').textContent =
    chosen === 'light' ? 'LIGHT EDITION / 2026' : 'DARK EDITION / 2026';
  document.querySelector('meta[name="theme-color"]').content =
    chosen === 'light' ? '#142e2b' : '#121212';
}
themeButtons.forEach((button) =>
  button.addEventListener('click', () => {
    const theme = button.dataset.setTheme;
    themeTransition?.skipTransition();
    if (motionPreference.matches || !document.startViewTransition) {
      setTheme(theme);
      return;
    }
    themeTransition = document.startViewTransition(() => setTheme(theme));
    // Skipping a snapshot during rapid clicks rejects ready, even if the update succeeds.
    void themeTransition.ready.catch(() => {});
    void themeTransition.finished.catch(() => {});
  })
);
// Start every page load in Dark; Light remains available during the visit.
setTheme('dark');
