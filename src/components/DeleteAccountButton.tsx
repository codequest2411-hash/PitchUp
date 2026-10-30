"use client";
import { deleteAccountAction } from "@/app/actions";

export function DeleteAccountButton({ label, confirm }: { label: string; confirm: string }) {
  async function run() {
    if (!window.confirm(confirm)) return;
    await deleteAccountAction();
    window.location.href = "/";
  }
  return <button onClick={run} className="btn border border-bad text-bad hover:bg-bad/10">🗑️ {label}</button>;
}
