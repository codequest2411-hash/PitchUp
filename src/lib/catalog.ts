import { unstable_cache } from "next/cache";
import { db } from "./db";

// Catalog content only changes through /admin (which revalidates this tag). Caching it matters because
// Netlify runs functions in Ohio and the DB is in Paris, so every uncached query costs ~100ms+.
export const CATALOG_TAG = "catalog";
const cached = <A extends unknown[], R>(key: string, fn: (...args: A) => Promise<R>) =>
  unstable_cache(fn, [key], { revalidate: 3600, tags: [CATALOG_TAG] });

const byOrder = { orderBy: { order: "asc" as const } };
const byLevel = { orderBy: { requiredLevel: "asc" as const } };

export const getProfessions = cached("professions-v3", () => db.profession.findMany(byOrder));

export const getProfessionsWithCounts = cached("professions-counts-v3", () =>
  db.profession.findMany({ ...byOrder, include: { _count: { select: { courses: true, scenarios: true } } } }),
);

export const getProfessionsWithScenarios = cached("professions-scenarios-v3", () =>
  db.profession.findMany({ ...byOrder, include: { scenarios: byLevel } }),
);

export const getProfession = cached("profession-v3", (slug: string) =>
  db.profession.findUnique({
    where: { slug },
    include: { courses: { where: { published: true }, ...byLevel, include: { profession: true } }, scenarios: byLevel },
  }),
);

// Lesson titles and types let catalog cards show what a course teaches.
const withStats = {
  profession: true,
  _count: { select: { enrollments: true } },
  modules: { select: { lessons: { select: { type: true, titleEn: true, titleKa: true }, orderBy: { order: "asc" as const } } }, orderBy: { order: "asc" as const } },
} as const;

// Most-enrolled first; level breaks ties so a brand-new catalog still shows the beginner courses.
export const getPopularCourses = cached("courses-popular-v4", (take: number) =>
  db.course.findMany({
    where: { published: true },
    include: withStats,
    orderBy: [{ enrollments: { _count: "desc" } }, { requiredLevel: "asc" }, { isFree: "desc" }],
    take,
  }),
);

export const getCourses = cached("courses-v4", (profession?: string, price?: string, level?: number) =>
  db.course.findMany({
    where: {
      published: true,
      profession: profession ? { slug: profession } : undefined,
      isFree: price === "free" ? true : price === "paid" ? false : undefined,
      requiredLevel: level ? { lte: level } : undefined,
    },
    include: withStats,
    orderBy: [{ profession: { order: "asc" } }, { requiredLevel: "asc" }],
  }),
);

export const getCourse = cached("course", (slug: string) =>
  db.course.findUnique({
    where: { slug },
    include: {
      profession: true,
      modules: { ...byOrder, include: { lessons: { ...byOrder, include: { questions: true } } } },
    },
  }),
);
