import { bindEditor, renderEditor } from '../features/editor/index.js';
import { bindGame, renderGame, renderResult, startGame, stopTimer, tickGame } from '../features/game/index.js';
import { saveData, saveFontScale, saveLanguage, saveMenuMusicEnabled, saveMenuMusicVolume } from '../services/storage.js';
import { translate } from '../services/i18n.js';
import { primeMenuMusic, setMenuMusicVolume, syncMenuMusic, unlockMenuMusic } from '../services/menuMusic.js';
import { syncResultMusic } from '../services/resultMusic.js';
import { configureSoundEffects, installSoundUnlock, unlockSoundEffects } from '../services/sound.js';
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
    syncMenuMusic({ active: state.screen === 'main', enabled: state.musicEnabled, volume: state.musicVolume, config: state.adminConfig.audio.menu });
    syncResultMusic({ active: state.screen === 'result', stars: state.result.stars, config: state.adminConfig.audio.result });
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
    document.querySelectorAll('[data-action="music-volume"]').forEach(el => {
      const updateMusicVolume = event => {
        state.musicVolume = Number(event.target.value);
      saveMenuMusicVolume(state.musicVolume);
      setMenuMusicVolume(state.musicVolume);
      syncMenuMusic({ active: state.screen === 'main', enabled: state.musicEnabled, volume: state.musicVolume, config: state.adminConfig.audio.menu });
      };

      const activateMusicVolume = event => {
        event.stopPropagation();
        if (state.musicEnabled) {
          unlockMenuMusic();
        }
        updateMusicVolume(event);
      };

      el.addEventListener('input', updateMusicVolume);
      el.addEventListener('change', updateMusicVolume);
      el.addEventListener('pointerdown', activateMusicVolume);
      el.addEventListener('touchstart', activateMusicVolume, { passive: true });
    });
  }

  function applyUiPreferences() {
    document.documentElement.dataset.lang = state.lang;
    document.documentElement.style.setProperty('--ui-font-scale', String(state.fontScale || 1));
    document.documentElement.style.setProperty('--font-cute-latin', quoteFont(state.adminConfig.defaults.latinFont || 'Baloo 2'));
    document.documentElement.style.setProperty('--font-cute-cjk', quoteFont(state.adminConfig.defaults.cjkFont || 'ZCOOL KuaiLe'));
    document.documentElement.style.setProperty('--cat-home-opacity', String(state.adminConfig.visual.homeCat.opacity));
    document.documentElement.dataset.homeCat = state.adminConfig.visual.homeCat.enabled === false ? 'off' : 'on';
    configureSoundEffects(state.adminConfig.audio.sfx);
  }

  function installGlobalAudioUnlock() {
    const unlock = () => {
      unlockSoundEffects();
      if (state.musicEnabled) {
        unlockMenuMusic();
      }
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
    };

    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
  }

  function loop(ts) {
    tickGame(ctx, ts);
    requestAnimationFrame(loop);
  }

  return {
    start() {
      primeMenuMusic({ enabled: state.musicEnabled, volume: state.musicVolume, config: state.adminConfig.audio.menu });
      installSoundUnlock();
      installGlobalAudioUnlock();
      window.addEventListener('resize', () => {
        if (state.screen === 'game') bindGame(ctx);
      });
      render();
      requestAnimationFrame(loop);
    }
  };
}

function quoteFont(font) {
  return `"${String(font).replace(/"/g, '')}"`;
}
