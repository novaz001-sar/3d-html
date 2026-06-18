let audioContext;
let unlocked = false;
let sfxEnabled = true;
let sfxGainMultiplier = 2;
let unlockInstalled = false;
let unlockTonePlayed = false;

export function configureSoundEffects(config = {}) {
  sfxEnabled = config.enabled !== false;
  const multiplier = Number(config.volumeMultiplier);
  sfxGainMultiplier = Number.isFinite(multiplier) ? Math.min(4, Math.max(0, multiplier)) : 2;
}

export function installSoundUnlock() {
  if (unlockInstalled) return;
  unlockInstalled = true;
  const unlock = event => {
    unlockSoundEffects({ audible: isInteractiveAudioGesture(event) });
  };

  ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart', 'touchend'].forEach(eventName => {
    window.addEventListener(eventName, unlock, true);
  });
}

export function unlockSoundEffects(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);
  if (unlocked && ctx.state === 'running') return Promise.resolve(true);

  const shouldScheduleSilent = !unlocked;
  const shouldScheduleTone = options.audible && !unlockTonePlayed && sfxEnabled && sfxGainMultiplier > 0;

  if (!unlocked) {
    unlocked = true;
  }

  if (shouldScheduleTone) {
    unlockTonePlayed = true;
  }

  const scheduleUnlockFeedback = () => {
    if (shouldScheduleSilent) scheduleSilentUnlock(ctx);
    if (shouldScheduleTone) scheduleUnlockTone(ctx);
    return true;
  };

  if (ctx.state !== 'running') {
    return ctx.resume().then(scheduleUnlockFeedback).catch(() => false);
  }

  scheduleUnlockFeedback();
  return Promise.resolve(true);
}

export function playLevelSelect() {
  playSequence([
    { frequency: 440, start: 0, duration: 0.08, type: 'triangle', gain: 0.08 },
    { frequency: 660, start: 0.08, duration: 0.1, type: 'triangle', gain: 0.08 },
    { frequency: 990, start: 0.18, duration: 0.12, type: 'sine', gain: 0.06 }
  ]);
}

export function playCorrect() {
  playSequence([
    { frequency: 620, start: 0, duration: 0.08, type: 'sine', gain: 0.07 },
    { frequency: 820, start: 0.08, duration: 0.08, type: 'sine', gain: 0.08 },
    { frequency: 1240, start: 0.16, duration: 0.12, type: 'triangle', gain: 0.06 }
  ]);
}

export function playWrong() {
  playSequence([
    { frequency: 220, start: 0, duration: 0.12, type: 'sawtooth', gain: 0.045 },
    { frequency: 165, start: 0.1, duration: 0.16, type: 'triangle', gain: 0.05 }
  ]);
}

export function playLevelComplete() {
  playSequence([
    { frequency: 523.25, start: 0, duration: 0.1, type: 'triangle', gain: 0.08 },
    { frequency: 659.25, start: 0.1, duration: 0.1, type: 'triangle', gain: 0.08 },
    { frequency: 783.99, start: 0.2, duration: 0.1, type: 'triangle', gain: 0.08 },
    { frequency: 1046.5, start: 0.31, duration: 0.22, type: 'sine', gain: 0.07 }
  ]);
}

function playSequence(notes) {
  if (!sfxEnabled || sfxGainMultiplier <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  unlocked = true;

  if (ctx.state !== 'running') {
    ctx.resume()
      .then(() => notes.forEach(note => playNote(ctx, note, 0.012)))
      .catch(() => {});
    return;
  }

  notes.forEach(note => playNote(ctx, note, 0));
}

function playNote(ctx, note, leadTime = 0) {
  const now = ctx.currentTime;
  const start = now + leadTime + note.start;
  const end = start + note.duration;
  const peakGain = Math.min(note.gain * sfxGainMultiplier, 0.32);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(note.frequency * 1.015, end);

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, end);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.03);
}

function scheduleSilentUnlock(ctx) {
  const start = ctx.currentTime + 0.005;
  const gain = ctx.createGain();
  const oscillator = ctx.createOscillator();
  gain.gain.setValueAtTime(0.0001, start);
  oscillator.frequency.setValueAtTime(440, start);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.02);
}

function scheduleUnlockTone(ctx) {
  playNote(ctx, { frequency: 740, start: 0, duration: 0.055, type: 'triangle', gain: 0.045 }, 0.018);
  playNote(ctx, { frequency: 980, start: 0.055, duration: 0.06, type: 'sine', gain: 0.035 }, 0.018);
}

function isInteractiveAudioGesture(event) {
  const target = event?.target instanceof Element ? event.target : null;
  if (!target) return event?.type === 'keydown';
  return Boolean(target.closest('button, .button, [role="button"], [data-start], [data-answer], [data-game-action], [data-home-action], input, label'));
}

function getAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext ||= new AudioCtor();
  return audioContext;
}
