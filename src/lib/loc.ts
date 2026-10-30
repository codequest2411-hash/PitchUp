// Picks the ka/en column for the current locale: tr(course, "title", "ka") -> course.titleKa
export function tr<T extends object>(obj: T, field: string, locale: string): string {
  const key = field + (locale === "en" ? "En" : "Ka");
  return String((obj as Record<string, unknown>)[key] ?? "");
}
