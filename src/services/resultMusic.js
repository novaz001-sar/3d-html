const RESULT_TRACKS = {
  1: '/assets/audio/1-star.m4a',
  2: '/assets/audio/2-stars.m4a',
  3: '/assets/audio/3-stars.m4a'
};
const RESULT_MUSIC_START_SECONDS = 2;

let resultAudio;
let currentStars = 0;
let currentTrack = '';
let currentConfig = {};

export function syncResultMusic({ active, stars, config = {} }) {
  currentConfig = normalizeResultConfig(config);
  if (!active || !currentConfig.enabled) {
    stopResultMusic();
    return;
  }

  const normalizedStars = Math.min(3, Math.max(1, Number(stars) || 1));
  const track = currentConfig.tracks[normalizedStars] || RESULT_TRACKS[normalizedStars];

  if (resultAudio && currentStars === normalizedStars && currentTrack === track && !resultAudio.paused) {
    return;
  }

  stopResultMusic();
  currentStars = normalizedStars;
  currentTrack = track;
  resultAudio = new Audio(track);
  resultAudio.preload = 'auto';
  resultAudio.volume = currentConfig.volume;
  seekAudio(resultAudio, currentConfig.start);

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
  currentTrack = '';
}

function bindResultUnlock() {
  const unlock = () => {
    if (resultAudio) {
      seekAudio(resultAudio, currentConfig.start);
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

function normalizeResultConfig(config) {
  const volume = Number(config.volume);
  const start = Number(config.start);
  return {
    enabled: config.enabled !== false,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.72,
    start: Number.isFinite(start) ? Math.max(0, start) : RESULT_MUSIC_START_SECONDS,
    tracks: {
      1: config.tracks?.[1] || RESULT_TRACKS[1],
      2: config.tracks?.[2] || RESULT_TRACKS[2],
      3: config.tracks?.[3] || RESULT_TRACKS[3]
    }
  };
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
