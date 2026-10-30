"use client";
import { updateUserAction } from "@/app/[locale]/admin/actions";

export function UserActions({ id, banned, role, labels }: {
  id: string; banned: boolean; role: "STUDENT" | "ADMIN";
  labels: { ban: string; unban: string; makeAdmin: string; makeStudent: string };
}) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={() => updateUserAction(id, { role: role === "ADMIN" ? "STUDENT" : "ADMIN" })} className="btn-ghost px-3 py-1.5">
        {role === "ADMIN" ? labels.makeStudent : labels.makeAdmin}
      </button>
      <button onClick={() => updateUserAction(id, { banned: !banned })} className="btn border border-bad px-3 py-1.5 text-bad">
        {banned ? labels.unban : labels.ban}
      </button>
    </div>
  );
}
