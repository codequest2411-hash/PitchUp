import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { tr } from "@/lib/loc";
import { requireUser } from "@/lib/guard";
import { PrintButton } from "@/components/PrintButton";

// shortcut: certificate is a printable page (browser "Save as PDF"), not a server-generated PDF; add a PDF lib if a file download is required.
export default async function Page({ params }: { params: Promise<{ locale: string; course: string }> }) {
  const { locale, course: slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cert");
  const user = await requireUser(locale);
  const course = await db.course.findUnique({ where: { slug } });
  if (!course) notFound();
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (!enrollment?.completedAt) return <p className="card text-center">{t("notDone")}</p>;

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border-8 border-double border-brand bg-white p-10 text-center text-[#16142b] print:border-4">
        <Image src="/logo.svg" alt="PitchUp" width={160} height={44} className="mx-auto" />
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-lg">{t("body", { name: user.name ?? user.email ?? "" })}</p>
        <p className="text-2xl font-bold text-[#3B2DB8]">{tr(course, "title", locale)}</p>
        <p className="text-sm text-gray-500">{enrollment.completedAt.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US")}</p>
      </div>
      <div className="text-center print:hidden"><PrintButton label={t("print")} /></div>
    </div>
  );
}
