import { NextResponse } from "next/server";

// Confirmation emails link here (our domain) instead of supabase.co; see the "Confirm signup" template.
// We redeem the one-time token_hash with Supabase and hand the access token to the login page,
// which turns it into our session cookie the same way the Google redirect does.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.APP_URL ?? url.origin;
  const next = url.searchParams.get("next");
  // Only same-site paths, no open redirect.
  const path = next && new URL(next, base).origin === new URL(base).origin ? new URL(next, base).pathname : "/en/login";
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_ANON_KEY!, "content-type": "application/json" },
    body: JSON.stringify({ type: url.searchParams.get("type") ?? "email", token_hash: url.searchParams.get("token_hash") }),
  }).catch(() => null);
  const data = res?.ok ? await res.json() : null;
  const hash = data?.access_token ? `access_token=${encodeURIComponent(data.access_token)}` : "error=confirm_failed";
  return NextResponse.redirect(new URL(`${path}#${hash}`, base), 303);
}
