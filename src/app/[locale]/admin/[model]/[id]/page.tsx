import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { delegate, ENTITIES, isEntity, refOptions, type Field } from "@/lib/admin-config";
import { EntityForm } from "@/components/admin/EntityForm";

export default async function Page({ params }: { params: Promise<{ locale: string; model: string; id: string }> }) {
  const { locale, model, id } = await params;
  setRequestLocale(locale);
  if (!isEntity(model)) notFound();
  const t = await getTranslations("admin");
  const fields = ENTITIES[model].fields as Field[];
  const row = id === "new" ? {} : await delegate(model).findUnique({ where: { id } });
  if (!row) notFound();

  const refs: Record<string, { id: string; label: string }[]> = {};
  for (const f of fields) if (f.ref) refs[f.name] = await refOptions(f.ref);

  // Values serialised for inputs: JSON fields as pretty text, everything else as-is.
  const values = Object.fromEntries(
    fields.map((f) => [f.name, f.type === "json" && row[f.name] != null ? JSON.stringify(row[f.name], null, 2) : (row[f.name] as string | number | boolean | null) ?? null]),
  );

  return (
    <div className="space-y-4">
      <h1 className="h1">{t(model)} — {id === "new" ? t("new") : t("edit")}</h1>
      <EntityForm model={model} id={id === "new" ? null : id} fields={fields} values={values} refs={refs} saveLabel={(await getTranslations("common"))("save")} />
    </div>
  );
}
