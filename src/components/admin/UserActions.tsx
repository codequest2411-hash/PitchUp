"use client";
import { updateUserAction } from "@/app/[locale]/admin/actions";

// Admin rights come from ADMIN_EMAILS only, so there is no promote/demote button here.
export function UserActions({ id, banned, labels }: { id: string; banned: boolean; labels: { ban: string; unban: string } }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={() => updateUserAction(id, { banned: !banned })} className="btn border border-bad px-3 py-1.5 text-bad">
        {banned ? labels.unban : labels.ban}
      </button>
    </div>
  );
}
