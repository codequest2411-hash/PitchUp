"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Voice } from "@/lib/live-voice";
import type { Line } from "@/lib/scoring";

type Props = {
  id: string; mode: "voice" | "text"; maxSec: number; startedAt: number;
  customerName: string; subtitle: string; initialTranscript: Line[]; hintCost: number;
};
type Status = "idle" | "connecting" | "live" | "ending";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function CallClient(p: Props) {
  const t = useTranslations("call");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [mode, setMode] = useState(p.mode);
  const [status, setStatus] = useState<Status>(p.mode === "voice" ? "idle" : "live");
  const [lines, setLines] = useState<Line[]>(p.initialTranscript);
  const [remaining, setRemaining] = useState(p.maxSec);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(p.mode === "text");
  const [notice, setNotice] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const voice = useRef<Voice | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const canvas = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const ending = useRef(false);

  const end = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    setStatus("ending");
    const wasVoice = Boolean(voice.current);
    voice.current?.stop();
    voice.current = null;
    await fetch(`/api/call/${p.id}/end`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(wasVoice ? { transcript: linesRef.current.filter((l) => l.text.trim()) } : {}),
    });
    window.location.href = `/${locale}/results/${p.id}`;
  }, [p.id, locale]);

  // Timer + auto end when time runs out.
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, p.maxSec - (Date.now() - p.startedAt) / 1000);
      setRemaining(left);
      if (left <= 0 && status === "live") {
        setNotice(t("timeUp"));
        void end();
      }
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [p.maxSec, p.startedAt, status, end, t]);

  // Waveform
  useEffect(() => {
    let raf = 0;
    const hist: number[] = Array(40).fill(0);
    const draw = () => {
      const c = canvas.current;
      const v = voice.current;
      if (c) {
        hist.push(v ? Math.min(1, v.level() * 6) : 0.05);
        hist.shift();
        setSpeaking(Boolean(v?.aiSpeaking()));
        const g = c.getContext("2d")!;
        g.clearRect(0, 0, c.width, c.height);
        const w = c.width / hist.length;
        hist.forEach((h, i) => {
          const bh = Math.max(3, h * c.height);
          g.fillStyle = v?.aiSpeaking() ? "#FF7A1A" : "#8C80FF";
          g.fillRect(i * w + 1, (c.height - bh) / 2, w - 2, bh);
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [lines]);
  useEffect(() => () => voice.current?.stop(), []);

  function fallbackToText(msg: string) {
    setMode("text");
    setShowTranscript(true);
    setNotice(msg);
    setStatus("live");
  }

  async function connect() {
    setStatus("connecting");
    const res = await fetch(`/api/call/${p.id}/token`, { method: "POST" });
    if (!res.ok) return fallbackToText(t("voiceUnavailable"));
    const { token, model } = await res.json();
    try {
      const { startVoice } = await import("@/lib/live-voice");
      voice.current = await startVoice(token, model, {
        onText: (role, chunk) =>
          setLines((prev) => {
            const last = prev[prev.length - 1];
            return last?.role === role ? [...prev.slice(0, -1), { role, text: last.text + chunk }] : [...prev, { role, text: chunk }];
          }),
        onClose: () => void end(),
      });
      setStatus("live");
    } catch (e) {
      fallbackToText(e instanceof DOMException && e.name === "NotAllowedError" ? t("micDenied") : t("voiceUnavailable"));
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setLines((l) => [...l, { role: "user", text }]);
    const res = await fetch(`/api/call/${p.id}/message`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    if (res.ok) {
      const { reply } = await res.json();
      setLines((l) => [...l, { role: "ai", text: reply }]);
    } else if (res.status === 409) void end();
    else setNotice(tc("error"));
    setSending(false);
  }

  async function getHint() {
    const res = await fetch(`/api/call/${p.id}/hint`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(voice.current ? { transcript: linesRef.current } : {}),
    });
    if (res.ok) setHint((await res.json()).hint);
  }

  function toggleMute() {
    voice.current?.setMuted(!muted);
    setMuted(!muted);
  }

  const statusText = status === "connecting" ? t("connecting") : status === "ending" ? t("scoring") : status === "idle" ? "" : mode === "voice" ? (speaking ? t("speaking") : t("listening")) : t("live");

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-[#0f0c24] text-white shadow-2xl">
      <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-10">
        <div className="relative flex h-36 w-36 items-center justify-center">
          {(speaking || status === "connecting") && <span className="absolute inset-0 animate-ping rounded-full bg-[#FF7A1A]/40" />}
          <span className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-[#3B2DB8] text-5xl font-bold ring-4 ${speaking ? "ring-[#FF7A1A]" : "ring-white/10"}`}>
            {p.customerName[0]}
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{p.customerName}</h1>
          <p className="text-sm text-white/60">{p.subtitle}</p>
        </div>
        <p className="font-mono text-lg tabular-nums" aria-live="off">
          <span className={status === "live" ? "text-[#3ccf7f]" : "text-white/40"}>●</span> {mmss(remaining)}
        </p>
        <p className="h-5 text-sm text-white/70" aria-live="polite">{statusText}</p>
        <canvas ref={canvas} width={320} height={48} className="h-12 w-full max-w-xs" aria-hidden />
        {notice && <p role="status" className="rounded-xl bg-white/10 px-4 py-2 text-center text-sm">{notice}</p>}
        {hint && <p role="status" className="rounded-xl bg-[#FF7A1A]/20 px-4 py-2 text-center text-sm">💡 {hint}</p>}

        {status === "idle" ? (
          <button onClick={connect} className="btn bg-[#3ccf7f] px-8 py-4 text-lg text-[#0f0c24]">📞 {t("start")}</button>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {mode === "voice" && (
              <button onClick={toggleMute} disabled={status !== "live"} className="btn bg-white/10 hover:bg-white/20" aria-pressed={muted}>
                {muted ? "🔇 " + t("unmute") : "🎙️ " + t("mute")}
              </button>
            )}
            <button onClick={getHint} disabled={status !== "live"} className="btn bg-white/10 hover:bg-white/20">💡 {t("hint", { cost: p.hintCost })}</button>
            {mode === "voice" && (
              <button onClick={() => setShowTranscript(!showTranscript)} className="btn bg-white/10 hover:bg-white/20" aria-expanded={showTranscript}>
                📝 {showTranscript ? t("hideTranscript") : t("showTranscript")}
              </button>
            )}
            <button onClick={() => void end()} disabled={status === "ending"} className="btn bg-[#e5484d] hover:bg-[#d13a3f]">⏹ {t("end")}</button>
          </div>
        )}
      </div>

      {showTranscript && (
        <div className="border-t border-white/10 bg-black/20">
          <div ref={list} className="max-h-80 space-y-2 overflow-y-auto p-4" aria-live="polite" aria-label={t("transcript")}>
            {lines.length === 0 && <p className="text-center text-sm text-white/50">{t("startHint")}</p>}
            {lines.map((l, i) => (
              <div key={i} className={`flex ${l.role === "user" ? "justify-end" : ""}`}>
                <p className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${l.role === "user" ? "bg-[#3B2DB8]" : "bg-white/10"}`}>
                  <span className="block text-xs opacity-60">{l.role === "user" ? t("you") : p.customerName}</span>
                  {l.text}
                </p>
              </div>
            ))}
          </div>
          {mode === "text" && status === "live" && (
            <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
              <label htmlFor="msg" className="sr-only">{t("placeholder")}</label>
              <input id="msg" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} autoFocus autoComplete="off"
                placeholder={t("placeholder")} className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-2 focus:outline-[#8C80FF]" />
              <button disabled={sending || !input.trim()} className="btn bg-[#FF7A1A]">{t("send")}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
