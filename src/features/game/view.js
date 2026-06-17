import { esc } from '../../shared/utils.js';

export function renderGame(ctx) {
  const { state, t } = ctx;
  const game = state.game;
  const total = game.level?.questions?.length || 0;
  return `
    <main class="screen game-screen">
      <header class="game-hud panel">
        <div>
          <h1>${esc(game.level?.name || '')}</h1>
          <p>${t('score')}: <strong id="hud-score">${game.score}</strong> · ${t('timeLeft')}: <strong id="hud-time">${Math.max(0, game.timeLeft)}</strong>s · ${game.qIndex + 1}/${total}</p>
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
        <label class="zoom-control">Zoom<input id="game-zoom" type="range" min="0.55" max="2.8" step="0.05" value="${game.zoom}" /></label>
      </footer>
      ${game.feedback ? `<div class="feedback ${game.feedbackKind}">${esc(game.feedback)}</div>` : ''}
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
