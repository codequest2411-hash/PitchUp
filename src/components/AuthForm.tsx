"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient, type Session } from "@supabase/supabase-js";
import { Link } from "@/i18n/navigation";
import type { SupabaseWebConfig } from "@/lib/auth";

type Mode = "login" | "register";

// No browser-side Supabase session is kept: the server swaps the access token for its own cookie.
const supabase = (c: SupabaseWebConfig) => createClient(c.url, c.anonKey, { auth: { flowType: "implicit", persistSession: false } });

async function startSession(body: object) {
  const res = await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error();
  const { locale } = await res.json();
  window.location.href = `/${locale}/dashboard`;
}

export function AuthForm({ mode, config, dev }: { mode: Mode; config: SupabaseWebConfig | null; dev: boolean }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  // Coming back from Google or from the email-confirmation link: tokens arrive in the URL hash.
  useEffect(() => {
    const hash = window.location.hash;
    if (!config || !/access_token|error/.test(hash)) return;
    history.replaceState(null, "", window.location.pathname);
    if (hash.includes("error")) return setError(true);
    const p = new URLSearchParams(hash.slice(1));
    run(() => startSession({ accessToken: p.get("access_token") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try {
      await fn();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await supabase(config!).auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href.split("#")[0] } });
    if (error) throw error;
  }

  async function email(form: FormData) {
    const [mail, pass, name] = [String(form.get("email")), String(form.get("password")), String(form.get("name") ?? "")];
    const auth = supabase(config!).auth;
    const { data, error } = mode === "register"
      ? await auth.signUp({ email: mail, password: pass, options: { data: { full_name: name || undefined }, emailRedirectTo: `${window.location.origin}${window.location.pathname.replace(/register$/, "login")}` } })
      : await auth.signInWithPassword({ email: mail, password: pass });
    if (error) throw error;
    const session: Session | null = data.session;
    if (!session) {
      // Email confirmation is on: the user finishes by clicking the link in their inbox.
      setCheckEmail(true);
      setBusy(false);
      return;
    }
    await startSession({ accessToken: session.access_token, name: name || undefined });
  }

  return (
    <div className="card mx-auto w-full max-w-md space-y-5 p-8">
      <h1 className="h2 text-center">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
      {checkEmail && <p role="status" className="card text-sm text-ok">{t("checkEmail")}</p>}
      {config && (
        <>
          {config.google && (<>
          <button className="btn-ghost w-full" disabled={busy} onClick={() => run(google)}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {t("google")}
          </button>
          <div className="flex items-center gap-3 text-xs text-muted"><hr className="flex-1 border-line" />{t("or")}<hr className="flex-1 border-line" /></div>
          </>)}
          <form action={(f) => run(() => email(f))} className="space-y-3">
            {mode === "register" && (
              <div><label className="label" htmlFor="name">{t("name")}</label><input id="name" name="name" className="input" autoComplete="name" /></div>
            )}
            <div><label className="label" htmlFor="email">{t("email")}</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
            <div><label className="label" htmlFor="password">{t("password")}</label><input id="password" name="password" type="password" required minLength={6} className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
            <button className="btn-primary w-full" disabled={busy}>{t("submit")}</button>
          </form>
        </>
      )}
      {dev && (
        <div className="space-y-3 rounded-xl border border-dashed border-accent p-4">
          <p className="text-sm font-semibold">{t("devTitle")}</p>
          <p className="text-sm text-muted">{t("devText")}</p>
          <button className="btn-primary w-full" disabled={busy} onClick={() => run(() => startSession({ dev: "student" }))}>{t("devStudent")}</button>
          <button className="btn-ghost w-full" disabled={busy} onClick={() => run(() => startSession({ dev: "admin" }))}>{t("devAdmin")}</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-bad">{t("failed")}</p>}
      <p className="text-center text-sm text-muted">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-brand">
          {mode === "login" ? tc("register") : tc("login")}
        </Link>
      </p>
    </div>
  );
}
