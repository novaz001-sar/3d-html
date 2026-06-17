import { clone, clamp } from '../../shared/utils.js';
import { currentQuestion, getQuestionObjects } from '../../domain/questions.js';
import { applyAnswerScore, applySkipScore, isCorrectAnswer, starsForScore } from '../../domain/scoring.js';
import { drawObject, makeDragRotator, normalizeQuat, stepAutoRotation, syncVoxels } from '../../render/index.js';
import { playCorrect, playLevelSelect, playWrong } from '../../services/sound.js';

export function startGame(ctx, levelId) {
  const level = ctx.state.data.levels.find(item => item.id === levelId);
  if (!level || !level.questions?.length) return alert(ctx.t('emptyQuestions'));
  playLevelSelect();
  Object.assign(ctx.state.game, {
    level: clone(level),
    qIndex: 0,
    score: 0,
    timeLeft: Number(level.timeLimit || 60),
    zoom: 1,
    spinSpeed: 1,
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

export function bindGame(ctx) {
  const stage = document.querySelector('.game-stage');
  bindPauseShortcuts(ctx);
  document.querySelector('[data-game-action="pause"]')?.addEventListener('click', () => openPauseMenu(ctx));
  document.querySelector('[data-game-action="resume"]')?.addEventListener('click', () => closePauseMenu(ctx));
  document.querySelector('[data-game-action="reset"]')?.addEventListener('click', () => resetGame(ctx));
  document.querySelector('[data-game-action="exit"]')?.addEventListener('click', () => exitGame(ctx));
  document.querySelector('[data-game-action="skip"]')?.addEventListener('click', () => skipQuestion(ctx));
  document.querySelectorAll('[data-answer]').forEach(btn => btn.addEventListener('click', () => answer(ctx, btn.dataset.answer === 'same')));
  document.getElementById('game-zoom')?.addEventListener('input', event => ctx.state.game.zoom = Number(event.target.value));
  document.getElementById('game-spin-speed')?.addEventListener('input', event => ctx.state.game.spinSpeed = Number(event.target.value));
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

function bindPauseShortcuts(ctx) {
  if (ctx.state.game.escapeBound) return;
  ctx.state.game.escapeBound = true;
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || ctx.state.screen !== 'game') return;
    event.preventDefault();
    ctx.state.paused = !ctx.state.paused;
    ctx.render();
  });
}

function openPauseMenu(ctx) {
  ctx.state.paused = true;
  ctx.render();
}

function closePauseMenu(ctx) {
  ctx.state.paused = false;
  ctx.render();
}

function resetGame(ctx) {
  const levelId = ctx.state.game.level?.id;
  if (!levelId) return exitGame(ctx);
  startGame(ctx, levelId);
}

function exitGame(ctx) {
  stopTimer(ctx);
  ctx.state.paused = false;
  ctx.state.screen = 'main';
  ctx.render();
}

export function tickGame(ctx, ts) {
  if (ctx.state.screen !== 'game') return;
  const game = ctx.state.game;
  const dt = Math.min(0.05, (ts - (game.lastT || ts)) / 1000);
  game.lastT = ts;
  if (!ctx.state.paused && !game.feedback && game.leftAuto) {
    const spinSpeed = clamp(Number(game.spinSpeed) || 1, 0.18, 1);
    game.leftQ = stepAutoRotation(game.leftQ, game.leftAuto, Number(game.level?.speed || 1) / spinSpeed, dt);
  }
  drawGame(ctx);
}

export function stopTimer(ctx) {
  if (ctx.state.game.timer) {
    clearInterval(ctx.state.game.timer);
    ctx.state.game.timer = null;
  }
}

function startTimer(ctx) {
  stopTimer(ctx);
  ctx.state.game.timer = setInterval(() => {
    const game = ctx.state.game;
    if (ctx.state.screen !== 'game' || ctx.state.paused || game.feedback) return;
    game.timeLeft -= 1;
    const time = document.getElementById('hud-time');
    if (time) time.textContent = Math.max(0, game.timeLeft);
    if (game.timeLeft <= 0) endGame(ctx);
  }, 1000);
}

function loadQuestion(ctx) {
  const question = currentQuestion(ctx.state.game);
  ctx.state.game.leftQ = normalizeQuat(question?.rot1 || [0, 0, 0, 1]);
  ctx.state.game.rightQ = normalizeQuat(question?.rot2 || [0, 0, 0, 1]);
  ctx.state.game.leftAuto = 0;
}

function drawGame(ctx) {
  const game = ctx.state.game;
  const question = currentQuestion(game);
  const [left, right] = getQuestionObjects(ctx.state.data, question);
  const leftColor = left?.voxels?.[0]?.color || null;
  const leftMat = left?.voxels?.[0]?.mat || null;
  drawObject(document.getElementById('game-left'), left?.voxels || [], game.leftQ, { zoom: game.zoom, overrideColor: leftColor, overrideMat: leftMat, emptyText: ctx.t('emptyObj') });
  drawObject(document.getElementById('game-right'), syncVoxels(right?.voxels || [], leftColor, leftMat), game.rightQ, { zoom: game.zoom, emptyText: ctx.t('emptyObj') });
}

function answer(ctx, isSame) {
  const game = ctx.state.game;
  if (ctx.state.paused || game.feedback) return;
  const correct = isCorrectAnswer(currentQuestion(game), isSame);
  applyAnswerScore(game, correct);
  if (correct) playCorrect();
  else playWrong();
  showFeedback(ctx, correct ? 'Correct' : 'Wrong', correct ? 'good' : 'bad', 800);
}

function skipQuestion(ctx) {
  const game = ctx.state.game;
  if (ctx.state.paused || game.feedback) return;
  applySkipScore(game);
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
  const game = ctx.state.game;
  ctx.state.result.score = game.score;
  ctx.state.result.stars = starsForScore(game.level, game.score);
  ctx.state.screen = 'result';
  ctx.state.paused = false;
  ctx.render();
}
