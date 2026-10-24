const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playTick() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(200, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.05);
    gain.gain.setValueAtTime(0.4, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.07);
  } catch {}
}

export function playDrumRoll(duration = 6000) {
  let elapsed = 0;
  let interval = 60;
  const run = () => {
    if (elapsed >= duration - 400) return;
    playTick();
    const progress = elapsed / duration;
    if (progress < 0.5) interval = Math.max(20, 60 - progress * 80);
    else interval = Math.min(250, 20 + (progress - 0.5) * 500);
    elapsed += interval;
    setTimeout(run, interval);
  };
  run();
}

export function playWinnerFanfare() {
  try {
    const ac = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'sine';
      const t = ac.currentTime + i * 0.18;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch {}
}

export function playSuspense() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ac.currentTime + 3);
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ac.currentTime + 2.5);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 3.2);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 3.2);
  } catch {}
}

export function resumeAudio() {
  try { if (ctx && ctx.state === 'suspended') ctx.resume(); } catch {}
}
