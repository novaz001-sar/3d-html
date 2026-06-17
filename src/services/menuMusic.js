const MENU_MUSIC_SRC = '/assets/audio/menu-theme.m4a';

let audio;
let unlockBound = false;
let shouldPlayWhenUnlocked = false;
let currentVolume = 0.34;

export function primeMenuMusic({ enabled, volume }) {
  currentVolume = normalizeVolume(volume);
  if (!enabled) return;

  shouldPlayWhenUnlocked = true;
  bindUnlockEvents();
  playMenuMusic({ bootstrap: true });
}

export function syncMenuMusic({ active, enabled, volume }) {
  currentVolume = normalizeVolume(volume);

  if (!active || !enabled) {
    shouldPlayWhenUnlocked = false;
    pauseMenuMusic();
    return;
  }

  shouldPlayWhenUnlocked = true;
  bindUnlockEvents();
  playMenuMusic({ bootstrap: true });
}

export function setMenuMusicVolume(volume) {
  currentVolume = normalizeVolume(volume);
  if (!audio) return;
  audio.volume = currentVolume;
}

export function unlockMenuMusic() {
  if (!shouldPlayWhenUnlocked) return;
  const player = getAudio();
  player.muted = false;
  player.volume = currentVolume;
  playMenuMusic();
}

export function pauseMenuMusic() {
  if (!audio) return;
  audio.pause();
}

function playMenuMusic({ bootstrap = false } = {}) {
  const player = getAudio();
  player.volume = currentVolume;

  if (bootstrap && !player.dataset.started) {
    player.muted = true;
  }

  const playPromise = player.play();

  if (playPromise?.then) {
    playPromise
      .then(() => {
        player.dataset.started = 'true';
        if (!bootstrap || !player.muted) {
          player.volume = currentVolume;
          return;
        }

        window.setTimeout(() => {
          if (shouldPlayWhenUnlocked) {
            player.volume = currentVolume;
            player.muted = false;
          }
        }, 120);
      })
      .catch(() => {
        player.muted = false;
        bindUnlockEvents();
      });
  }
}

function getAudio() {
  if (audio) return audio;

  audio = new Audio(MENU_MUSIC_SRC);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = currentVolume;
  audio.setAttribute('playsinline', '');
  return audio;
}

function bindUnlockEvents() {
  if (unlockBound) return;
  unlockBound = true;

  const unlock = () => {
    unlockMenuMusic();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
    unlockBound = false;
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

function normalizeVolume(volume) {
  const value = Number(volume);
  if (!Number.isFinite(value)) return 0.34;
  return Math.min(1, Math.max(0, value));
}
