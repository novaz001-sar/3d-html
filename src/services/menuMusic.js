const MENU_MUSIC_SRC = '/assets/audio/menu-theme.m4a';

let audio;
let unlockBound = false;
let shouldPlayWhenUnlocked = false;
let currentVolume = 0.5;
let unmuteTimers = [];

export function primeMenuMusic({ enabled, volume }) {
  currentVolume = normalizeVolume(volume);
  clearUnmuteTimers();
  if (!enabled) {
    shouldPlayWhenUnlocked = false;
    pauseMenuMusic();
    return;
  }

  shouldPlayWhenUnlocked = true;
  bindUnlockEvents();
  playMenuMusic({ bootstrap: true });
}

export function syncMenuMusic({ active, enabled, volume }) {
  currentVolume = normalizeVolume(volume);

  if (!active || !enabled) {
    shouldPlayWhenUnlocked = false;
    clearUnmuteTimers();
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
  audio.muted = currentVolume <= 0;
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

  if (bootstrap) {
    player.muted = false;
    attemptPlay(player, () => {
      player.dataset.started = 'true';
      player.volume = currentVolume;
      player.muted = currentVolume <= 0;
    }, () => {
      startMutedBootstrap(player);
    });
    return;
  }

  player.muted = currentVolume <= 0;
  attemptPlay(player, () => {
    player.dataset.started = 'true';
  }, bindUnlockEvents);
}

function attemptPlay(player, onSuccess, onFailure) {
  const playPromise = player.play();
  if (playPromise?.then) {
    playPromise
      .then(() => {
        onSuccess?.();
      })
      .catch(() => {
        onFailure?.();
      });
    return;
  }

  onSuccess?.();
}

function startMutedBootstrap(player) {
  player.muted = true;
  player.volume = 0;

  attemptPlay(player, () => {
    player.dataset.started = 'true';
    scheduleUnmuteAttempts(player);
  }, bindUnlockEvents);
}

function scheduleUnmuteAttempts(player) {
  clearUnmuteTimers();
  [120, 420, 1100, 2200].forEach(delay => {
    unmuteTimers.push(window.setTimeout(() => {
      if (!shouldPlayWhenUnlocked || player.paused) return;
      player.volume = currentVolume;
      player.muted = currentVolume <= 0;
      player.play().catch(bindUnlockEvents);
    }, delay));
  });
}

function clearUnmuteTimers() {
  unmuteTimers.forEach(timer => window.clearTimeout(timer));
  unmuteTimers = [];
}

function getAudio() {
  if (audio) return audio;

  audio = document.createElement('audio');
  audio.src = MENU_MUSIC_SRC;
  audio.loop = true;
  audio.preload = 'auto';
  audio.autoplay = true;
  audio.hidden = true;
  audio.volume = currentVolume;
  audio.setAttribute('playsinline', '');
  document.body?.append(audio);
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
  if (!Number.isFinite(value) || value <= 0) return 0.5;
  return Math.min(1, Math.max(0, value));
}
