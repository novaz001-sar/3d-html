import { clone, clamp, esc, normalizeQuat } from '../core/utils.js';
import { drawObject, makeDragRotator, stepAutoRotation, syncVoxels } from '../render/voxelRenderer.js';

export function startGame(ctx, levelId) {
  const level = ctx.state.data.levels.find(item => item.id === levelId);
  if (!level || !level.questions?.length) return alert(ctx.t('emptyQuestions'));
  Object.assign(ctx.state.game, {
    level: clone(level),
    qIndex: 0,
    score: 0,
    timeLeft: Number(level.timeLimit || 60),
    zoom: 1,
    leftAuto: 0,
    feedback: '',
    feedbackKind: 'good',
    leftQ: [0, 0, 0, 1],
    rightQ: [0, 0, 0, 1],
    lastT: 0
  });
  ctx.state.paused = false;
  ctx.state.screen = 'game';
  loadQuestion(ctx);
  ctx.render();
  startTimer(ctx);
}

export function renderGame(ctx) {
  const { state, t } = ctx;
  const g = state.game;
  const total = g.level?.questions?.length || 0;
  return `
    <main class="screen game-screen">
      <header class="game-hud panel">
        <div>
          <h1>${esc(g.level?.name || '')}</h1>
          <p>${t('score')}: <strong id="hud-score">${g.score}</strong> · ${t('timeLeft')}: <strong id="hud-time">${Math.max(0, g.timeLeft)}</strong>s · ${g.qIndex + 1}/${total}</p>
        </div>
        <button class="button secondary" data-game-action="pause">${state.paused ? t('resume') : t('pause')}</button>
      </header>
      <section class="game-stage">
        <div class="viewer"><canvas id="game-left"></canvas></div>
        <div class="viewer"><canvas id="game-right"></canvas></div>
      </section>
      <footer class="answer-bar panel">
        <button class="button success" data-answer="same">${t('same')}</button>
        <button class="button danger" data-answer="different">${t('different')}</button>
        <button class="button secondary" data-game-action="skip">${t('skip')}</button>
        <label class="zoom-control">Zoom<input id="game-zoom" type="range" min="0.55" max="2.8" step="0.05" value="${g.zoom}" /></label>
      </footer>
      ${g.feedback ? `<div class="feedback ${g.feedbackKind}">${esc(g.feedback)}</div>` : ''}
    </main>
  `;
}

export function bindGame(ctx) {
  const stage = document.querySelector('.game-stage');
  document.querySelector('[data-game-action="pause"]')?.addEventListener('click', () => {
    ctx.state.paused = !ctx.state.paused;
    ctx.render();
  });
  document.querySelector('[data-game-action="skip"]')?.addEventListener('click', () => skipQuestion(ctx));
  document.querySelectorAll('[data-answer]').forEach(btn => btn.addEventListener('click', () => answer(ctx, btn.dataset.answer === 'same')));
  document.getElementById('game-zoom')?.addEventListener('input', event => ctx.state.game.zoom = Number(event.target.value));
  document.getElementById('game-left')?.addEventListener('pointerdown', () => ctx.state.game.leftAuto = (ctx.state.game.leftAuto + 1) % 3);
  makeDragRotator(document.getElementById('game-right'), () => ctx.state.game.rightQ, q => ctx.state.game.rightQ = q);
  stage?.addEventListener('wheel', event => {
    event.preventDefault();
    ctx.state.game.zoom = clamp(ctx.state.game.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 0.55, 2.8);
    const slider = document.getElementById('game-zoom');
    if (slider) slider.value = ctx.state.game.zoom;
  }, { passive: false });
  drawGame(ctx);
}

export function tickGame(ctx, ts) {
  if (ctx.state.screen !== 'game') return;
  const g = ctx.state.game;
  const dt = Math.min(0.05, (ts - (g.lastT || ts)) / 1000);
  g.lastT = ts;
  if (!ctx.state.paused && !g.feedback && g.leftAuto) {
    g.leftQ = stepAutoRotation(g.leftQ, g.leftAuto, g.level?.speed, dt);
  }
  drawGame(ctx);
}

export function stopTimer(ctx) {
  if (ctx.state.game.timer) {
    clearInterval(ctx.state.game.timer);
    ctx.state.game.timer = null;
  }
}

export function renderResult(ctx) {
  const { state, t } = ctx;
  return `
    <main class="screen result-screen">
      <section class="panel result-card">
        <h1>${t('finish')}</h1>
        <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= state.result.stars ? '' : 'dim'}">★</span>`).join('')}</div>
        <p>${t('totalScore')}</p>
        <strong>${state.result.score}</strong>
        <button class="button primary" data-action="home">${t('back')}</button>
      </section>
    </main>
  `;
}

function startTimer(ctx) {
  stopTimer(ctx);
  ctx.state.game.timer = setInterval(() => {
    const g = ctx.state.game;
    if (ctx.state.screen !== 'game' || ctx.state.paused || g.feedback) return;
    g.timeLeft -= 1;
    const time = document.getElementById('hud-time');
    if (time) time.textContent = Math.max(0, g.timeLeft);
    if (g.timeLeft <= 0) endGame(ctx);
  }, 1000);
}

function currentQuestion(ctx) {
  return ctx.state.game.level?.questions?.[ctx.state.game.qIndex];
}

function loadQuestion(ctx) {
  const q = currentQuestion(ctx);
  ctx.state.game.leftQ = normalizeQuat(q?.rot1 || [0, 0, 0, 1]);
  ctx.state.game.rightQ = normalizeQuat(q?.rot2 || [0, 0, 0, 1]);
  ctx.state.game.leftAuto = 0;
}

function getQuestionObjects(ctx, q) {
  const o1 = ctx.state.data.objects.find(o => o.id === q?.obj1);
  const o2Id = q?.type === 'match' ? q?.obj1 : q?.obj2;
  const o2 = ctx.state.data.objects.find(o => o.id === o2Id);
  return [o1, o2];
}

function drawGame(ctx) {
  const g = ctx.state.game;
  const q = currentQuestion(ctx);
  const [left, right] = getQuestionObjects(ctx, q);
  const leftColor = left?.voxels?.[0]?.color || null;
  const leftMat = left?.voxels?.[0]?.mat || null;
  drawObject(document.getElementById('game-left'), left?.voxels || [], g.leftQ, { zoom: g.zoom, overrideColor: leftColor, overrideMat: leftMat, emptyText: ctx.t('emptyObj') });
  drawObject(document.getElementById('game-right'), syncVoxels(right?.voxels || [], leftColor, leftMat), g.rightQ, { zoom: g.zoom, emptyText: ctx.t('emptyObj') });
}

function answer(ctx, isSame) {
  const g = ctx.state.game;
  if (g.feedback) return;
  const q = currentQuestion(ctx);
  const correct = (q.type === 'match' && isSame) || (q.type === 'mismatch' && !isSame);
  g.score = correct ? g.score + Number(g.level.scoreWin || 0) : Math.max(0, g.score - Number(g.level.scoreLoss || 0));
  showFeedback(ctx, correct ? 'Correct' : 'Wrong', correct ? 'good' : 'bad', 800);
}

function skipQuestion(ctx) {
  const g = ctx.state.game;
  if (g.feedback) return;
  g.score = Math.max(0, g.score + Number(g.level.scoreSkip || 0));
  showFeedback(ctx, ctx.t('skip'), 'skip', 600);
}

function showFeedback(ctx, text, kind, delay) {
  ctx.state.game.feedback = text;
  ctx.state.game.feedbackKind = kind;
  ctx.render();
  setTimeout(() => {
    ctx.state.game.feedback = '';
    ctx.state.game.qIndex += 1;
    if (ctx.state.game.qIndex >= (ctx.state.game.level.questions?.length || 0)) endGame(ctx);
    else {
      loadQuestion(ctx);
      ctx.render();
    }
  }, delay);
}

function endGame(ctx) {
  stopTimer(ctx);
  const g = ctx.state.game.level || {};
  const score = ctx.state.game.score;
  ctx.state.result.score = score;
  ctx.state.result.stars = score >= Number(g.star3 ?? Infinity) ? 3 : score >= Number(g.star2 ?? Infinity) ? 2 : score >= Number(g.star1 ?? Infinity) ? 1 : 0;
  ctx.state.screen = 'result';
  ctx.state.paused = false;
  ctx.render();
}
