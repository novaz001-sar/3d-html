const MENU_MUSIC_SRC = '/assets/audio/menu-theme.m4a';

let audio;
let unlockBound = false;
let shouldPlayWhenUnlocked = false;

export function syncMenuMusic({ active, enabled }) {
  if (!active || !enabled) {
    shouldPlayWhenUnlocked = false;
    pauseMenuMusic();
    return;
  }

  shouldPlayWhenUnlocked = true;
  playMenuMusic();
}

export function pauseMenuMusic() {
  if (!audio) return;
  audio.pause();
}

function playMenuMusic() {
  const player = getAudio();
  const playPromise = player.play();

  if (playPromise?.catch) {
    playPromise.catch(() => {
      bindUnlockEvents();
    });
  }
}

function getAudio() {
  if (audio) return audio;

  audio = new Audio(MENU_MUSIC_SRC);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.34;
  return audio;
}

function bindUnlockEvents() {
  if (unlockBound) return;
  unlockBound = true;

  const unlock = () => {
    if (shouldPlayWhenUnlocked) {
      playMenuMusic();
    }

    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
    unlockBound = false;
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}
