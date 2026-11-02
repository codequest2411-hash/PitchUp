import { NextResponse } from "next/server";

// Flitt sends the customer back with a POST, which pages can't take; bounce to the page with a GET.
// Payment status comes only from the signed server callback, never from this redirect.
function back(req: Request) {
  const to = new URL(req.url).searchParams.get("to") ?? "/";
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/"; // no open redirect
  return NextResponse.redirect(new URL(safe, process.env.APP_URL ?? req.url), 303);
}
export const POST = back;
export const GET = back;
