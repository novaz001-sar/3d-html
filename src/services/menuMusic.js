const DEFAULT_MENU_MUSIC_SRC = '/assets/audio/menu-theme.m4a';
const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];

let audio;
let shouldPlayWhenUnlocked = false;
let currentVolume = 0.5;
let currentSrc = DEFAULT_MENU_MUSIC_SRC;
let currentStart = 0;
let currentLoop = true;
let unlockEventsBound = false;
const preloadedSources = new Set();

export function primeMenuMusic({ enabled, volume, config = {} }) {
  applyMenuConfig(config);
  setMenuMusicVolume(volume);
  preloadMenuSource(currentSrc);
  bindUnlockEvents();

  const player = getAudio();
  player.preload = 'auto';
  safeLoad(player);

  if (!enabled) {
    pauseMenuMusic();
    return;
  }

  shouldPlayWhenUnlocked = true;
  attemptAudiblePlay().then((played) => {
    if (!played && shouldPlayWhenUnlocked) {
      warmMutedPlayback();
    }
  });
}

export function syncMenuMusic({ active, enabled, volume, config = {} }) {
  applyMenuConfig(config);
  setMenuMusicVolume(volume);
  preloadMenuSource(currentSrc);
  bindUnlockEvents();

  if (!active || !enabled) {
    pauseMenuMusic();
    return;
  }

  shouldPlayWhenUnlocked = true;
  attemptAudiblePlay().then((played) => {
    if (!played && shouldPlayWhenUnlocked) {
      warmMutedPlayback();
    }
  });
}

export function setMenuMusicVolume(volume) {
  currentVolume = normalizeVolume(volume);
  if (audio) {
    audio.volume = currentVolume;
  }
}

export function unlockMenuMusic() {
  if (!shouldPlayWhenUnlocked) return Promise.resolve(true);
  const player = getAudio();
  player.preload = 'auto';
  safeLoad(player);
  return attemptAudiblePlay();
}

export function pauseMenuMusic() {
  shouldPlayWhenUnlocked = false;
  if (!audio) return;
  audio.pause();
  audio.muted = false;
}

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.id = 'menu-music';
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.src = currentSrc;
    audio.loop = currentLoop && currentStart <= 0;
    audio.volume = currentVolume;
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
  }
  return audio;
}

function applyMenuConfig(config = {}) {
  const nextSrc = String(config.src || DEFAULT_MENU_MUSIC_SRC);
  const nextStart = normalizeStart(config.start);
  const nextLoop = config.loop !== false;
  const srcChanged = nextSrc !== currentSrc;

  currentSrc = nextSrc;
  currentStart = nextStart;
  currentLoop = nextLoop;

  if (!audio) return;

  if (srcChanged || audio.getAttribute('src') !== currentSrc) {
    audio.pause();
    audio.src = currentSrc;
    audio.preload = 'auto';
    safeLoad(audio);
  }

  audio.loop = currentLoop && currentStart <= 0;
}

function attemptAudiblePlay() {
  const player = getAudio();
  player.muted = false;
  player.volume = currentVolume;
  seekToStart(player);

  try {
    const playResult = player.play();
    if (!playResult || typeof playResult.then !== 'function') {
      shouldPlayWhenUnlocked = false;
      return Promise.resolve(true);
    }

    return playResult.then(
      () => {
        shouldPlayWhenUnlocked = false;
        return true;
      },
      () => {
        shouldPlayWhenUnlocked = true;
        return false;
      }
    );
  } catch {
    shouldPlayWhenUnlocked = true;
    return Promise.resolve(false);
  }
}

function warmMutedPlayback() {
  if (!shouldPlayWhenUnlocked) return Promise.resolve(false);

  const player = getAudio();
  player.muted = true;
  player.volume = 0;
  seekToStart(player);

  try {
    const playResult = player.play();
    if (!playResult || typeof playResult.then !== 'function') {
      player.volume = currentVolume;
      return Promise.resolve(true);
    }

    return playResult.then(
      () => {
        player.volume = currentVolume;
        return true;
      },
      () => false
    );
  } catch {
    return Promise.resolve(false);
  }
}

function handleCanPlay() {
  if (!shouldPlayWhenUnlocked || audio?.muted || document.hidden) return;
  attemptAudiblePlay();
}

function handleEnded() {
  if (!currentLoop || !audio) return;
  seekToStart(audio, true);
  if (shouldPlayWhenUnlocked) {
    warmMutedPlayback();
    return;
  }
  attemptAudiblePlay();
}

function seekToStart(player, force = false) {
  if (!currentStart && !force) return;
  const seek = () => {
    try {
      if (force || player.currentTime < currentStart || Math.abs(player.currentTime - currentStart) > 0.75) {
        player.currentTime = currentStart;
      }
    } catch {
      // Some mobile browsers reject currentTime before metadata is ready.
    }
  };

  if (player.readyState >= 1) {
    seek();
  } else {
    player.addEventListener('loadedmetadata', seek, { once: true });
  }
}

function preloadMenuSource(src) {
  if (typeof document === 'undefined' || !src || src.startsWith('data:') || src.startsWith('blob:') || preloadedSources.has(src)) {
    return;
  }

  preloadedSources.add(src);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'audio';
  link.href = src;
  if (/\.m4a($|\?)/i.test(src) || /\.mp4($|\?)/i.test(src)) {
    link.type = 'audio/mp4';
  }
  document.head.appendChild(link);
}

function safeLoad(player) {
  try {
    player.load();
  } catch {
    // load() can throw when a custom admin URL is temporarily invalid.
  }
}

function bindUnlockEvents() {
  if (unlockEventsBound || typeof document === 'undefined') return;
  unlockEventsBound = true;
  UNLOCK_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, unlockMenuMusic, { passive: true, capture: true });
  });
}

function normalizeVolume(volume) {
  const value = Number(volume);
  if (!Number.isFinite(value) || value <= 0) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function normalizeStart(value) {
  const start = Number(value);
  if (!Number.isFinite(start) || start < 0) return 0;
  return start;
}
