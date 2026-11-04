// Browser-only: streams the mic to Gemini Live and plays the AI customer's voice back.
import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";

// Converts mic Float32 frames to 16-bit PCM in ~128ms chunks.
export const WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Int16Array(2048); this.n = 0; }
  process(inputs) {
    const ch = inputs[0][0];
    if (ch) for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.buf.length) { this.port.postMessage(this.buf.slice().buffer); this.n = 0; }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);`;

export function toBase64(buf: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

function rms(a: AnalyserNode) {
  const d = new Float32Array(a.fftSize);
  a.getFloatTimeDomainData(d);
  return Math.sqrt(d.reduce((sum, v) => sum + v * v, 0) / d.length);
}

export const HANG_UP_TOOLS = [{ functionDeclarations: [{ name: "hang_up", description: "End the phone call right now because you are angry or done talking to this seller. Say your goodbye line first." }] }];

export type VoiceHandlers = { onText: (role: "user" | "ai", chunk: string) => void; onClose: () => void; onHangUp: () => void };

export async function startVoice(token: string, model: string, h: VoiceHandlers) {
  const mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const inCtx = new AudioContext({ sampleRate: 16000 });
  const outCtx = new AudioContext({ sampleRate: 24000 });
  const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  await inCtx.audioWorklet.addModule(url);

  const micSrc = inCtx.createMediaStreamSource(mic);
  const micAnalyser = inCtx.createAnalyser();
  const capture = new AudioWorkletNode(inCtx, "pcm-capture");
  const silent = inCtx.createGain();
  silent.gain.value = 0; // keeps the worklet pulled by the graph without echoing the mic
  micSrc.connect(micAnalyser);
  micSrc.connect(capture).connect(silent).connect(inCtx.destination);
  const outAnalyser = outCtx.createAnalyser();
  outAnalyser.connect(outCtx.destination);

  const playing = new Set<AudioBufferSourceNode>();
  let next = 0;
  let muted = false;
  let stopped = false;
  let hangingUp = false;

  function play(b64: string) {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const pcm = new Int16Array(bytes.buffer);
    const buf = outCtx.createBuffer(1, pcm.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const src = outCtx.createBufferSource();
    src.buffer = buf;
    src.connect(outAnalyser);
    next = Math.max(next, outCtx.currentTime);
    src.start(next);
    next += buf.duration;
    playing.add(src);
    src.onended = () => playing.delete(src);
  }

  const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
  const session = await ai.live.connect({
    model,
    // The real config (persona, transcription) is locked into the token server-side; tools can't be put in the
    // token (field_mask error), so the hang_up tool is declared here.
    config: { responseModalities: [Modality.AUDIO], tools: HANG_UP_TOOLS },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        // The customer called hang_up: let the goodbye line finish playing (max ~6s), then end.
        if (m.toolCall?.functionCalls?.some((f) => f.name === "hang_up") && !hangingUp) {
          hangingUp = true;
          muted = true;
          const started = Date.now();
          const wait = setInterval(() => {
            if (stopped || playing.size === 0 || Date.now() - started > 6000) {
              clearInterval(wait);
              if (!stopped) h.onHangUp();
            }
          }, 250);
        }
        const sc = m.serverContent;
        if (!sc) return;
        if (sc.interrupted) {
          playing.forEach((s) => s.stop());
          playing.clear();
          next = 0;
        }
        for (const p of sc.modelTurn?.parts ?? []) if (p.inlineData?.data) play(p.inlineData.data);
        if (sc.inputTranscription?.text) h.onText("user", sc.inputTranscription.text);
        if (sc.outputTranscription?.text) h.onText("ai", sc.outputTranscription.text);
      },
      onclose: () => !stopped && h.onClose(),
      onerror: () => !stopped && h.onClose(),
    },
  });

  // Feels like a real call: two rings (425 Hz ringback), then the customer picks up and speaks first.
  for (let i = 0; i < 2; i++) {
    const tone = outCtx.createOscillator();
    const gain = outCtx.createGain();
    tone.frequency.value = 425;
    gain.gain.value = 0.12;
    tone.connect(gain).connect(outCtx.destination);
    tone.start(outCtx.currentTime + i * 2);
    tone.stop(outCtx.currentTime + i * 2 + 1);
  }
  setTimeout(() => {
    if (!stopped) session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "(Your phone rings and you pick up.)" }] }], turnComplete: true });
  }, 3500);

  capture.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    if (!muted && !stopped) session.sendRealtimeInput({ audio: { data: toBase64(e.data), mimeType: "audio/pcm;rate=16000" } });
  };

  return {
    setMuted(m: boolean) {
      muted = m;
      mic.getAudioTracks().forEach((t) => (t.enabled = !m));
    },
    aiSpeaking: () => playing.size > 0,
    level: () => (playing.size > 0 ? rms(outAnalyser) : muted ? 0 : rms(micAnalyser)),
    stop() {
      stopped = true;
      session.close();
      mic.getTracks().forEach((t) => t.stop());
      void inCtx.close();
      void outCtx.close();
      URL.revokeObjectURL(url);
    },
  };
}

export type Voice = Awaited<ReturnType<typeof startVoice>>;
