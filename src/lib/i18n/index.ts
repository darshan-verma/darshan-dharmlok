import type { Locale, TranslationDict } from "./types";
import { en } from "./translations/en";
import { hi } from "./translations/hi";

const dictionaries: Record<Locale, TranslationDict> = { en, hi };

export function getDictionary(locale: Locale): TranslationDict {
	return dictionaries[locale] ?? en;
}

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
	? {
			[K in keyof T & string]: T[K] extends object
				? NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
				: Prefix extends ""
					? K
					: `${Prefix}.${K}`;
		}[keyof T & string]
	: never;

export type TranslationKey = NestedKeyOf<TranslationDict>;

export function resolveTranslation(
	dict: TranslationDict,
	key: string,
): string | undefined {
	const parts = key.split(".");
	let current: unknown = dict;
	for (const part of parts) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === "string" ? current : undefined;
}

export { en, hi };
