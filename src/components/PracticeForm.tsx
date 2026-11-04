"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProfessionIcon, professionHue } from "./ProfessionIcon";

type Scenario = { id: string; name: string; title: string; locked: boolean };
type Prof = { slug: string; order: number; title: string; scenarios: Scenario[] };

export function PracticeForm(props: {
  locale: string; professions: Prof[]; initialProfession?: string; initialScenario?: string;
  difficulties: { id: string; locked: boolean }[]; quota: string;
}) {
  const t = useTranslations("practice");
  const tc = useTranslations("common");
  const td = useTranslations("difficulty");
  const [profession, setProfession] = useState(props.initialProfession ?? "");
  const prof = props.professions.find((p) => p.slug === profession);
  const firstOpen = (p?: Prof) => p?.scenarios.find((s) => !s.locked)?.id ?? "";
  const [scenario, setScenario] = useState(props.initialScenario ?? firstOpen(prof));
  const [difficulty, setDifficulty] = useState(props.difficulties[0]?.id ?? "EASY");
  const [lang, setLang] = useState(props.locale);
  const [mode, setMode] = useState("voice");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = prof?.scenarios.find((s) => s.id === scenario);
  const hue = professionHue(prof?.order ?? 0);

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    const name = String(form.get("pname") ?? "").trim();
    const res = await fetch("/api/call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: scenario, difficulty, locale: lang, mode,
        customProduct: name
          ? { name, description: form.get("pdesc"), price: form.get("pprice"), target: form.get("ptarget") }
          : null,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      window.location.href = `/${props.locale}/call/${id}`;
      return;
    }
    setBusy(false);
    setError(res.status === 429 ? t("limitReached") : res.status === 403 ? t("locked") : tc("error"));
  }

  // Native radios kept for keyboard and screen readers; the label is the visible card.
  const tile = "relative flex cursor-pointer rounded-2xl border border-line bg-card transition hover:border-fg/25 has-[:checked]:border-fg has-[:checked]:shadow-[0_0_0_1px_var(--color-fg)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand";
  const seg = "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition has-[:checked]:bg-card has-[:checked]:text-fg has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand";
  const step = (n: number, label: string) => (
    <legend className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-fg text-xs text-bg">{n}</span>{label}
    </legend>
  );

  return (
    <form action={submit} className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0 space-y-8">
        <fieldset>
          {step(1, t("profession"))}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {props.professions.map((p) => {
              const h = professionHue(p.order);
              return (
                <label key={p.slug} className={`${tile} items-center gap-2 p-2.5 sm:flex-col sm:items-start sm:gap-2.5 sm:p-3`}>
                  <input type="radio" name="profession" value={p.slug} checked={profession === p.slug} className="sr-only"
                    onChange={() => { setProfession(p.slug); setScenario(firstOpen(p)); }} />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9" style={{ background: `hsl(${h} 90% 95%)`, color: `hsl(${h} 65% 38%)` }}>
                    <ProfessionIcon slug={p.slug} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-[13px] font-medium leading-tight [overflow-wrap:anywhere]">{p.title}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          {step(2, t("scenario"))}
          <div className="grid gap-2.5 sm:grid-cols-3">
            {prof?.scenarios.map((s) => (
              <label key={s.id} className={`${tile} items-center gap-3 p-3.5`} title={s.locked ? t("locked") : undefined}>
                <input type="radio" name="scenario" value={s.id} checked={scenario === s.id} disabled={s.locked} onChange={() => setScenario(s.id)} className="sr-only" />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold"
                  style={{ background: `hsl(${hue} 70% 90%)`, color: `hsl(${hue} 60% 30%)` }} aria-hidden>{s.name.charAt(0)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.title}</span>
                </span>
                {s.locked && <span className="absolute right-3 top-3 text-xs" aria-hidden>🔒</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          {step(3, t("difficulty"))}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {props.difficulties.map((d) => (
              <label key={d.id} className={`${tile} flex-col gap-1 p-3.5`} title={d.locked ? t("locked") : undefined}>
                <input type="radio" name="difficulty" value={d.id} checked={difficulty === d.id} disabled={d.locked} onChange={() => setDifficulty(d.id)} className="sr-only" />
                <span className="flex items-center justify-between text-sm font-semibold">{td(d.id)}{d.locked && <span aria-hidden className="text-xs">🔒</span>}</span>
                <span className="text-xs leading-snug text-muted">{t(`hint_${d.id}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            {step(4, t("language"))}
            <div className="flex gap-1 rounded-xl bg-fg/[0.05] p-1">
              {["ka", "en"].map((l) => (
                <label key={l} className={seg}>
                  <input type="radio" name="lang" value={l} checked={lang === l} onChange={() => setLang(l)} className="sr-only" />{t(l)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            {step(5, t("mode"))}
            <div className="flex gap-1 rounded-xl bg-fg/[0.05] p-1">
              {["voice", "text"].map((m) => (
                <label key={m} className={seg}>
                  <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />{t(m)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <details open={profession === "my-product"} className="group rounded-2xl border border-dashed border-line p-4 open:border-solid open:bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            {t("customProduct")}<span className="text-muted transition group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="pname">{t("productName")}</label><input id="pname" name="pname" maxLength={100} className="input" required={profession === "my-product"} /></div>
            <div><label className="label" htmlFor="pprice">{t("productPrice")}</label><input id="pprice" name="pprice" maxLength={60} className="input" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="pdesc">{t("productDesc")}</label><textarea id="pdesc" name="pdesc" maxLength={600} rows={3} className="input" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="ptarget">{t("productTarget")}</label><input id="ptarget" name="ptarget" maxLength={150} className="input" /></div>
          </div>
        </details>
      </div>

      {/* Call preview: what you are about to dial, and the button to dial it. */}
      <aside className="overflow-hidden rounded-3xl bg-[#0b0d17] text-white shadow-[0_30px_60px_-30px_rgb(16_24_40/0.5)] lg:sticky lg:top-24">
        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center"
          style={{ background: `radial-gradient(120% 80% at 50% 0%, hsl(${hue} 70% 35% / 0.55), transparent 70%)` }}>
          <span className="text-xs uppercase tracking-[0.18em] text-white/50">{t("summary")}</span>
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold ring-1 ring-white/15">
            {chosen?.name.charAt(0) ?? "?"}
            <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-white/20 [animation-duration:2.4s]" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-semibold">{chosen?.name ?? "—"}</p>
            <p className="text-sm text-white/60">{chosen?.title}</p>
          </div>
        </div>
        <dl className="space-y-2.5 border-t border-white/10 px-6 py-5 text-sm">
          {[
            [t("profession"), prof?.title],
            [t("difficulty"), td(difficulty)],
            [t("language"), t(lang)],
            [t("mode"), t(mode)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><dt className="text-white/50">{k}</dt><dd className="truncate text-right font-medium">{v}</dd></div>
          ))}
        </dl>
        <div className="space-y-3 px-6 pb-6">
          {error && <p role="alert" className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#22c55e] py-3.5 text-base font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-50" disabled={busy || !scenario}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z" /></svg>
            {busy ? tc("loading") : t("start")}
          </button>
          <p className="text-center text-xs text-white/50">{props.quota}</p>
        </div>
      </aside>
    </form>
  );
}
