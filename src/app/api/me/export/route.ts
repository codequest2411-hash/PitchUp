import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = await db.user.findUnique({
    where: { id: user.id },
    include: { calls: true, progress: true, enrollments: true, subscriptions: true, purchases: true, badges: true },
  });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="pitchup-my-data.json"' },
  });
}
