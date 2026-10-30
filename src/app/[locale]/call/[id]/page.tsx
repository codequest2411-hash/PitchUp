import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { loadCall } from "@/lib/calls";
import { HINT_COST } from "@/lib/levels";
import { CallClient } from "@/components/CallClient";
import type { Line } from "@/lib/scoring";

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const call = await loadCall(id);
  if (!call) notFound();
  if (call.endedAt) redirect({ href: `/results/${id}`, locale });

  return (
    <CallClient
      id={call.id}
      mode={call.mode as "voice" | "text"}
      maxSec={call.maxSec}
      startedAt={call.startedAt.getTime()}
      customerName={call.scenario.customerName}
      subtitle={`${call.scenario.profession.icon} ${tr(call.scenario, "title", locale)}`}
      initialTranscript={call.transcript as Line[]}
      hintCost={(await getUser()) ? HINT_COST : 0}
    />
  );
}
