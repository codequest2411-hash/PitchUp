"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveEntityAction } from "@/app/[locale]/admin/actions";
import type { Field } from "@/lib/admin-config";

export function EntityForm(props: {
  model: string; id: string | null; fields: Field[]; saveLabel: string;
  values: Record<string, string | number | boolean | null>; refs: Record<string, { id: string; label: string }[]>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function save(form: FormData) {
    setError(null);
    const res = await saveEntityAction(props.model, props.id, form);
    if (res.error) setError(res.error);
    else router.push(`/admin/${props.model}`);
  }

  return (
    <form action={save} className="card grid gap-4 sm:grid-cols-2">
      {props.fields.map((f) => {
        const v = props.values[f.name];
        const common = { id: f.name, name: f.name, className: "input", required: !f.optional && f.type !== "bool" };
        const wide = f.type === "textarea" || f.type === "json";
        return (
          <div key={f.name} className={wide ? "sm:col-span-2" : ""}>
            {f.type === "bool" ? (
              <label className="flex items-center gap-2 pt-6"><input type="checkbox" name={f.name} defaultChecked={Boolean(v)} /> {f.name}</label>
            ) : (
              <>
                <label className="label" htmlFor={f.name}>{f.name}{f.type === "json" ? ' — [{"ka":"…","en":"…"}]' : ""}</label>
                {f.type === "textarea" || f.type === "json" ? (
                  <textarea {...common} rows={f.type === "json" ? 6 : 4} defaultValue={String(v ?? "")} className="input font-mono text-sm" />
                ) : f.type === "select" || f.type === "ref" ? (
                  <select {...common} defaultValue={String(v ?? "")}>
                    {f.optional && <option value="">—</option>}
                    {(f.type === "select" ? f.options!.map((o) => ({ id: o, label: o })) : props.refs[f.name]).map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input {...common} type={f.type === "number" ? "number" : "text"} defaultValue={String(v ?? "")} />
                )}
              </>
            )}
          </div>
        );
      })}
      {error && <p role="alert" className="text-sm text-bad sm:col-span-2">{error}</p>}
      <button className="btn-primary sm:col-span-2">{props.saveLabel}</button>
    </form>
  );
}
