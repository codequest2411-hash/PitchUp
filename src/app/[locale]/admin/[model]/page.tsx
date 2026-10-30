import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { delegate, ENTITIES, isEntity } from "@/lib/admin-config";
import { DeleteEntityButton } from "@/components/admin/DeleteEntityButton";

export default async function Page({ params }: { params: Promise<{ locale: string; model: string }> }) {
  const { locale, model } = await params;
  setRequestLocale(locale);
  if (!isEntity(model)) notFound();
  const t = await getTranslations("admin");
  const cols = ENTITIES[model].list;
  const rows = await delegate(model).findMany({ take: 300 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">{t(model)}</h1>
        <Link href={`/admin/${model}/new`} className="btn-primary">+ {t("new")}</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>{cols.map((c) => <th key={c} className="p-3">{c}</th>)}<th className="p-3" /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-line">
                {cols.map((c) => <td key={c} className="max-w-xs truncate p-3">{String(r[c] ?? "")}</td>)}
                <td className="flex justify-end gap-2 p-3">
                  <Link href={`/admin/${model}/${r.id}`} className="btn-ghost px-3 py-1.5">{t("edit")}</Link>
                  <DeleteEntityButton model={model} id={String(r.id)} label={t("delete")} confirm={t("deleteConfirm")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
