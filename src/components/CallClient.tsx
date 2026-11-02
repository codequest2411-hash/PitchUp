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

// Looks of the call screen, picked by the user (familiar phone / chat-app styles, no third-party branding).
const SKINS = {
  phone: { shell: "bg-gradient-to-b from-[#2a2f3f] via-[#161a26] to-[#0b0d17]", avatar: "bg-gradient-to-br from-[#8e96ad] to-[#5b6274]", me: "rounded-2xl rounded-br-md bg-[#2B44E6]", them: "rounded-2xl rounded-bl-md bg-white/12", chat: "bg-black/25", wave: ["#ffffff", "#7D8BFF"], pulse: "bg-white/25" },
  green: { shell: "bg-gradient-to-b from-[#0f4a40] via-[#0c2a27] to-[#0b141a]", avatar: "bg-[#2a9d74]", me: "rounded-lg rounded-tr-none bg-[#005c4b]", them: "rounded-lg rounded-tl-none bg-[#202c33]", chat: "bg-[#0b141a]", wave: ["#25d366", "#a7f3d0"], pulse: "bg-[#25d366]/30" },
  blue: { shell: "bg-gradient-to-b from-[#4b1fa8] via-[#1c3ed6] to-[#0b0d17]", avatar: "bg-gradient-to-br from-[#0a7cff] to-[#b13cff]", me: "rounded-3xl bg-gradient-to-r from-[#0a7cff] to-[#a334fa]", them: "rounded-3xl bg-white/12", chat: "bg-black/30", wave: ["#7cc3ff", "#e3a6ff"], pulse: "bg-[#a334fa]/35" },
};
type Skin = keyof typeof SKINS;

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
  const [skin, setSkin] = useState<Skin>("phone");
  const skinRef = useRef(skin);
  skinRef.current = skin;
  const k = SKINS[skin];
  useEffect(() => {
    try {
      const saved = localStorage.getItem("callSkin");
      if (saved && saved in SKINS) setSkin(saved as Skin);
    } catch {}
  }, []);
  function pickSkin(next: Skin) {
    setSkin(next);
    try {
      localStorage.setItem("callSkin", next);
    } catch {}
  }

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
          g.fillStyle = SKINS[skinRef.current].wave[v?.aiSpeaking() ? 1 : 0];
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

  const round = "flex h-14 w-14 items-center justify-center rounded-full text-xl transition disabled:opacity-40";
  const control = (label: string, icon: string, onClick: () => void, opts: { on?: boolean; disabled?: boolean; danger?: boolean; expanded?: boolean } = {}) => (
    <div className="flex w-20 flex-col items-center gap-1.5">
      <button onClick={onClick} disabled={opts.disabled} aria-label={label} aria-pressed={opts.on} aria-expanded={opts.expanded}
        className={`${round} ${opts.danger ? "bg-[#ff3b30] hover:bg-[#e2342a]" : opts.on ? "bg-white text-[#0b0d17]" : "bg-white/15 backdrop-blur hover:bg-white/25"}`}>
        <span aria-hidden>{icon}</span>
      </button>
      <span className="text-center text-[11px] leading-tight text-white/70" aria-hidden>{label}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="flex items-center justify-center gap-1 rounded-full border border-line bg-card p-1 text-sm" role="radiogroup" aria-label={t("styleLabel")}>
        {(["phone", "green", "blue"] as const).map((s) => (
          <button key={s} role="radio" aria-checked={skin === s} onClick={() => pickSkin(s)}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${skin === s ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
            {t(`style_${s}`)}
          </button>
        ))}
      </div>

      <div className={`overflow-hidden rounded-[2.25rem] text-white shadow-2xl ring-1 ring-black/10 ${k.shell}`}>
        <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-12">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{mode === "voice" ? t("voiceCall") : t("textChat")}</p>
          <div className="relative my-2 flex h-32 w-32 items-center justify-center">
            {(speaking || status === "connecting") && <span className={`absolute inset-0 animate-ping rounded-full ${k.pulse}`} />}
            <span className={`relative flex h-28 w-28 items-center justify-center rounded-full text-5xl font-semibold shadow-lg ${k.avatar}`}>
              {p.customerName[0]}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{p.customerName}</h1>
          <p className="-mt-1 text-sm text-white/60">{p.subtitle}</p>
          <p className="font-mono text-base tabular-nums text-white/85" aria-live="off">
            <span className={status === "live" ? "text-[#34c759]" : "text-white/40"}>●</span> {mmss(remaining)}
            {statusText && <span className="ml-2 font-sans text-white/60" aria-live="polite">· {statusText}</span>}
          </p>
          <canvas ref={canvas} width={320} height={40} className="h-10 w-full max-w-[16rem]" aria-hidden />
          {notice && <p role="status" className="rounded-2xl bg-white/10 px-4 py-2 text-center text-sm">{notice}</p>}
          {hint && <p role="status" className="rounded-2xl bg-white/15 px-4 py-2 text-center text-sm">💡 {hint}</p>}

          {status === "idle" ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button onClick={connect} aria-label={t("start")} className={`${round} h-16 w-16 bg-[#34c759] text-2xl hover:bg-[#2fb350]`}>📞</button>
              <span className="text-xs text-white/70">{t("start")}</span>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-y-4">
              {mode === "voice" && control(muted ? t("unmute") : t("mute"), muted ? "🔇" : "🎙️", toggleMute, { on: muted, disabled: status !== "live" })}
              {control(t("hint", { cost: p.hintCost }), "💡", getHint, { disabled: status !== "live" })}
              {mode === "voice" && control(showTranscript ? t("hideTranscript") : t("showTranscript"), "💬", () => setShowTranscript(!showTranscript), { on: showTranscript, expanded: showTranscript })}
              {control(t("end"), "✕", () => void end(), { danger: true, disabled: status === "ending" })}
            </div>
          )}
        </div>

        {showTranscript && (
          <div className={`border-t border-white/10 ${k.chat}`}>
            <div ref={list} className="max-h-80 space-y-2 overflow-y-auto p-4" aria-live="polite" aria-label={t("transcript")}>
              {lines.length === 0 && <p className="text-center text-sm text-white/50">{t("startHint")}</p>}
              {lines.map((l, i) => (
                <div key={i} className={`flex ${l.role === "user" ? "justify-end" : ""}`}>
                  <p className={`max-w-[80%] px-3.5 py-2 text-sm ${l.role === "user" ? k.me : k.them}`}>
                    <span className="sr-only">{l.role === "user" ? t("you") : p.customerName}: </span>
                    {l.text}
                  </p>
                </div>
              ))}
            </div>
            {mode === "text" && status === "live" && (
              <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
                <label htmlFor="msg" className="sr-only">{t("placeholder")}</label>
                <input id="msg" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} autoFocus autoComplete="off"
                  placeholder={t("placeholder")} className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-2 focus:outline-white/40" />
                <button disabled={sending || !input.trim()} aria-label={t("send")} className={`${round} h-11 w-11 bg-white text-base text-[#0b0d17]`}>➤</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
