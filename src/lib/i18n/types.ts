export type Locale = "en" | "hi";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
	{ code: "en", label: "English", nativeLabel: "English" },
	{ code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

export const LOCALE_STORAGE_KEY = "dharmlok_locale";

export type TranslationDict = typeof import("./translations/en").en;
