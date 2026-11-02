"use client";

export function LogoutButton({ label }: { label: string }) {
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }
  return <button onClick={logout} className="btn-ghost">{label}</button>;
}
