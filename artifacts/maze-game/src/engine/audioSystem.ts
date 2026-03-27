import { create } from "zustand";

interface AudioState {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

export const useAudioState = create<AudioState>((set, get) => ({
  muted: false,
  volume: 0.7,
  toggleMute: () => set({ muted: !get().muted }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
}));

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let ambientStarted = false;
let ambientNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
let ambientSubNodes: (GainNode | BiquadFilterNode)[] = [];
let convolver: ConvolverNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = useAudioState.getState().volume;
    masterGain.connect(audioCtx.destination);

    convolver = audioCtx.createConvolver();
    const rate = audioCtx.sampleRate;
    const len = rate * 1.8;
    const impulse = audioCtx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    convolver.buffer = impulse;
    convolver.connect(masterGain!);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

export function warmUpAudio() {
  try {
    getCtx();
  } catch (_) {}
}

export function updateMasterVolume() {
  const { muted, volume } = useAudioState.getState();
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  }
}

export function startAmbient() {
  if (ambientStarted) return;
  const ctx = getCtx();
  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.12;
  ambientGain.connect(getMaster());

  const freqs = [55, 82.41, 110, 73.42];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
    osc.frequency.value = freq;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.03 + (i * 0.008);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200 + i * 50;
    filter.Q.value = 2;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1 + i * 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);
    lfo.start();

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(ambientGain!);
    osc.start();
    ambientNodes.push(osc, lfo);
    ambientSubNodes.push(oscGain, filter, lfoGain);
  });

  const noiseLen = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.015;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 300;
  noiseFilter.Q.value = 0.5;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(ambientGain);
  noiseSource.start();
  ambientNodes.push(noiseSource);
  ambientSubNodes.push(noiseFilter);

  ambientStarted = true;
}

export function stopAmbient() {
  ambientNodes.forEach((o) => {
    try { o.stop(); } catch {}
    try { o.disconnect(); } catch {}
  });
  ambientNodes = [];
  ambientSubNodes.forEach((n) => {
    try { n.disconnect(); } catch {}
  });
  ambientSubNodes = [];
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
  ambientStarted = false;
}

let lastFootstepTime = 0;
export function playFootstep() {
  const now = performance.now();
  if (now - lastFootstepTime < 320) return;
  lastFootstepTime = now;

  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80 + Math.random() * 40, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(convolver!);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.5;
  gain.connect(dryGain);
  dryGain.connect(getMaster());

  osc.start(t);
  osc.stop(t + 0.2);

  const noise = ctx.createBufferSource();
  const noiseLen = ctx.sampleRate * 0.05;
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.06;
  }
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.08, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  noise.connect(nGain);
  nGain.connect(convolver!);
  noise.start(t);
  noise.stop(t + 0.12);
}

export function playPickup() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.07;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(getMaster());

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    gain.connect(reverbGain);
    reverbGain.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.3);
  });

  const shimmer = ctx.createOscillator();
  shimmer.type = "triangle";
  shimmer.frequency.value = 2093;
  const sGain = ctx.createGain();
  sGain.gain.setValueAtTime(0.03, t + 0.2);
  sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  shimmer.connect(sGain);
  sGain.connect(getMaster());
  shimmer.start(t + 0.2);
  shimmer.stop(t + 0.65);
}

export function playVictoryFanfare() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const melody = [
    { freq: 523.25, time: 0, dur: 0.2 },
    { freq: 659.25, time: 0.15, dur: 0.2 },
    { freq: 783.99, time: 0.3, dur: 0.2 },
    { freq: 1046.5, time: 0.45, dur: 0.5 },
    { freq: 783.99, time: 0.7, dur: 0.15 },
    { freq: 1046.5, time: 0.85, dur: 0.6 },
  ];

  melody.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + time;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
    gain.gain.setValueAtTime(0.15, start + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(getMaster());

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.4;
    gain.connect(reverbSend);
    reverbSend.connect(convolver!);

    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
}

export function playLevelComplete() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [392, 523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.setValueAtTime(0.12, start + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

    osc.connect(gain);
    gain.connect(getMaster());

    const rv = ctx.createGain();
    rv.gain.value = 0.3;
    gain.connect(rv);
    rv.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.45);
  });
}

export function playGameOver() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [
    { freq: 293.66, time: 0 },
    { freq: 261.63, time: 0.3 },
    { freq: 220, time: 0.6 },
    { freq: 196, time: 0.9 },
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + time;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMaster());

    const rv = ctx.createGain();
    rv.gain.value = 0.5;
    gain.connect(rv);
    rv.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.6);
  });
}
