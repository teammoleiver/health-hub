/** Synthesize a short water pour / bubble sound using the Web Audio API */
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playWaterSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    // --- Layer 1: bubbling noise burst ---
    const bufferSize = ctx.sampleRate * 0.35;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(800, now);
    bandpass.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    bandpass.frequency.exponentialRampToValueAtTime(600, now + 0.35);
    bandpass.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.35);

    noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.35);

    // --- Layer 2: quick "glug" tones ---
    const glugs = [
      { freq: 420, time: 0, dur: 0.08 },
      { freq: 380, time: 0.07, dur: 0.07 },
      { freq: 460, time: 0.13, dur: 0.06 },
      { freq: 350, time: 0.2, dur: 0.08 },
    ];
    for (const g of glugs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(g.freq, now + g.time);
      osc.frequency.exponentialRampToValueAtTime(g.freq * 0.7, now + g.time + g.dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now + g.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + g.time + g.dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + g.time);
      osc.stop(now + g.time + g.dur);
    }

    // --- Layer 3: low-end "pour" sweep ---
    const pour = ctx.createOscillator();
    pour.type = "sine";
    pour.frequency.setValueAtTime(200, now);
    pour.frequency.exponentialRampToValueAtTime(120, now + 0.3);

    const pourGain = ctx.createGain();
    pourGain.gain.setValueAtTime(0.08, now);
    pourGain.gain.linearRampToValueAtTime(0, now + 0.3);

    pour.connect(pourGain).connect(ctx.destination);
    pour.start(now);
    pour.stop(now + 0.3);
  } catch {
    // Audio not supported — fail silently
  }
}

export function playGoalReachedSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    // Cheerful ascending chime
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  } catch {
    // fail silently
  }
}
