import { setMediaElementVolume, unlockMediaVolumeContext } from './mediaVolume.js';

const RESULT_TRACKS = {
  1: '/assets/audio/1-star.m4a',
  2: '/assets/audio/2-stars.m4a',
  3: '/assets/audio/3-stars.m4a'
};
const RESULT_MUSIC_START_SECONDS = 2;
const RESULT_ARM_LEAD_SECONDS = 0.75;
const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];

let resultAudio;
let currentStars = 0;
let currentTrack = '';
let currentConfig = normalizeResultConfig({});
let shouldPlayWhenUnlocked = false;
let unlockBound = false;
let armedTrack = '';
let armedAudio = null;
const preparedTracks = new Map();
const preloadedLinks = new Set();
const warmedTracks = new Set();

export function primeResultMusic(config = {}) {
  currentConfig = normalizeResultConfig(config);
  bindResultUnlock();
  preloadResultTracks(currentConfig);
}

export function warmResultMusicForStars(stars, config = {}) {
  primeResultMusic(config);
  const normalizedStars = Math.min(3, Math.max(1, Number(stars) || 1));
  const track = currentConfig.tracks[normalizedStars] || RESULT_TRACKS[normalizedStars];
  armTrackForResult(track);
}

export function syncResultMusic({ active, stars, config = {} }) {
  currentConfig = normalizeResultConfig(config);

  if (!active || !currentConfig.enabled) {
    stopResultMusic();
    return;
  }

  bindResultUnlock();

  const normalizedStars = Math.min(3, Math.max(1, Number(stars) || 1));
  const track = currentConfig.tracks[normalizedStars] || RESULT_TRACKS[normalizedStars];

  if (resultAudio && currentStars === normalizedStars && currentTrack === track && !resultAudio.paused) {
    return;
  }

  const useArmedAudio = armedAudio && armedTrack === track;
  if (!useArmedAudio) {
    stopActiveResultAudio();
  }

  currentStars = normalizedStars;
  currentTrack = track;
  resultAudio = useArmedAudio ? armedAudio : prepareTrack(track, currentConfig);
  playActiveResultAudio({ keepPosition: Boolean(useArmedAudio) });
  armedTrack = '';
  armedAudio = null;
}

export function stopResultMusic() {
  shouldPlayWhenUnlocked = false;
  stopActiveResultAudio();
  currentStars = 0;
  currentTrack = '';
}

function playActiveResultAudio(options = {}) {
  if (!resultAudio) return Promise.resolve(false);
  shouldPlayWhenUnlocked = true;
  resultAudio.muted = false;
  setMediaElementVolume(resultAudio, currentConfig.volume);
  unlockMediaVolumeContext();

  if (!options.keepPosition) {
    seekAudio(resultAudio, currentConfig.start);
  }

  if (!resultAudio.paused) {
    shouldPlayWhenUnlocked = false;
    warmedTracks.add(currentTrack);
    return Promise.resolve(true);
  }

  try {
    const playPromise = resultAudio.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      shouldPlayWhenUnlocked = false;
      return Promise.resolve(true);
    }

    return playPromise.then(
      () => {
        shouldPlayWhenUnlocked = false;
        warmedTracks.add(currentTrack);
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

function stopActiveResultAudio() {
  if (!resultAudio) return;
  const stoppedAudio = resultAudio;
  resultAudio.pause();
  seekAudio(resultAudio, currentConfig.start);
  resultAudio.muted = false;
  resultAudio = null;
  if (armedAudio && armedAudio === stoppedAudio) {
    armedTrack = '';
    armedAudio = null;
  }
}

function preloadResultTracks(config) {
  Object.values(config.tracks).forEach(track => prepareTrack(track, config));
}

function prepareTrack(track, config) {
  addAudioPreloadLink(track);

  let audio = preparedTracks.get(track);
  let created = false;
  if (!audio) {
    audio = new Audio(track);
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.loop = false;
    audio.addEventListener('loadedmetadata', () => seekAudio(audio, config.start));
    preparedTracks.set(track, audio);
    created = true;
  }

  setMediaElementVolume(audio, config.volume);
  audio.preload = 'auto';
  if (created || audio.readyState === 0) {
    safeLoad(audio);
  }
  return audio;
}

function warmPreparedTracks() {
  if (shouldPlayWhenUnlocked && resultAudio) {
    playActiveResultAudio();
    return;
  }

  Object.values(currentConfig.tracks).forEach(track => {
    warmTrack(track);
  });
}

function warmTrack(track) {
  if (warmedTracks.has(track)) return;
  const audio = prepareTrack(track, currentConfig);
  audio.muted = true;
  setMediaElementVolume(audio, 0);
  seekAudio(audio, currentConfig.start);
  unlockMediaVolumeContext();

  try {
    const playPromise = audio.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      finishWarmup(track, audio);
      return;
    }

    playPromise.then(
      () => finishWarmup(track, audio),
      () => {
        audio.muted = false;
        setMediaElementVolume(audio, currentConfig.volume);
      }
    );
  } catch {
    audio.muted = false;
    setMediaElementVolume(audio, currentConfig.volume);
  }
}

function armTrackForResult(track) {
  const audio = prepareTrack(track, currentConfig);
  armedTrack = track;
  armedAudio = audio;
  audio.muted = true;
  setMediaElementVolume(audio, 0);
  seekAudio(audio, Math.max(0, currentConfig.start - RESULT_ARM_LEAD_SECONDS));
  unlockMediaVolumeContext();

  try {
    const playPromise = audio.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      warmedTracks.add(track);
      return;
    }

    playPromise.then(
      () => warmedTracks.add(track),
      () => {
        audio.muted = false;
        setMediaElementVolume(audio, currentConfig.volume);
      }
    );
  } catch {
    audio.muted = false;
    setMediaElementVolume(audio, currentConfig.volume);
  }
}

function finishWarmup(track, audio) {
  audio.pause();
  audio.muted = false;
  setMediaElementVolume(audio, currentConfig.volume);
  seekAudio(audio, currentConfig.start);
  warmedTracks.add(track);
}

function bindResultUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  UNLOCK_EVENTS.forEach(eventName => {
    window.addEventListener(eventName, warmPreparedTracks, { passive: true, capture: true });
    document.addEventListener(eventName, warmPreparedTracks, { passive: true, capture: true });
  });
}

function addAudioPreloadLink(track) {
  if (typeof document === 'undefined' || !track || track.startsWith('data:') || track.startsWith('blob:') || preloadedLinks.has(track)) {
    return;
  }

  preloadedLinks.add(track);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'audio';
  link.href = track;
  if (/\.m4a($|\?)/i.test(track) || /\.mp4($|\?)/i.test(track)) {
    link.type = 'audio/mp4';
  }
  document.head.appendChild(link);
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
  const target = Number(seconds) || 0;
  const seek = () => {
    try {
      if (Math.abs(audio.currentTime - target) > 0.25) {
        audio.currentTime = target;
      }
    } catch {
      // Some mobile browsers reject currentTime until media metadata is available.
    }
  };

  if (audio.readyState >= 1) seek();
  else audio.addEventListener('loadedmetadata', seek, { once: true });
}

function safeLoad(audio) {
  try {
    audio.load();
  } catch {
    // Custom admin audio URLs may temporarily fail; playback will retry on result render.
  }
}
