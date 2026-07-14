// Web Audio API sound effects — sintetizados, sem arquivos externos.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Punch/hit acústico — mistura de burst grave + click agudo. */
export function playHit(kind: "player" | "boss" = "boss") {
  const a = ac(); if (!a) return;
  const now = a.currentTime;
  // Low thump
  const o1 = a.createOscillator();
  const g1 = a.createGain();
  o1.type = "square";
  o1.frequency.setValueAtTime(kind === "boss" ? 180 : 120, now);
  o1.frequency.exponentialRampToValueAtTime(40, now + 0.12);
  g1.gain.setValueAtTime(0.35, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  o1.connect(g1).connect(a.destination);
  o1.start(now); o1.stop(now + 0.16);
  // High click / crunch
  const buf = a.createBuffer(1, a.sampleRate * 0.08, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const noise = a.createBufferSource();
  noise.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = kind === "boss" ? 2200 : 900;
  bp.Q.value = 1.2;
  const g2 = a.createGain();
  g2.gain.setValueAtTime(0.28, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  noise.connect(bp).connect(g2).connect(a.destination);
  noise.start(now);
}

/** Retoma AudioContext após interação do usuário (autoplay policy). */
export function unlockAudio() {
  const a = ac(); if (!a) return;
  if (a.state === "suspended") a.resume().catch(() => {});
}