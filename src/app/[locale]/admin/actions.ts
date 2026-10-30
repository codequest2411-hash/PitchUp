"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { delegate, isEntity, parseForm } from "@/lib/admin-config";

export async function saveEntityAction(model: string, id: string | null, form: FormData) {
  await requireAdmin();
  if (!isEntity(model)) return { error: "unknown model" };
  // Return errors instead of throwing: Next.js hides thrown messages in production.
  try {
    const data = parseForm(model, form);
    if (id) await delegate(model).update({ where: { id }, data });
    else await delegate(model).create({ data });
  } catch (e) {
    return { error: e instanceof Error ? e.message.split("\n").pop() : "save failed" };
  }
  revalidatePath("/", "layout");
  return {};
}

export async function deleteEntityAction(model: string, id: string) {
  await requireAdmin();
  if (!isEntity(model)) throw new Error("unknown model");
  await delegate(model).delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function updateUserAction(userId: string, change: { banned?: boolean; role?: "STUDENT" | "ADMIN" }) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("cannot change yourself");
  const data = z.object({ banned: z.boolean().optional(), role: z.enum(["STUDENT", "ADMIN"]).optional() }).parse(change);
  await db.user.update({ where: { id: userId }, data });
  revalidatePath("/", "layout");
}
