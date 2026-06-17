import { bindEditor, renderEditor } from '../features/editor/index.js';
import { bindGame, renderGame, renderResult, startGame, stopTimer, tickGame } from '../features/game/index.js';
import { saveData, saveFontScale, saveLanguage } from '../services/storage.js';
import { translate } from '../services/i18n.js';
import { bindHome, renderHome } from './homeView.js';
import { renderShell } from './shell.js';
import { createInitialState } from './state.js';

export function createApp(root) {
  const state = createInitialState();
  const ctx = {
    state,
    t: key => translate(state.lang, key),
    persist: () => saveData(state.data),
    render,
    startGame: levelId => startGame(ctx, levelId)
  };

  function render() {
    applyUiPreferences();
    if (state.screen !== 'game') stopTimer(ctx);
    if (state.screen === 'main') root.innerHTML = renderShell(renderHome(ctx));
    if (state.screen === 'editor') root.innerHTML = renderShell(renderEditor(ctx));
    if (state.screen === 'game') root.innerHTML = renderShell(renderGame(ctx));
    if (state.screen === 'result') root.innerHTML = renderShell(renderResult(ctx));
    bindGlobalActions();
    if (state.screen === 'main') bindHome(ctx);
    if (state.screen === 'editor') bindEditor(ctx);
    if (state.screen === 'game') bindGame(ctx);
  }

  function bindGlobalActions() {
    document.querySelectorAll('[data-action="home"]').forEach(el => el.addEventListener('click', () => {
      state.screen = 'main';
      state.paused = false;
      stopTimer(ctx);
      render();
    }));
    document.querySelectorAll('[data-action="lang"]').forEach(el => el.addEventListener('click', () => {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      saveLanguage(state.lang);
      render();
    }));
    document.querySelectorAll('[data-action="font-scale"]').forEach(el => el.addEventListener('input', event => {
      state.fontScale = Number(event.target.value);
      saveFontScale(state.fontScale);
      applyUiPreferences();
    }));
  }

  function applyUiPreferences() {
    document.documentElement.dataset.lang = state.lang;
    document.documentElement.style.setProperty('--ui-font-scale', String(state.fontScale || 1));
  }

  function loop(ts) {
    tickGame(ctx, ts);
    requestAnimationFrame(loop);
  }

  return {
    start() {
      window.addEventListener('resize', () => {
        if (state.screen === 'game') bindGame(ctx);
      });
      render();
      requestAnimationFrame(loop);
    }
  };
}
