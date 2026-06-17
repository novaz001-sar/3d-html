let mediaAudioContext;
let nativeVolumeSupported;
const gainControls = new WeakMap();

export function setMediaElementVolume(audio, volume) {
  if (!audio) return;
  const normalized = normalizeVolume(volume);

  if (!shouldUseGainControl(audio)) {
    try {
      audio.volume = normalized;
    } catch {
      // Fall through to Web Audio gain when the browser rejects native volume.
      applyGainVolume(audio, normalized);
    }
    return;
  }

  applyGainVolume(audio, normalized);
}

export function unlockMediaVolumeContext() {
  if (!mediaAudioContext || mediaAudioContext.state !== 'suspended') {
    return Promise.resolve(true);
  }

  return mediaAudioContext.resume().then(() => true).catch(() => false);
}

function applyGainVolume(audio, volume) {
  const control = ensureGainControl(audio);
  if (!control) {
    try {
      audio.volume = volume;
    } catch {
      // Last-resort fallback: some mobile browsers expose neither useful path.
    }
    return;
  }

  try {
    audio.volume = 1;
  } catch {
    // iOS can ignore this, which is fine because GainNode is now in control.
  }

  const now = control.context.currentTime;
  control.gain.gain.cancelScheduledValues(now);
  control.gain.gain.setTargetAtTime(volume, now, 0.015);
}

function ensureGainControl(audio) {
  const existing = gainControls.get(audio);
  if (existing) return existing;
  if (!canUseWebAudioFor(audio)) return null;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;

  try {
    mediaAudioContext ||= new AudioCtor();
    const source = mediaAudioContext.createMediaElementSource(audio);
    const gain = mediaAudioContext.createGain();
    source.connect(gain);
    gain.connect(mediaAudioContext.destination);
    const control = { context: mediaAudioContext, gain };
    gainControls.set(audio, control);
    return control;
  } catch {
    return null;
  }
}

function shouldUseGainControl(audio) {
  if (isLikelyMobileBrowser() && canUseWebAudioFor(audio)) return true;
  return !supportsNativeMediaVolume() && canUseWebAudioFor(audio);
}

function supportsNativeMediaVolume() {
  if (nativeVolumeSupported !== undefined) return nativeVolumeSupported;

  try {
    const probe = document.createElement('audio');
    probe.volume = 0.37;
    nativeVolumeSupported = Math.abs(probe.volume - 0.37) < 0.01;
  } catch {
    nativeVolumeSupported = false;
  }

  return nativeVolumeSupported;
}

function canUseWebAudioFor(audio) {
  const src = audio.currentSrc || audio.src || '';
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return true;

  try {
    const url = new URL(src, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return true;
  }
}

function isLikelyMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Boolean(window.matchMedia?.('(pointer: coarse)').matches);
}

function normalizeVolume(volume) {
  const value = Number(volume);
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}