const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function resumeAudio() {
  try {
    const ac = getCtx();
    if (ac && ac.state === 'suspended') ac.resume();
  } catch {}
}

export function playTick() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(220, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.05);
    gain.gain.setValueAtTime(0.35, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.06);
  } catch {}
}

export function playDrumRoll(duration = 10000) {
  resumeAudio();
  let elapsed = 0;
  let interval = 80;
  const run = () => {
    if (elapsed >= duration - 400) return;
    playTick();
    const progress = elapsed / duration;
    // Accelerate as it gets closer to reveal, then build suspense
    if (progress < 0.6) interval = Math.max(30, 80 - progress * 80);
    else if (progress < 0.9) interval = Math.max(25, 30 - (progress - 0.6) * 15);
    else interval = Math.min(180, 25 + (progress - 0.9) * 1200);
    elapsed += interval;
    setTimeout(run, interval);
  };
  run();
}

export function playGameStartSound() {
  try {
    resumeAudio();
    const ac = getCtx();
    // Uplifting celebratory royal fanfare chords for game start
    const notes = [
      { f: 392.00, t: 0.0, d: 0.25 }, // G4
      { f: 523.25, t: 0.2, d: 0.3 },  // C5
      { f: 659.25, t: 0.45, d: 0.3 }, // E5
      { f: 783.99, t: 0.7, d: 0.5 },  // G5
      { f: 1046.50, t: 1.1, d: 1.0 }, // C6 grand finish
      { f: 523.25, t: 1.1, d: 1.0 },  // C5 harmony
    ];
    notes.forEach(({ f, t, d }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'triangle';
      const startT = ac.currentTime + t;
      osc.frequency.setValueAtTime(f, startT);
      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(0.35, startT + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + d);
      osc.start(startT); osc.stop(startT + d + 0.05);
    });
  } catch {}
}

export function playWinnerFanfare() {
  try {
    resumeAudio();
    const ac = getCtx();
    const notes = [
      { f: 523.25, t: 0.0 },
      { f: 659.25, t: 0.15 },
      { f: 783.99, t: 0.3 },
      { f: 1046.5, t: 0.45 },
      { f: 1318.5, t: 0.7 },
      { f: 1567.98, t: 0.95 },
    ];
    notes.forEach(({ f, t }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'sine';
      const startTime = ac.currentTime + t;
      osc.frequency.setValueAtTime(f, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      osc.start(startTime); osc.stop(startTime + 0.55);
    });
  } catch {}
}

export function playSuspense() {
  try {
    resumeAudio();
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ac.currentTime + 3.5);
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ac.currentTime + 3.0);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 3.6);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 3.6);
  } catch {}
}
