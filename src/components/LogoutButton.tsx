"use client";

export function LogoutButton({ label }: { label: string }) {
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    const { getApps } = await import("firebase/app");
    if (getApps().length) {
      const { getAuth, signOut } = await import("firebase/auth");
      await signOut(getAuth(getApps()[0]));
    }
    window.location.href = "/";
  }
  return <button onClick={logout} className="btn-ghost">{label}</button>;
}
