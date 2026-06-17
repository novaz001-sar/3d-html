const RESULT_TRACKS = {
  1: '/assets/audio/1-star.m4a',
  2: '/assets/audio/2-stars.m4a',
  3: '/assets/audio/3-stars.m4a'
};
const RESULT_MUSIC_START_SECONDS = 2;

let resultAudio;
let currentStars = 0;

export function syncResultMusic({ active, stars }) {
  if (!active) {
    stopResultMusic();
    return;
  }

  const normalizedStars = Math.min(3, Math.max(1, Number(stars) || 1));

  if (resultAudio && currentStars === normalizedStars && !resultAudio.paused) {
    return;
  }

  stopResultMusic();
  currentStars = normalizedStars;
  resultAudio = new Audio(RESULT_TRACKS[normalizedStars]);
  resultAudio.preload = 'auto';
  resultAudio.volume = 0.72;
  seekAudio(resultAudio, RESULT_MUSIC_START_SECONDS);

  const playPromise = resultAudio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      bindResultUnlock();
    });
  }
}

export function stopResultMusic() {
  if (!resultAudio) return;
  resultAudio.pause();
  resultAudio.currentTime = 0;
  resultAudio = null;
  currentStars = 0;
}

function bindResultUnlock() {
  const unlock = () => {
    if (resultAudio) {
      seekAudio(resultAudio, RESULT_MUSIC_START_SECONDS);
      resultAudio.play().catch(() => {});
    }

    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

function seekAudio(audio, seconds) {
  try {
    audio.currentTime = seconds;
  } catch {
    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = seconds;
    }, { once: true });
  }
}
