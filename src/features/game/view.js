import { esc } from '../../shared/utils.js';
import { levelName } from '../../domain/levels.js';

export function renderGame(ctx) {
  const { state, t } = ctx;
  const game = state.game;
  const total = game.level?.questions?.length || 0;
  return `
    <main class="screen game-screen">
      <header class="game-hud panel">
        <div>
          <h1>${esc(levelName(game.level, state.lang, ''))}</h1>
          <p>${t('score')}: <strong id="hud-score">${game.score}</strong> · ${t('timeLeft')}: <strong id="hud-time">${Math.max(0, game.timeLeft)}</strong>s · ${game.qIndex + 1}/${total}</p>
        </div>
        <button class="button secondary" data-game-action="pause" aria-haspopup="dialog">${t('pause')}</button>
      </header>
      <section class="game-stage">
        <div class="viewer viewer-left">
          <canvas id="game-left"></canvas>
          <div class="viewer-hint"><strong>${esc(t('leftObj'))}</strong><span>${esc(t('leftInteractionHint'))}</span></div>
        </div>
        <div class="viewer viewer-right">
          <canvas id="game-right"></canvas>
          <div class="viewer-hint"><strong>${esc(t('rightObj'))}</strong><span>${esc(t('rightInteractionHint'))}</span></div>
        </div>
      </section>
      <footer class="answer-bar panel">
        <button class="button success" data-answer="same">${t('same')}</button>
        <button class="button danger" data-answer="different">${t('different')}</button>
        <button class="button secondary" data-game-action="skip">${t('skip')}</button>
        <label class="zoom-control">Zoom<input id="game-zoom" type="range" min="0.55" max="2.8" step="0.05" value="${game.zoom}" /></label>
        <label class="zoom-control">${t('leftAutoSpeed')}<input id="game-spin-speed" type="range" min="0.18" max="1" step="0.02" value="${game.spinSpeed || 1}" /></label>
        <label class="zoom-control">${t('rightDragSpeed')}<input id="game-drag-speed" type="range" min="0.18" max="1" step="0.02" value="${game.rightDragSpeed || 1}" /></label>
      </footer>
      ${game.feedback ? `<div class="feedback ${game.feedbackKind}">${esc(game.feedback)}</div>` : ''}
      ${state.paused ? `
        <div class="modal pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <section class="panel pause-menu">
            <h2 id="pause-title">${t('pauseMenu')}</h2>
            <p>${t('pauseTip')}</p>
            <div class="pause-menu-actions">
              <button class="button primary" data-game-action="resume">${t('continueGame')}</button>
              <button class="button secondary" data-game-action="reset">${t('resetGame')}</button>
              <button class="button danger" data-game-action="exit">${t('exitGame')}</button>
            </div>
          </section>
        </div>
      ` : ''}
    </main>
  `;
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
