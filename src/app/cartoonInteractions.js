import { playCatMeow } from '../services/catSound.js';

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
const LEVEL_SELECTOR = '.level-card';
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
  if (document.documentElement.dataset.cartoonInteractions === 'standalone-cat-planet') {
    return;
  }

  document.documentElement.dataset.cartoonInteractions = 'standalone-cat-planet';

  const layer = document.createElement('div');
  layer.className = 'cartoon-layer';
  document.body.append(layer);

  const companion = createCatCompanion(layer);
  updateCompanionScreen(companion);

  const root = document.getElementById('app') || document.body;
  const observer = new MutationObserver(() => {
    updateCompanionScreen(companion);
  });
  observer.observe(root, { childList: true, subtree: true });

  document.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return;

    const target = event.target instanceof Element ? event.target : null;
    const levelCard = target?.closest(LEVEL_SELECTOR);

    if (target?.closest('.cat-companion')) {
      playCatMeow();
      reactCompanion(companion, layer, 'hello');
      return;
    }

    if (levelCard) {
      reactCompanion(companion, layer, 'level', levelCard.getBoundingClientRect());
      makeLevelBurst(layer, levelCard);
      return;
    }

    if (target?.closest('.cat-manual-card')) {
      const rect = target.closest('.cat-manual-card').getBoundingClientRect();
      reactCompanion(companion, layer, 'manual', rect);
      makePaws(layer, rect.left + rect.width / 2, rect.top + rect.height / 2);
      makeBurst(layer, event.clientX, event.clientY, 'manual');
      return;
    }

    if (target?.closest('.cat-result-cardlet, .stars')) {
      const rect = target.closest('.result-card')?.getBoundingClientRect();
      reactCompanion(companion, layer, 'result', rect);
      makeResultBurst(layer, rect || { left: event.clientX, top: event.clientY, width: 0, height: 0 });
      return;
    }

    if (target?.closest(CONTROL_SELECTOR)) {
      reactCompanion(companion, layer, catRoleForControl(target.closest(CONTROL_SELECTOR)));
      makeBurst(layer, event.clientX, event.clientY, 'control');
      return;
    }

    if (target?.closest(STAGE_SELECTOR)) {
      reactCompanion(companion, layer, 'stage');
      makeRing(layer, event.clientX, event.clientY);
    }
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    updateCatParallax(companion, event.clientX, event.clientY);
    tiltCard(event);
  }, { passive: true });

  document.addEventListener('pointerleave', (event) => {
    const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;
    if (target) clearTilt(target);
  }, true);
}

function createCatCompanion(layer) {
  const companion = document.createElement('button');
  companion.className = 'cat-companion';
  companion.type = 'button';
  companion.setAttribute('aria-label', 'Cat Planet helper');
  companion.innerHTML = [
    '<span class="cat-companion-orbit"></span>',
    '<span class="cat-companion-image"></span>',
    '<span class="cat-companion-badge">CAT</span>',
    '<span class="cat-companion-bubble">Tap me!</span>'
  ].join('');
  companion.addEventListener('click', (event) => {
    if (event.detail !== 0) return;
    playCatMeow();
    reactCompanion(companion, layer, 'hello');
  });
  document.body.append(companion);
  return companion;
}

function updateCompanionScreen(companion) {
  const screen = document.querySelector('.screen');
  const screenName = screen?.className?.match(/([a-z]+)-screen/)?.[1] || 'home';
  companion.dataset.screen = screenName;

  if (screenName === 'game') setCompanionMood(companion, 'game', 'Ready?');
  else if (screenName === 'editor') setCompanionMood(companion, 'editor', 'Build!');
  else if (screenName === 'result') setCompanionMood(companion, 'result', 'Yay!');
  else setCompanionMood(companion, 'home', 'Pick a stage');
}

function reactCompanion(companion, layer, role, rect) {
  const reactions = {
    cat: ['cat', 'Meow!'],
    diff: ['diff', 'Different?'],
    editor: ['editor', 'Build!'],
    exit: ['exit', 'Bye!'],
    export: ['export', 'Saved!'],
    hello: ['hello', 'Meow!'],
    home: ['home', 'Home!'],
    import: ['import', 'Load!'],
    lang: ['lang', 'Hello!'],
    level: ['level', 'Go!'],
    manual: ['manual', 'Tips!'],
    music: ['music', 'La la!'],
    ok: ['ok', 'OK!'],
    pause: ['pause', 'Pause'],
    play: ['play', 'Go!'],
    reset: ['reset', 'Again!'],
    result: ['result', 'Stars!'],
    same: ['same', 'Same?'],
    skip: ['skip', 'Skip!'],
    stage: ['stage', 'Spin!']
  };
  const [mood, text] = reactions[role] || reactions.cat;
  setCompanionMood(companion, mood, text);
  companion.classList.remove('is-reacting');
  window.requestAnimationFrame(() => companion.classList.add('is-reacting'));

  const ownRect = companion.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : ownRect.left + ownRect.width / 2;
  const y = rect ? rect.top + rect.height / 2 : ownRect.top + ownRect.height / 2;
  makeBurst(layer, x, y, 'cat');
}

function setCompanionMood(companion, mood, text) {
  companion.dataset.mood = mood;
  companion.querySelector('.cat-companion-badge').textContent = badgeForRole(mood);
  companion.querySelector('.cat-companion-bubble').textContent = text;
}

function updateCatParallax(companion, clientX, clientY) {
  const x = (clientX / window.innerWidth - 0.5) * 2;
  const y = (clientY / window.innerHeight - 0.5) * 2;
  companion.style.setProperty('--cat-float-x', `${(x * 8).toFixed(2)}px`);
  companion.style.setProperty('--cat-float-y', `${(y * 6).toFixed(2)}px`);
}

function catRoleForControl(control) {
  if (control.classList.contains('level-card')) return 'level';
  if (control.querySelector?.('#import-file')) return 'import';

  const homeAction = control.dataset.homeAction;
  const action = control.dataset.action;
  const gameAction = control.dataset.gameAction;
  const answer = control.dataset.answer;

  if (homeAction === 'export') return 'export';
  if (homeAction === 'editor') return 'editor';
  if (homeAction === 'manual') return 'manual';
  if (homeAction === 'close-manual') return 'ok';
  if (action === 'lang') return 'lang';
  if (action === 'music') return 'music';
  if (action === 'home') return 'home';
  if (gameAction === 'pause') return 'pause';
  if (gameAction === 'resume') return 'play';
  if (gameAction === 'reset') return 'reset';
  if (gameAction === 'exit') return 'exit';
  if (gameAction === 'skip') return 'skip';
  if (answer === 'same') return 'same';
  if (answer === 'different') return 'diff';
  return 'cat';
}

function badgeForRole(role) {
  const badges = {
    cat: 'CAT',
    diff: '!=',
    editor: 'ED',
    exit: 'OUT',
    export: 'EX',
    hello: 'CAT',
    home: 'HM',
    import: 'IN',
    lang: 'EN',
    level: 'LV',
    manual: '?',
    music: 'M',
    ok: 'OK',
    pause: 'II',
    play: 'GO',
    reset: 'RE',
    result: 'OK',
    same: '=',
    skip: 'SK',
    stage: '3D'
  };
  return badges[role] || 'CAT';
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

function makeLevelBurst(layer, levelCard) {
  const rect = levelCard.getBoundingClientRect();
  makeBurst(layer, rect.left + rect.width * 0.72, rect.top + rect.height * 0.36, 'level');
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

function tiltCard(event) {
  const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;

  if (!target || window.matchMedia('(max-width: 720px)').matches) return;

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
