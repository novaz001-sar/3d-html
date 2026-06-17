const BURST_WORDS = ['POP!', 'WOW!', 'BOING!', 'ZAP!', 'NICE!'];
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
  if (document.documentElement.dataset.cartoonInteractions === 'on') {
    return;
  }

  document.documentElement.dataset.cartoonInteractions = 'on';

  const layer = document.createElement('div');
  layer.className = 'cartoon-layer';
  document.body.append(layer);

  const mascot = createMascot(layer);

  document.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (target?.closest(CLICKABLE_SELECTOR)) {
      popElement(target.closest(CLICKABLE_SELECTOR));
      makeBurst(layer, event.clientX, event.clientY, 'click');
      return;
    }

    if (target?.closest('canvas, .canvas-wrap, .canvas-shell, .game-stage, .editor-stage')) {
      makeRing(layer, event.clientX, event.clientY);
      return;
    }

    makeBurst(layer, event.clientX, event.clientY, 'soft');
  }, { passive: true });

  document.addEventListener('pointerenter', (event) => {
    const target = event.target instanceof Element ? event.target.closest(CLICKABLE_SELECTOR) : null;

    if (target) {
      wiggleElement(target);
    }
  }, true);

  document.addEventListener('pointermove', (event) => {
    const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;

    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    target.classList.add('cartoon-tilt');
    target.style.setProperty('--cartoon-tilt-x', `${(-y * 5).toFixed(2)}deg`);
    target.style.setProperty('--cartoon-tilt-y', `${(x * 6).toFixed(2)}deg`);
    target.style.setProperty('--cartoon-shine-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    target.style.setProperty('--cartoon-shine-y', `${((y + 0.5) * 100).toFixed(1)}%`);
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
      mascot.click();
    }
  });
}

function createMascot(layer) {
  const mascot = document.createElement('button');
  mascot.className = 'cartoon-mascot';
  mascot.type = 'button';
  mascot.setAttribute('aria-label', 'Cartoon helper');
  mascot.innerHTML = [
    '<span class="cartoon-mascot-face"><span></span></span>',
    '<span class="cartoon-mascot-bubble">POP!</span>'
  ].join('');
  document.body.append(mascot);

  let mood = 0;

  mascot.addEventListener('click', (event) => {
    event.stopPropagation();
    mood = (mood + 1) % BURST_WORDS.length;
    mascot.querySelector('.cartoon-mascot-bubble').textContent = BURST_WORDS[mood];
    mascot.dataset.mood = String(mood);
    restartAnimation(mascot, 'is-jumping');

    const rect = mascot.getBoundingClientRect();
    makeBurst(layer, rect.left + rect.width / 2, rect.top + rect.height / 2, 'mascot');
  });

  return mascot;
}

function makeBurst(layer, x, y, tone) {
  const count = tone === 'soft' ? 7 : 12;
  const word = BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)];

  if (tone !== 'soft') {
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
    const distance = 28 + Math.random() * 56;
    const hue = 20 + Math.random() * 210;

    spark.className = `cartoon-spark cartoon-spark-${index % 4}`;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--spark-hue', `${hue.toFixed(0)}deg`);
    spark.style.setProperty('--spark-scale', `${(0.65 + Math.random() * 0.85).toFixed(2)}`);
    layer.append(spark);
    removeAfter(spark, 860);
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

function wiggleElement(element) {
  restartAnimation(element, 'cartoon-wiggle');
}

function popElement(element) {
  restartAnimation(element, 'cartoon-pop');
}

function clearTilt(element) {
  element.classList.remove('cartoon-tilt');
  element.style.removeProperty('--cartoon-tilt-x');
  element.style.removeProperty('--cartoon-tilt-y');
  element.style.removeProperty('--cartoon-shine-x');
  element.style.removeProperty('--cartoon-shine-y');
}

function restartAnimation(element, className) {
  element.classList.remove(className);
  window.requestAnimationFrame(() => {
    element.classList.add(className);
  });
}

function removeAfter(element, delay) {
  window.setTimeout(() => {
    element.remove();
  }, delay);
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
