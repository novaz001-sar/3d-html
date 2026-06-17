let audioContext;

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
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  notes.forEach(note => playNote(ctx, note));
}

function playNote(ctx, note) {
  const now = ctx.currentTime;
  const start = now + note.start;
  const end = start + note.duration;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(note.frequency * 1.015, end);

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.018);
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
