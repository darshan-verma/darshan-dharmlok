/**
 * UI options for daily horoscope. Sign values must match
 * `HOROSCOPE_SIGNS` in `src/app/api/prokerala/_validation.ts`.
 */
export const ZODIAC_SIGN_VALUES = [
	"aries",
	"taurus",
	"gemini",
	"cancer",
	"leo",
	"virgo",
	"libra",
	"scorpio",
	"sagittarius",
	"capricorn",
	"aquarius",
	"pisces",
] as const;

export type ZodiacSignValue = (typeof ZODIAC_SIGN_VALUES)[number];

export const ZODIAC_OPTIONS: { value: ZodiacSignValue; label: string }[] =
	ZODIAC_SIGN_VALUES.map((sign) => ({
		value: sign,
		label: sign.charAt(0).toUpperCase() + sign.slice(1),
	}));

export const HOROSCOPE_TYPE_VALUES = [
	"general",
	"health",
	"career",
	"love",
] as const;

export type HoroscopeTypeValue = (typeof HOROSCOPE_TYPE_VALUES)[number];

export const HOROSCOPE_TYPE_OPTIONS: {
	value: HoroscopeTypeValue;
	label: string;
}[] = [
	{ value: "general", label: "General" },
	{ value: "health", label: "Health" },
	{ value: "career", label: "Career" },
	{ value: "love", label: "Love" },
];
