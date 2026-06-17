const BURST_WORDS = ['MEOW', 'PAW', 'STAR', 'YAY', 'NICE'];
const CONTROL_SELECTOR = [
  '.topbar .button',
  '.hero-actions .button',
  '.game-hud .button',
  '.answer-bar .button',
  '.manual .button',
  '.result-card .button',
  '.level-card'
].join(',');
const STAGE_SELECTOR = 'canvas, .canvas-wrap, .canvas-shell, .game-stage, .editor-stage';
const TILT_SELECTOR = [
  '.card',
  '.level-card',
  '.object-card',
  '.question-card',
  '.answer-card',
  '.option-card',
  '.stat-card',
  '.result-card'
].join(',');

export function mountCartoonInteractions() {
  if (document.documentElement.dataset.cartoonInteractions === 'integrated-cat-planet') {
    return;
  }

  document.documentElement.dataset.cartoonInteractions = 'integrated-cat-planet';

  const layer = document.createElement('div');
  layer.className = 'cartoon-layer';
  document.body.append(layer);

  const decorate = () => decorateCatPlanetUi(layer);
  decorate();

  const root = document.getElementById('app') || document.body;
  const observer = new MutationObserver(() => {
    decorate();
  });
  observer.observe(root, { childList: true, subtree: true });

  document.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (target?.closest('.cat-manual-card')) {
      const rect = target.closest('.cat-manual-card').getBoundingClientRect();
      makePaws(layer, rect.left + rect.width / 2, rect.top + rect.height / 2);
      makeBurst(layer, event.clientX, event.clientY, 'manual');
      return;
    }

    if (target?.closest('.cat-result-cardlet, .stars')) {
      const rect = target.closest('.result-card')?.getBoundingClientRect();
      makeResultBurst(layer, rect || { left: event.clientX, top: event.clientY, width: 0, height: 0 });
      return;
    }

    if (target?.closest(CONTROL_SELECTOR)) {
      pulseEmbeddedCat(target.closest(CONTROL_SELECTOR));
      makeBurst(layer, event.clientX, event.clientY, 'control');
      return;
    }

    if (target?.closest(STAGE_SELECTOR)) {
      makeRing(layer, event.clientX, event.clientY);
      return;
    }
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    updateCatGaze(event.clientX, event.clientY);
    tiltCard(event);
  }, { passive: true });

  document.addEventListener('pointerleave', (event) => {
    const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;

    if (target) {
      clearTilt(target);
    }
  }, true);
}

function decorateCatPlanetUi(layer) {
  document.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
    if (control.dataset.catIntegrated === 'true') {
      return;
    }

    control.dataset.catIntegrated = 'true';
    control.classList.add('cat-integrated-control');
    control.insertAdjacentHTML('afterbegin', catMiniPlanetMarkup());
  });

  const manual = document.querySelector('.manual');
  if (manual && manual.dataset.catManual !== 'true') {
    manual.dataset.catManual = 'true';
    manual.classList.add('cat-manual-panel');
    manual.querySelector('h2')?.insertAdjacentHTML('afterend', catManualMarkup());
    manual.querySelector('.cat-manual-card')?.addEventListener('click', (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      makePaws(layer, rect.left + rect.width / 2, rect.top + rect.height / 2);
      makeBurst(layer, rect.left + rect.width / 2, rect.top + rect.height / 2, 'manual');
    });
  }

  const result = document.querySelector('.result-card');
  if (result && result.dataset.catResult !== 'true') {
    result.dataset.catResult = 'true';
    result.classList.add('cat-result-panel');
    result.querySelector('h1')?.insertAdjacentHTML('afterend', catResultMarkup());
    result.querySelector('.cat-result-cardlet')?.addEventListener('click', () => {
      makeResultBurst(layer, result.getBoundingClientRect());
    });
  }
}

function catMiniPlanetMarkup() {
  return [
    '<span class="cat-mini-planet" aria-hidden="true">',
    '<span class="cat-mini-orbit"></span>',
    '<span class="cat-mini-ear cat-mini-ear-left"></span>',
    '<span class="cat-mini-ear cat-mini-ear-right"></span>',
    '<span class="cat-mini-face">',
    '<span class="cat-mini-eye cat-mini-eye-left"></span>',
    '<span class="cat-mini-eye cat-mini-eye-right"></span>',
    '<span class="cat-mini-mouth"></span>',
    '</span>',
    '</span>'
  ].join('');
}

function catManualMarkup() {
  return [
    '<button class="cat-manual-card" type="button" aria-label="Cat manual interaction">',
    '<span class="cat-inline-planet cat-inline-planet-guide">',
    '<span class="cat-inline-orbit"></span>',
    '<span class="cat-inline-ear cat-inline-ear-left"></span>',
    '<span class="cat-inline-ear cat-inline-ear-right"></span>',
    '<span class="cat-inline-face"><span></span></span>',
    '</span>',
    '<span class="cat-manual-copy">',
    '<strong>MEOW MANUAL</strong>',
    '<small>tap for tiny paw stars</small>',
    '</span>',
    '</button>'
  ].join('');
}

function catResultMarkup() {
  return [
    '<button class="cat-result-cardlet" type="button" aria-label="Cat result celebration">',
    '<span class="cat-inline-planet cat-inline-planet-result">',
    '<span class="cat-inline-orbit"></span>',
    '<span class="cat-inline-ear cat-inline-ear-left"></span>',
    '<span class="cat-inline-ear cat-inline-ear-right"></span>',
    '<span class="cat-inline-face"><span></span></span>',
    '<span class="cat-inline-sparkles"><i></i><i></i><i></i></span>',
    '</span>',
    '<span class="cat-result-copy">',
    '<strong>STAR CAT</strong>',
    '<small>tap to celebrate</small>',
    '</span>',
    '</button>'
  ].join('');
}

function pulseEmbeddedCat(control) {
  const cat = control.querySelector('.cat-mini-planet');

  if (!cat) {
    return;
  }

  cat.classList.remove('is-pulsing');
  window.requestAnimationFrame(() => {
    cat.classList.add('is-pulsing');
  });
}

function makeBurst(layer, x, y, tone) {
  const isSmallScreen = window.matchMedia('(max-width: 720px)').matches;
  const count = tone === 'manual' ? 9 : isSmallScreen ? 5 : 8;

  if (!isSmallScreen && tone !== 'control') {
    const label = document.createElement('span');
    label.className = 'cartoon-word-pop';
    label.textContent = BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)];
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    layer.append(label);
    removeAfter(label, 760);
  }

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement('span');
    const angle = (Math.PI * 2 * index) / count;
    const distance = (isSmallScreen ? 20 : 30) + Math.random() * (isSmallScreen ? 22 : 42);
    const hue = 28 + Math.random() * 210;

    spark.className = `cartoon-spark cartoon-spark-${index % 4}`;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--spark-hue', `${hue.toFixed(0)}deg`);
    spark.style.setProperty('--spark-scale', `${(0.58 + Math.random() * 0.72).toFixed(2)}`);
    layer.append(spark);
    removeAfter(spark, 820);
  }
}

function makeResultBurst(layer, rect) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height * 0.38;
  makeBurst(layer, centerX, centerY, 'result');
  makePaws(layer, centerX, centerY);

  for (let index = 0; index < 3; index += 1) {
    window.setTimeout(() => {
      makeBurst(
        layer,
        rect.left + rect.width * (0.24 + index * 0.26),
        rect.top + rect.height * (0.22 + Math.random() * 0.2),
        'result'
      );
    }, index * 110);
  }
}

function makePaws(layer, x, y) {
  for (let index = 0; index < 5; index += 1) {
    const paw = document.createElement('span');
    const angle = -Math.PI / 1.1 + index * 0.48;
    const distance = 24 + index * 8;

    paw.className = 'cat-paw-pop';
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;
    paw.style.setProperty('--paw-x', `${Math.cos(angle) * distance}px`);
    paw.style.setProperty('--paw-y', `${Math.sin(angle) * distance}px`);
    paw.style.setProperty('--paw-delay', `${index * 42}ms`);
    layer.append(paw);
    removeAfter(paw, 880);
  }
}

function makeRing(layer, x, y) {
  const ring = document.createElement('span');
  ring.className = 'cartoon-boing-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  layer.append(ring);
  removeAfter(ring, 680);
}

function updateCatGaze(clientX, clientY) {
  const x = (clientX / window.innerWidth - 0.5) * 2;
  const y = (clientY / window.innerHeight - 0.5) * 2;

  document.documentElement.style.setProperty('--cat-look-x', `${(x * 2.4).toFixed(2)}px`);
  document.documentElement.style.setProperty('--cat-look-y', `${(y * 1.8).toFixed(2)}px`);
}

function tiltCard(event) {
  const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;

  if (!target || window.matchMedia('(max-width: 720px)').matches) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  target.classList.add('cartoon-tilt');
  target.style.setProperty('--cartoon-tilt-x', `${(-y * 3).toFixed(2)}deg`);
  target.style.setProperty('--cartoon-tilt-y', `${(x * 4).toFixed(2)}deg`);
  target.style.setProperty('--cartoon-shine-x', `${((x + 0.5) * 100).toFixed(1)}%`);
  target.style.setProperty('--cartoon-shine-y', `${((y + 0.5) * 100).toFixed(1)}%`);
}

function clearTilt(element) {
  element.classList.remove('cartoon-tilt');
  element.style.removeProperty('--cartoon-tilt-x');
  element.style.removeProperty('--cartoon-tilt-y');
  element.style.removeProperty('--cartoon-shine-x');
  element.style.removeProperty('--cartoon-shine-y');
}

function removeAfter(element, delay) {
  window.setTimeout(() => {
    element.remove();
  }, delay);
}

