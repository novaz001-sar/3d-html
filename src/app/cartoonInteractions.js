const BURST_WORDS = ['MEOW!', 'PAW!', 'STAR!', 'WOW!', 'NICE!'];
const CLICKABLE_SELECTOR = [
  'button',
  '.button',
  '.btn',
  '[role="button"]',
  '.answer-card',
  '.option-card',
  '.choice',
  '.answer-option'
].join(',');
const STAGE_SELECTOR = 'canvas, .canvas-wrap, .canvas-shell, .game-stage, .editor-stage';
const TILT_SELECTOR = [
  '.card',
  '.level-card',
  '.object-card',
  '.question-card',
  '.answer-card',
  '.option-card',
  '.stat-card'
].join(',');

export function mountCartoonInteractions() {
  if (document.documentElement.dataset.cartoonInteractions === 'cat-planet') {
    return;
  }

  document.documentElement.dataset.cartoonInteractions = 'cat-planet';

  const layer = document.createElement('div');
  layer.className = 'cartoon-layer';
  document.body.append(layer);

  const figure = createCatPlanetFigure(layer);
  const logo = createCatPlanetLogo(layer, figure);

  document.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (target?.closest('.cat-planet-figure, .cat-planet-logo')) {
      return;
    }

    if (target?.closest(CLICKABLE_SELECTOR)) {
      makeBurst(layer, event.clientX, event.clientY, 'button');
      return;
    }

    if (target?.closest(STAGE_SELECTOR)) {
      makeRing(layer, event.clientX, event.clientY);
      makeBurst(layer, event.clientX, event.clientY, 'stage');
      return;
    }

    makeBurst(layer, event.clientX, event.clientY, 'soft');
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

  window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) {
      return;
    }

    if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      figure.click();
    }
  });

  window.setTimeout(() => {
    logo.classList.add('is-awake');
    figure.classList.add('is-awake');
  }, 250);
}

function createCatPlanetLogo(layer, figure) {
  const logo = document.createElement('button');
  logo.className = 'cat-planet-logo';
  logo.type = 'button';
  logo.setAttribute('aria-label', 'Cat Planet logo');
  logo.innerHTML = [
    '<span class="cat-logo-mark">',
    '<span class="cat-logo-orbit"></span>',
    '<span class="cat-logo-face"><span></span></span>',
    '</span>',
    '<span class="cat-logo-copy">',
    '<strong>Cat Planet</strong>',
    '<small>3D play lab</small>',
    '</span>'
  ].join('');

  logo.addEventListener('click', (event) => {
    event.stopPropagation();
    logo.classList.add('is-twinkling');
    figure.click();
    removeClassAfter(logo, 'is-twinkling', 720);

    const rect = logo.getBoundingClientRect();
    makeBurst(layer, rect.left + rect.width / 2, rect.top + rect.height / 2, 'logo');
  });

  document.body.append(logo);
  return logo;
}

function createCatPlanetFigure(layer) {
  const figure = document.createElement('button');
  figure.className = 'cat-planet-figure';
  figure.type = 'button';
  figure.setAttribute('aria-label', 'Interactive Cat Planet figure');
  figure.innerHTML = [
    '<span class="cat-planet-halo cat-planet-halo-one"></span>',
    '<span class="cat-planet-halo cat-planet-halo-two"></span>',
    '<span class="cat-planet-stars"><i></i><i></i><i></i></span>',
    '<span class="cat-planet-tail"></span>',
    '<span class="cat-planet-body">',
    '<span class="cat-ear cat-ear-left"></span>',
    '<span class="cat-ear cat-ear-right"></span>',
    '<span class="cat-face">',
    '<span class="cat-eye cat-eye-left"></span>',
    '<span class="cat-eye cat-eye-right"></span>',
    '<span class="cat-nose"></span>',
    '<span class="cat-mouth"></span>',
    '<span class="cat-whiskers cat-whiskers-left"></span>',
    '<span class="cat-whiskers cat-whiskers-right"></span>',
    '</span>',
    '</span>',
    '<span class="cat-planet-shadow"></span>',
    '<span class="cat-planet-bubble">MEOW!</span>'
  ].join('');

  let mood = 0;

  figure.addEventListener('click', (event) => {
    event.stopPropagation();
    mood = (mood + 1) % BURST_WORDS.length;
    figure.dataset.mood = String(mood);
    figure.querySelector('.cat-planet-bubble').textContent = BURST_WORDS[mood];
    figure.classList.add('is-reacting');
    removeClassAfter(figure, 'is-reacting', 820);

    const rect = figure.getBoundingClientRect();
    makeBurst(layer, rect.left + rect.width / 2, rect.top + rect.height / 2, 'cat');
    makePaws(layer, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  document.body.append(figure);
  return figure;
}

function makeBurst(layer, x, y, tone) {
  const isSmallScreen = window.matchMedia('(max-width: 720px)').matches;
  const count = tone === 'soft' ? 5 : isSmallScreen ? 7 : 11;
  const word = BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)];

  if (tone !== 'soft' && !isSmallScreen) {
    const label = document.createElement('span');
    label.className = 'cartoon-word-pop';
    label.textContent = word;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    layer.append(label);
    removeAfter(label, 760);
  }

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement('span');
    const angle = (Math.PI * 2 * index) / count;
    const distance = (isSmallScreen ? 22 : 34) + Math.random() * (isSmallScreen ? 28 : 54);
    const hue = 22 + Math.random() * 220;

    spark.className = `cartoon-spark cartoon-spark-${index % 4}`;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--spark-hue', `${hue.toFixed(0)}deg`);
    spark.style.setProperty('--spark-scale', `${(0.62 + Math.random() * 0.82).toFixed(2)}`);
    layer.append(spark);
    removeAfter(spark, 860);
  }
}

function makePaws(layer, x, y) {
  for (let index = 0; index < 5; index += 1) {
    const paw = document.createElement('span');
    const angle = -Math.PI / 1.15 + index * 0.46;
    const distance = 30 + index * 8;

    paw.className = 'cat-paw-pop';
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;
    paw.style.setProperty('--paw-x', `${Math.cos(angle) * distance}px`);
    paw.style.setProperty('--paw-y', `${Math.sin(angle) * distance}px`);
    paw.style.setProperty('--paw-delay', `${index * 45}ms`);
    layer.append(paw);
    removeAfter(paw, 920);
  }
}

function makeRing(layer, x, y) {
  const ring = document.createElement('span');
  ring.className = 'cartoon-boing-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  layer.append(ring);
  removeAfter(ring, 700);
}

function updateCatGaze(clientX, clientY) {
  const x = (clientX / window.innerWidth - 0.5) * 2;
  const y = (clientY / window.innerHeight - 0.5) * 2;

  document.documentElement.style.setProperty('--cat-look-x', `${(x * 4).toFixed(2)}px`);
  document.documentElement.style.setProperty('--cat-look-y', `${(y * 3).toFixed(2)}px`);
  document.documentElement.style.setProperty('--cat-parallax-x', `${(x * 7).toFixed(2)}px`);
  document.documentElement.style.setProperty('--cat-parallax-y', `${(y * 5).toFixed(2)}px`);
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
  target.style.setProperty('--cartoon-tilt-x', `${(-y * 4).toFixed(2)}deg`);
  target.style.setProperty('--cartoon-tilt-y', `${(x * 5).toFixed(2)}deg`);
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

function removeClassAfter(element, className, delay) {
  window.setTimeout(() => {
    element.classList.remove(className);
  }, delay);
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
