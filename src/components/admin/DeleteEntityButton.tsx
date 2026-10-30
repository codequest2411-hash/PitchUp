"use client";
import { deleteEntityAction } from "@/app/[locale]/admin/actions";

export function DeleteEntityButton({ model, id, label, confirm }: { model: string; id: string; label: string; confirm: string }) {
  return (
    <button
      onClick={async () => window.confirm(confirm) && (await deleteEntityAction(model, id))}
      className="btn border border-bad px-3 py-1.5 text-bad hover:bg-bad/10"
    >
      {label}
    </button>
  );
}
