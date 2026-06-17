const CAT_MEOW_SRC = '/assets/audio/meow.m4a';

let meowAudio;

export function playCatMeow() {
  const audio = getMeowAudio();
  audio.currentTime = 0;
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
