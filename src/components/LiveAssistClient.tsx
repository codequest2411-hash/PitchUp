"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { startAssist, type Speaker } from "@/lib/live-assist-audio";

type Turn = { id: number; role: Speaker; text: string | null };
type Err = "limit" | "login" | "noSystem" | "mic" | "failed";

export function LiveAssistClient({ pro, freeLimit }: { pro: boolean; freeLimit: number }) {
  const t = useTranslations("assist");
  const locale = useLocale();
  const [told, setTold] = useState(false);
  const [brief, setBrief] = useState("");
  const briefRef = useRef("");
  briefRef.current = brief;
  useEffect(() => {
    try {
      setBrief(localStorage.getItem("assistBrief") ?? "");
    } catch {}
  }, []);
  const [running, setRunning] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<Err | null>(null);
  const [talking, setTalking] = useState<Speaker | null>(null);
  const session = useRef<Awaited<ReturnType<typeof startAssist>> | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const nextId = useRef(0);

  const update = (fn: (t: Turn[]) => Turn[]) => setTurns((turnsRef.current = fn(turnsRef.current)));
  const stop = () => {
    session.current?.stop();
    session.current = null;
    setRunning(false);
  };
  useEffect(() => () => session.current?.stop(), []);
  useEffect(() => {
    if (!running) return setTalking(null);
    const timer = setInterval(() => {
      const s = session.current;
      setTalking(s?.speaking("ai") ? "ai" : s?.speaking("user") ? "user" : null);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);

  async function onTurn(role: Speaker, audio: string) {
    const id = nextId.current++;
    // Placeholder keeps turns in spoken order even when replies come back out of order.
    const transcript = turnsRef.current.filter((x) => x.text).slice(-40).map((x) => ({ role: x.role, text: x.text! }));
    update((all) => [...all, { id, role, text: null }]);
    const res = await fetch("/api/live-assist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ speaker: role, audio, transcript, locale, brief: briefRef.current.slice(0, 600) || undefined }),
    }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    update((all) => (data?.heard ? all.map((x) => (x.id === id ? { ...x, text: data.heard } : x)) : all.filter((x) => x.id !== id)));
    if (data?.reply) setReply(data.reply);
    if (res?.status === 429 || res?.status === 401) {
      setError(res.status === 429 ? "limit" : "login");
      stop();
    }
  }

  async function start() {
    setError(null);
    try {
      session.current = await startAssist((role, audio) => void onTurn(role, audio), stop);
      setRunning(true);
    } catch (e) {
      const m = (e as Error).message;
      setError(m === "mic" ? "mic" : m === "no-system-audio" || (e as Error).name === "NotAllowedError" ? "noSystem" : "failed");
    }
  }

  const said = turns.filter((x) => x.text).slice(-6);
  return (
    <div className="space-y-3">
      {!running ? (
        <div className="card space-y-3">
          <p className="text-sm font-semibold">{t("consentTitle")}</p>
          <p className="text-sm text-muted">{t("consentText")}</p>
          <label className="block text-sm">
            <span className="font-semibold">{t("briefLabel")}</span>
            <textarea value={brief} maxLength={600} rows={3} placeholder={t("briefPlaceholder")} className="input mt-1 text-sm"
              onChange={(e) => {
                setBrief(e.target.value);
                try {
                  localStorage.setItem("assistBrief", e.target.value);
                } catch {}
              }} />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={told} onChange={(e) => setTold(e.target.checked)} className="mt-1" />
            {t("consentCheck")}
          </label>
          <p className="text-xs text-muted">{t("headphones")}</p>
          <button className="btn-primary w-full" disabled={!told} onClick={start}>{t("start")}</button>
          {!pro && (
            <p className="text-xs text-muted">
              {t("freeNote", { n: freeLimit })}{" "}
              <a href={`/${locale}/pricing`} target="_blank" className="font-semibold text-brand underline">{t("upgrade")}</a>
            </p>
          )}
        </div>
      ) : (
        <>
          <div role="status" className="flex items-center justify-between rounded-xl bg-bad/10 px-3 py-2 text-sm font-semibold text-bad">
            <span className="flex items-center gap-2">
              <span className="relative flex h-3 w-3"><span className="absolute h-3 w-3 animate-ping rounded-full bg-bad opacity-60" /><span className="h-3 w-3 rounded-full bg-bad" /></span>
              {t("listening")}
            </span>
            <span className="text-xs font-normal text-muted">{talking === "ai" ? t("theySpeak") : talking === "user" ? t("youSpeak") : ""}</span>
          </div>
          <div className="card space-y-1 border-brand" aria-live="polite">
            <p className="text-xs font-semibold uppercase text-brand">{t("sayThis")}</p>
            <p className="text-base font-semibold leading-snug">{reply || t("waiting")}</p>
          </div>
          {said.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {said.map((x) => (
                <li key={x.id}><b className={x.role === "ai" ? "text-accent" : "text-brand"}>{x.role === "ai" ? t("them") : t("you")}:</b> {x.text}</li>
              ))}
            </ul>
          )}
          <button className="btn-ghost w-full" onClick={stop}>{t("stop")}</button>
          <p className="text-xs text-muted">{t("noAudioStored")}</p>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {t(`err_${error}`)}{" "}
          {error === "limit" && <a href={`/${locale}/pricing`} target="_blank" className="font-semibold underline">{t("upgrade")}</a>}
        </p>
      )}
    </div>
  );
}
