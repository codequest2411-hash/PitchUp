"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Prof = { slug: string; title: string; scenarios: { id: string; title: string; locked: boolean }[] };

export function PracticeForm(props: {
  locale: string; professions: Prof[]; initialProfession?: string; initialScenario?: string;
  difficulties: { id: string; locked: boolean }[];
}) {
  const t = useTranslations("practice");
  const tc = useTranslations("common");
  const td = useTranslations("difficulty");
  const [profession, setProfession] = useState(props.initialProfession ?? "");
  const prof = props.professions.find((p) => p.slug === profession);
  const firstOpen = (p?: Prof) => p?.scenarios.find((s) => !s.locked)?.id ?? "";
  const [scenario, setScenario] = useState(props.initialScenario ?? firstOpen(prof));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    const name = String(form.get("pname") ?? "").trim();
    const res = await fetch("/api/call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: scenario,
        difficulty: form.get("difficulty"),
        locale: form.get("lang"),
        mode: form.get("mode"),
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

  const radio = "flex cursor-pointer items-center justify-center rounded-xl border border-line p-3 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-brand-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

  return (
    <form action={submit} className="card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profession">{t("profession")}</label>
          <select id="profession" className="input" value={profession} onChange={(e) => {
            setProfession(e.target.value);
            setScenario(firstOpen(props.professions.find((p) => p.slug === e.target.value)));
          }}>
            {props.professions.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="scenario">{t("scenario")}</label>
          <select id="scenario" className="input" value={scenario} onChange={(e) => setScenario(e.target.value)} required>
            {prof?.scenarios.map((s) => (
              <option key={s.id} value={s.id} disabled={s.locked}>{s.title}{s.locked ? ` 🔒` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">{t("difficulty")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {props.difficulties.map((d, i) => (
            <label key={d.id} className={radio} title={d.locked ? t("locked") : undefined}>
              <input type="radio" name="difficulty" value={d.id} defaultChecked={i === 0} disabled={d.locked} className="sr-only" />
              {td(d.id)}{d.locked ? " 🔒" : ""}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="label">{t("language")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {["ka", "en"].map((l) => (
              <label key={l} className={radio}>
                <input type="radio" name="lang" value={l} defaultChecked={l === props.locale} className="sr-only" />{t(l)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">{t("mode")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {["voice", "text"].map((m, i) => (
              <label key={m} className={radio}>
                <input type="radio" name="mode" value={m} defaultChecked={i === 0} className="sr-only" />{m === "voice" ? "🎙️" : "💬"} {t(m)}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <details open={profession === "my-product"} className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer font-semibold">{t("customProduct")}</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="pname">{t("productName")}</label><input id="pname" name="pname" maxLength={100} className="input" required={profession === "my-product"} /></div>
          <div><label className="label" htmlFor="pprice">{t("productPrice")}</label><input id="pprice" name="pprice" maxLength={60} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="pdesc">{t("productDesc")}</label><textarea id="pdesc" name="pdesc" maxLength={600} rows={3} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ptarget">{t("productTarget")}</label><input id="ptarget" name="ptarget" maxLength={150} className="input" /></div>
        </div>
      </details>

      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <button className="btn-accent w-full py-3 text-base" disabled={busy || !scenario}>📞 {busy ? tc("loading") : t("start")}</button>
    </form>
  );
}
