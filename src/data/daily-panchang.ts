import type { ProkeralaAyanamsa } from "@/types/prokerala";
import {
	PROKERALA_CALENDAR_VALUES,
	type ProkeralaCalendarType,
} from "@/types/prokerala";

export const DAILY_PANCHANG_LANGUAGE_OPTIONS = [
	{ value: "en", label: "English" },
	{ value: "hi", label: "Hindi" },
	{ value: "ta", label: "Tamil" },
	{ value: "te", label: "Telugu" },
	{ value: "ml", label: "Malayalam" },
] as const;

export type DailyPanchangLanguageCode =
	(typeof DAILY_PANCHANG_LANGUAGE_OPTIONS)[number]["value"];

export const AYANAMSA_OPTIONS: {
	value: ProkeralaAyanamsa;
	label: string;
}[] = [
	{ value: 1, label: "Lahiri" },
	{ value: 3, label: "Raman" },
	{ value: 5, label: "KP" },
];

const CALENDAR_LABELS: Record<ProkeralaCalendarType, string> = {
	tamil: "Tamil",
	malayalam: "Malayalam",
	"shaka-samvat": "Shaka Samvat",
	"vikram-samvat": "Vikram Samvat",
	amanta: "Amanta",
	purnimanta: "Purnimanta",
	hijri: "Hijri",
	gujarati: "Gujarati",
	bengali: "Bengali",
	lunar: "Lunar",
};

export const CALENDAR_SYSTEM_OPTIONS = PROKERALA_CALENDAR_VALUES.map(
	(value) => ({
		value,
		label: CALENDAR_LABELS[value],
	})
);

export const CALENDAR_LANGUAGE_OPTIONS = [
	{ value: "en" as const, label: "English" },
	{ value: "ta" as const, label: "Tamil" },
];
