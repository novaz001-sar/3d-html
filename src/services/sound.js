let audioContext;
let unlocked = false;
let sfxEnabled = true;
let sfxGainMultiplier = 2;
let unlockInstalled = false;

export function configureSoundEffects(config = {}) {
  sfxEnabled = config.enabled !== false;
  const multiplier = Number(config.volumeMultiplier);
  sfxGainMultiplier = Number.isFinite(multiplier) ? Math.min(4, Math.max(0, multiplier)) : 2;
}

export function installSoundUnlock() {
  if (unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    unlockSoundEffects();
  };

  ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart', 'touchend'].forEach(eventName => {
    window.addEventListener(eventName, unlock, true);
  });
}

export function unlockSoundEffects() {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);
  if (unlocked && ctx.state === 'running') return Promise.resolve(true);

  const finishUnlock = () => {
    if (unlocked && ctx.state === 'running') return true;
    unlocked = true;
    const gain = ctx.createGain();
    const oscillator = ctx.createOscillator();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.02);
    return true;
  };

  if (ctx.state === 'suspended') {
    return ctx.resume().then(finishUnlock).catch(() => false);
  }

  return Promise.resolve(finishUnlock());
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

  const play = () => {
    unlocked = true;
    notes.forEach(note => playNote(ctx, note));
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {});
    return;
  }

  play();
}

function playNote(ctx, note) {
  const now = ctx.currentTime;
  const start = now + note.start;
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

function getAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext ||= new AudioCtor();
  return audioContext;
}
