import { bindEditor, renderEditor } from '../features/editor/index.js';
import { bindGame, renderGame, renderResult, startGame, stopTimer, tickGame } from '../features/game/index.js';
import { saveData, saveFontScale, saveLanguage, saveMenuMusicEnabled, saveMenuMusicVolume } from '../services/storage.js';
import { translate } from '../services/i18n.js';
import { primeMenuMusic, setMenuMusicVolume, syncMenuMusic } from '../services/menuMusic.js';
import { syncResultMusic } from '../services/resultMusic.js';
import { installSoundUnlock } from '../services/sound.js';
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
    syncMenuMusic({ active: state.screen === 'main', enabled: state.musicEnabled, volume: state.musicVolume });
    syncResultMusic({ active: state.screen === 'result', stars: state.result.stars });
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
    document.querySelectorAll('[data-action="music"]').forEach(el => el.addEventListener('click', () => {
      state.musicEnabled = !state.musicEnabled;
      saveMenuMusicEnabled(state.musicEnabled);
      render();
    }));
    document.querySelectorAll('[data-action="music-volume"]').forEach(el => el.addEventListener('input', event => {
      state.musicVolume = Number(event.target.value);
      saveMenuMusicVolume(state.musicVolume);
      setMenuMusicVolume(state.musicVolume);
      syncMenuMusic({ active: state.screen === 'main', enabled: state.musicEnabled, volume: state.musicVolume });
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
      primeMenuMusic({ enabled: state.musicEnabled, volume: state.musicVolume });
      installSoundUnlock();
      window.addEventListener('resize', () => {
        if (state.screen === 'game') bindGame(ctx);
      });
      render();
      requestAnimationFrame(loop);
    }
  };
}
