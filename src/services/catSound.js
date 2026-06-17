const CAT_MEOW_SRC = '/assets/audio/meow.m4a';
const CAT_MEOW_START_SECONDS = 2;

let meowAudio;

export function playCatMeow() {
  const audio = getMeowAudio();
  seekAudio(audio, CAT_MEOW_START_SECONDS);
  audio.play().catch(() => {});
}

function getMeowAudio() {
  if (!meowAudio) {
    meowAudio = new Audio(CAT_MEOW_SRC);
    meowAudio.preload = 'auto';
    meowAudio.volume = 0.82;
  }
  return meowAudio;
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
