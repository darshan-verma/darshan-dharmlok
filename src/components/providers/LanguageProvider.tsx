"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	getDictionary,
	resolveTranslation,
	type TranslationKey,
} from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/types";

type LanguageContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLocale(): Locale {
	if (typeof window === "undefined") return "en";
	try {
		const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
		if (stored === "hi" || stored === "en") return stored;
	} catch {
		/* ignore */
	}
	return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>("en");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setLocaleState(readStoredLocale());
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		document.documentElement.lang = locale === "hi" ? "hi" : "en";
		try {
			localStorage.setItem(LOCALE_STORAGE_KEY, locale);
		} catch {
			/* ignore */
		}
	}, [locale, hydrated]);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
	}, []);

	const dict = useMemo(() => getDictionary(locale), [locale]);
	const fallback = useMemo(() => getDictionary("en"), []);

	const t = useCallback(
		(key: TranslationKey) => {
			return (
				resolveTranslation(dict, key) ??
				resolveTranslation(fallback, key) ??
				key
			);
		},
		[dict, fallback],
	);

	const value = useMemo(
		() => ({ locale, setLocale, t }),
		[locale, setLocale, t],
	);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx) {
		throw new Error("useLanguage must be used within LanguageProvider");
	}
	return ctx;
}

export function useTranslation() {
	const { t, locale, setLocale } = useLanguage();
	return { t, locale, setLocale };
}
