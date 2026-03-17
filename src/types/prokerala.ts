/**
 * Prokerala API types (calendar, panchang and shared).
 * See: https://api.prokerala.com/docs
 */

export const PROKERALA_CALENDAR_VALUES = [
	"tamil",
	"malayalam",
	"amanta",
	"purnimanta",
	"shaka-samvat",
	"vikram-samvat",
	"hijri",
	"gujarati",
	"bengali",
	"lunar",
] as const;

export type ProkeralaCalendarType = (typeof PROKERALA_CALENDAR_VALUES)[number];

export const PROKERALA_LANGUAGE_CODES = ["en", "ta", "te", "ml", "gu", "bn"] as const;

export type ProkeralaLanguageCode = (typeof PROKERALA_LANGUAGE_CODES)[number];

/** Calendar date payload from Prokerala (structure may vary by calendar type). */
export interface CalendarDate {
	[key: string]: unknown;
}

export interface ProkeralaCalendarResponse {
	status: string;
	data: CalendarDate;
}

/**
 * Panchang (Daily Panchang) types
 * See: /astrology/panchang and /astrology/panchang/advanced in Prokerala docs.
 */

export const PROKERALA_AYANAMSA_VALUES = [1, 3, 5] as const;

export type ProkeralaAyanamsa = (typeof PROKERALA_AYANAMSA_VALUES)[number];

export interface PanchangLord {
	id: number;
	name: string;
	vedic_name: string;
}

export interface PanchangSpan {
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface PanchangNakshatra extends PanchangSpan {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface PanchangTithi extends PanchangSpan {
	id: number;
	index: number;
	name: string;
	paksha: string;
}

export interface PanchangKarana extends PanchangSpan {
	id: number;
	index: number;
	name: string;
}

export interface PanchangYoga extends PanchangSpan {
	id: number;
	name: string;
}

export interface PanchangData {
	vaara: string;
	nakshatra: PanchangNakshatra[];
	tithi: PanchangTithi[];
	karana: PanchangKarana[];
	yoga: PanchangYoga[];
	sunrise: string;
	sunset: string;
	moonrise: string;
	moonset: string;
}

export interface PanchangAuspiciousPeriodSpan {
	start: string;
	end: string;
}

export interface PanchangAuspiciousPeriod {
	id: number;
	name: string;
	type: string;
	period: PanchangAuspiciousPeriodSpan[];
}

export interface PanchangAdvancedData extends PanchangData {
	auspicious_period: PanchangAuspiciousPeriod[];
	// The advanced payload may include additional properties; keep it open-ended.
	[key: string]: unknown;
}

export interface ProkeralaPanchangResponse {
	status: string;
	data: PanchangData;
}

export interface ProkeralaPanchangAdvancedResponse {
	status: string;
	data: PanchangAdvancedData;
}

/**
 * Generic Muhurat-style types used by Auspicious/Inauspicious period endpoints
 * and other Daily Panchang-related APIs that return an array of muhurt objects.
 */

export interface MuhuratPeriodSpan {
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface MuhuratItem {
	id: number;
	name: string;
	type: string;
	period: MuhuratPeriodSpan[];
}

export interface ProkeralaInauspiciousPeriodResponse {
	status: string;
	data: {
		muhurat: MuhuratItem[];
	};
}

export interface ProkeralaAuspiciousPeriodResponse {
	status: string;
	data: {
		muhurat: MuhuratItem[];
	};
}
