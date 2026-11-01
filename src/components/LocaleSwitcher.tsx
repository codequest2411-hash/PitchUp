"use client";
import { setLocaleAction } from "@/app/actions";

export function LocaleSwitcher({ current, loggedIn }: { current: string; loggedIn: boolean }) {
  async function change(locale: string) {
    if (loggedIn) await setLocaleAction(locale);
    // next-intl middleware stores the NEXT_LOCALE cookie when the new prefix is visited.
    const { pathname, search } = window.location;
    window.location.assign(pathname.replace(/^\/(ka|en)(?=\/|$)/, "/" + locale) + search);
  }

  return (
    <div className="flex overflow-hidden rounded-xl border border-line text-xs font-bold" role="group" aria-label="Language">
      {["en", "ka"].map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          aria-pressed={l === current}
          className={`px-2.5 py-2 ${l === current ? "bg-brand text-brand-fg" : "bg-card text-muted hover:text-fg"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
