"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

// Posts to a payment route that returns { url } and redirects there (Stripe Checkout / Portal).
export function CheckoutButton({ body, className, children, endpoint = "/api/checkout" }: {
  body?: object; className?: string; children: React.ReactNode; endpoint?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [state, setState] = useState<"idle" | "busy" | "error" | "off">("idle");

  async function go() {
    setState("busy");
    const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, locale }) });
    if (res.status === 503) return setState("off");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) return setState("error");
    window.location.href = data.url;
  }

  return (
    <div className="space-y-1">
      <button onClick={go} disabled={state === "busy"} className={`${className ?? "btn-primary"} w-full`}>{state === "busy" ? t("loading") : children}</button>
      {state === "off" && <p className="text-xs text-muted">{t("notConfigured")}</p>}
      {state === "error" && <p role="alert" className="text-xs text-bad">{t("error")}</p>}
    </div>
  );
}
