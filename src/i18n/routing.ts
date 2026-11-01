import { defineRouting } from "next-intl/routing";

// Always open in English; Georgian only via the KA switcher (/ka/... URLs), not browser language.
export const routing = defineRouting({ locales: ["en", "ka"], defaultLocale: "en", localeDetection: false });
export type Locale = (typeof routing.locales)[number];
