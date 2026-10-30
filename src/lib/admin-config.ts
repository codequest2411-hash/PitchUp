import { db } from "./db";

export type FieldType = "text" | "textarea" | "number" | "bool" | "select" | "json" | "ref";
export type EntityName = "Profession" | "Course" | "Module" | "Lesson" | "Question" | "Scenario";
export type Field = { name: string; type: FieldType; options?: string[]; ref?: EntityName; optional?: boolean };

const f = (name: string, type: FieldType = "text", extra: Partial<Field> = {}): Field => ({ name, type, ...extra });
const both = (base: string, type: FieldType = "text") => [f(base + "Ka", type), f(base + "En", type)];

// One config drives list, form and save for every content model in /admin.
export const ENTITIES = {
  Profession: { list: ["icon", "titleEn", "slug"], fields: [f("slug"), ...both("title"), ...both("description", "textarea"), f("icon"), f("order", "number")] },
  Course: {
    list: ["titleEn", "isFree", "requiredLevel"],
    fields: [f("slug"), f("professionId", "ref", { ref: "Profession" }), ...both("title"), ...both("description", "textarea"), f("coverUrl", "text", { optional: true }),
      f("durationMin", "number"), f("requiredLevel", "number"), f("isFree", "bool"), f("priceGel", "number"), f("priceUsd", "number"), f("published", "bool")],
  },
  Module: { list: ["titleEn", "order"], fields: [f("courseId", "ref", { ref: "Course" }), ...both("title"), f("order", "number")] },
  Lesson: {
    list: ["titleEn", "type"],
    fields: [f("moduleId", "ref", { ref: "Module" }), f("type", "select", { options: ["TEXT", "VIDEO", "QUIZ", "CALL"] }), ...both("title"),
      f("contentKa", "textarea", { optional: true }), f("contentEn", "textarea", { optional: true }), f("videoUrl", "text", { optional: true }),
      f("scenarioId", "ref", { ref: "Scenario", optional: true }), f("xpReward", "number"), f("order", "number")],
  },
  Question: {
    list: ["questionEn", "correctIndex"],
    fields: [f("lessonId", "ref", { ref: "Lesson" }), ...both("question"), f("options", "json"), f("correctIndex", "number")],
  },
  Scenario: {
    list: ["customerName", "titleEn", "difficulty"],
    fields: [f("professionId", "ref", { ref: "Profession" }), ...both("title"), f("difficulty", "select", { options: ["EASY", "NORMAL", "HARD", "BOSS"] }),
      f("requiredLevel", "number"), f("isPro", "bool"), f("customerName"), ...both("personaPrompt", "textarea"), f("avatarUrl", "text", { optional: true })],
  },
} satisfies Record<EntityName, { list: string[]; fields: Field[] }>;

export const isEntity = (m: string): m is EntityName => m in ENTITIES;

type Delegate = {
  findMany(a?: object): Promise<Record<string, unknown>[]>;
  findUnique(a: object): Promise<Record<string, unknown> | null>;
  create(a: object): Promise<unknown>;
  update(a: object): Promise<unknown>;
  delete(a: object): Promise<unknown>;
};
export const delegate = (m: EntityName) => (db as unknown as Record<string, Delegate>)[m[0].toLowerCase() + m.slice(1)];

// Options for <select> of a foreign key, labelled so admins can tell e.g. identical module names apart.
export async function refOptions(m: EntityName): Promise<{ id: string; label: string }[]> {
  switch (m) {
    case "Module":
      return (await db.module.findMany({ include: { course: true }, orderBy: { course: { slug: "asc" } } })).map((x) => ({ id: x.id, label: `${x.course.titleEn} / ${x.titleEn}` }));
    case "Lesson":
      return (await db.lesson.findMany({ include: { module: { include: { course: true } } }, orderBy: { order: "asc" } })).map((x) => ({ id: x.id, label: `${x.module.course.titleEn} / ${x.titleEn}` }));
    case "Scenario":
      return (await db.scenario.findMany({ include: { profession: true } })).map((x) => ({ id: x.id, label: `${x.profession.titleEn} / ${x.customerName} — ${x.titleEn}` }));
    default:
      return (await delegate(m).findMany({ orderBy: { titleEn: "asc" } })).map((x) => ({ id: String(x.id), label: String(x.titleEn) }));
  }
}

// FormData -> typed record. Throws on invalid input (trust boundary, even for admins).
export function parseForm(m: EntityName, form: FormData) {
  const data: Record<string, unknown> = {};
  for (const fd of ENTITIES[m].fields as Field[]) {
    const raw = String(form.get(fd.name) ?? "").trim();
    if (fd.type === "bool") data[fd.name] = form.get(fd.name) === "on";
    else if (!raw) {
      if (!fd.optional) throw new Error(`${fd.name} is required`);
      data[fd.name] = null;
    } else if (fd.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`${fd.name} must be a number`);
      data[fd.name] = Math.round(n);
    } else if (fd.type === "json") data[fd.name] = JSON.parse(raw);
    else if (fd.type === "select" && !fd.options!.includes(raw)) throw new Error(`${fd.name} is invalid`);
    else data[fd.name] = raw;
  }
  return data;
}
