// Browser-only: captures the other party (system audio / WASAPI loopback in the desktop app) and the mic,
// cuts each into spoken turns by loudness, and hands every turn over as a 16kHz WAV. Nothing is stored.
import { toBase64, WORKLET } from "./live-voice";

const RATE = 16000;
const CHUNK_MS = (2048 / RATE) * 1000; // the worklet posts 2048 samples

export function rms16(c: Int16Array) {
  let s = 0;
  for (const v of c) s += (v / 32768) ** 2;
  return Math.sqrt(s / (c.length || 1));
}

export function wav(pcm: Int16Array) {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return buf;
}

// Feed 128ms chunks; calls onTurn with the PCM of a turn once ~0.9s of silence follows enough speech.
// gated = the other side is talking, so mic sound is treated as speaker bleed, not speech.
export function segmenter(onTurn: (pcm: Int16Array) => void, threshold = 0.012, silenceMs = 900, minSpeechMs = 400, maxMs = 24000) {
  let chunks: Int16Array[] = [];
  let preroll: Int16Array[] = [];
  let speech = 0;
  let silence = 0;
  return (chunk: Int16Array, gated = false) => {
    const loud = !gated && rms16(chunk) > threshold;
    if (!chunks.length && !loud) {
      preroll = [...preroll, chunk].slice(-2); // keeps the first syllable
      return false;
    }
    if (!chunks.length) chunks = preroll;
    chunks.push(chunk);
    if (loud) {
      speech += CHUNK_MS;
      silence = 0;
    } else silence += CHUNK_MS;
    if (silence >= silenceMs || chunks.length * CHUNK_MS >= maxMs) {
      if (speech >= minSpeechMs) {
        const pcm = new Int16Array(chunks.reduce((n, c) => n + c.length, 0));
        chunks.reduce((o, c) => (pcm.set(c, o), o + c.length), 0);
        onTurn(pcm);
      }
      chunks = [];
      preroll = [];
      speech = silence = 0;
    }
    return loud;
  };
}

export type Speaker = "user" | "ai"; // user = seller (mic), ai = the other party (system audio)

export async function startAssist(onTurn: (speaker: Speaker, wavBase64: string) => void, onEnded: () => void) {
  // In the desktop app the main process answers this with system loopback audio; in Chrome the user picks a screen + "share system audio".
  const system = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, systemAudio: "include" } as DisplayMediaStreamOptions);
  system.getVideoTracks().forEach((t) => t.stop());
  if (!system.getAudioTracks().length) throw new Error("no-system-audio");
  let mic: MediaStream;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch {
    system.getTracks().forEach((t) => t.stop());
    throw new Error("mic");
  }

  const ctx = new AudioContext({ sampleRate: RATE });
  const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  await ctx.audioWorklet.addModule(url);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  silent.connect(ctx.destination);

  const lastLoud = { user: 0, ai: 0 };
  const pipe = (stream: MediaStream, who: Speaker) => {
    const node = new AudioWorkletNode(ctx, "pcm-capture");
    ctx.createMediaStreamSource(stream).connect(node).connect(silent);
    const feed = segmenter((pcm) => onTurn(who, toBase64(wav(pcm))));
    node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      const gated = who === "user" && Date.now() - lastLoud.ai < 400;
      if (feed(new Int16Array(e.data), gated)) lastLoud[who] = Date.now();
    };
  };
  pipe(system, "ai");
  pipe(mic, "user");

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    [...system.getTracks(), ...mic.getTracks()].forEach((t) => t.stop());
    void ctx.close();
    URL.revokeObjectURL(url);
  };
  system.getAudioTracks()[0].onended = () => (stop(), onEnded());
  return { stop, speaking: (who: Speaker) => Date.now() - lastLoud[who] < 600 };
}
