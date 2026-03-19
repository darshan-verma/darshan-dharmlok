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

/**
 * Chart API types (GET /astrology/chart)
 * See: ProKerala Chart API docs
 */
export const PROKERALA_CHART_TYPES = [
	"rasi",
	"navamsa",
	"lagna",
	"trimsamsa",
	"drekkana",
	"chaturthamsa",
	"dasamsa",
	"ashtamsa",
	"dwadasamsa",
	"shodasamsa",
	"hora",
	"akshavedamsa",
	"shashtyamsa",
	"panchamsa",
	"khavedamsa",
	"saptavimsamsa",
	"shashtamsa",
	"chaturvimsamsa",
	"saptamsa",
	"vimsamsa",
	"upagraha",
	"bhava",
	"sun",
	"moon",
] as const;

export type ProkeralaChartType = (typeof PROKERALA_CHART_TYPES)[number];

export const PROKERALA_CHART_STYLES = [
	"north-indian",
	"south-indian",
	"east-indian",
] as const;

export type ProkeralaChartStyle = (typeof PROKERALA_CHART_STYLES)[number];

export const PROKERALA_CHART_FORMATS = ["svg"] as const;

export type ProkeralaChartFormat = (typeof PROKERALA_CHART_FORMATS)[number];

export const PROKERALA_UPAGRAHA_POSITIONS = ["start", "middle", "end"] as const;

export type ProkeralaUpagrahaPosition =
	(typeof PROKERALA_UPAGRAHA_POSITIONS)[number];

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

/**
 * Choghadiya types
 * See: /astrology/choghadiya in Prokerala docs.
 */

export interface ChoghadiyaMuhurat {
	id: number;
	name: string;
	type: string;
	vela: string | null;
	is_day: boolean;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface ProkeralaChoghadiyaResponse {
	status: string;
	data: {
		muhurat: ChoghadiyaMuhurat[];
	};
}

/**
 * Chandra Bala types
 * See: /astrology/chandra-bala in Prokerala docs.
 */

export interface ChandraBalaRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface ChandraBalaSpan {
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
	rasis: ChandraBalaRasi[];
}

export interface ProkeralaChandraBalaResponse {
	status: string;
	data: {
		chandra_bala: ChandraBalaSpan[];
	};
}

/**
 * Tara Bala types
 * See: /astrology/tara-bala in Prokerala docs.
 */

export interface TaraBalaNakshatra {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface TaraBalaSpan {
	id: number;
	name: string;
	type: string;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
	nakshatras: TaraBalaNakshatra[];
}

export interface ProkeralaTaraBalaResponse {
	status: string;
	data: {
		tara_bala: TaraBalaSpan[];
	};
}

/**
 * Hora Timing types
 * See: /astrology/hora in Prokerala docs.
 */

export interface HoraTimingItem {
	hora: PanchangLord;
	type: string;
	is_day: boolean;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface ProkeralaHoraTimingResponse {
	status: string;
	data: {
		hora_timing: HoraTimingItem[];
	};
}

/**
 * Solstice types
 * See: /astrology/solstice in Prokerala docs.
 */
export interface SolsticeItem {
	id: number;
	name: string;
	vedic_name: string;
}

export interface ProkeralaSolsticeResponse {
	status: string;
	data: {
		solstice: SolsticeItem;
	};
}

/**
 * Ritu types
 * See: /astrology/ritu in Prokerala docs.
 */
export interface RituItem {
	id: number;
	name: string;
	vedic_name: string;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface ProkeralaRituResponse {
	status: string;
	data: {
		vedic_ritu: RituItem;
		drik_ritu: RituItem;
	};
}

/**
 * Anandadi Yoga types
 * See: /astrology/anandadi-yoga in Prokerala docs.
 */
export interface AnandadiYogaItem {
	id: number;
	name: string;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
	type: string;
	description: string;
}

export interface ProkeralaAnandadiYogaResponse {
	status: string;
	data: {
		anandadi_yoga: AnandadiYogaItem[];
	};
}

/**
 * Disha Shool types
 * See: /astrology/disha-shool in Prokerala docs.
 */
export interface DishaShoolItem {
	direction: string;
	remedy: string;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface ProkeralaDishaShoolResponse {
	status: string;
	data: {
		disha_shool: DishaShoolItem;
	};
}

/**
 * Auspicious Yoga types
 * See: /astrology/auspicious-yoga in Prokerala docs.
 */
export interface AuspiciousYogaCombinationItem {
	type: string;
	name: string;
}

export interface AuspiciousYogaPeriodItem {
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
	combination: AuspiciousYogaCombinationItem[];
}

export interface AuspiciousYogaItem {
	id: number;
	name: string;
	period: AuspiciousYogaPeriodItem[];
}

export interface ProkeralaAuspiciousYogaResponse {
	status: string;
	data: {
		auspicious_yoga: AuspiciousYogaItem[];
	};
}

/**
 * Gowri Nalla Neram types
 * See: /astrology/gowri-nalla-neram in Prokerala docs.
 */
export interface GowriNallaNeramMuhuratItem {
	id: number;
	name: string;
	type: string;
	is_day: boolean;
	start: string; // ISO-8601 with offset
	end: string; // ISO-8601 with offset
}

export interface ProkeralaGowriNallaNeramResponse {
	status: string;
	data: {
		muhurat: GowriNallaNeramMuhuratItem[];
	};
}

/**
 * Horoscope / prediction response types
 * See: /horoscope/daily, /horoscope/daily/advanced, /horoscope/daily/love-compatibility
 */

export interface ProkeralaDailyPredictionResponse {
	status: string;
	data: {
		daily_prediction: {
			sign_id: number;
			sign_name: string;
			date: string;
			prediction: string;
		};
	};
}

export interface HoroscopeSignLord {
	id: number;
	name: string;
}

export interface HoroscopeSign {
	id: number;
	name: string;
	lord: HoroscopeSignLord;
}

export interface HoroscopePredictionItem {
	type: string;
	prediction: string;
	seek?: string;
	challenge?: string;
	insight?: string;
}

export interface ProkeralaAdvancedDailyPredictionResponse {
	status: string;
	data: {
		datetime: string;
		daily_predictions: Array<{
			sign: HoroscopeSign;
			sign_info?: Record<string, unknown>;
			predictions: HoroscopePredictionItem[];
			aspects?: unknown[];
			transits?: unknown[];
		}>;
	};
}

export interface ProkeralaDailyLoveCompatibilityResponse {
	status: string;
	data: {
		datetime: string;
		daily_love_predictions: Array<{
			sign_combination: string;
			sign_one: HoroscopeSign;
			sign_two: HoroscopeSign;
			prediction: string;
		}>;
	};
}

/**
 * Astrology: Birth Details / Dosha checks
 * See:
 * - /astrology/birth-details
 * - /astrology/kaal-sarp-dosha
 * - /astrology/mangal-dosha
 */

export interface BirthDetailsNakshatra {
	id: number;
	name: string;
	lord: PanchangLord;
	pada: number;
}

export interface BirthDetailsRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface BirthDetailsZodiac {
	id: number;
	name: string;
}

export interface BirthDetailsAdditionalInfo {
	deity?: string;
	ganam?: string;
	symbol?: string;
	animal_sign?: string;
	nadi?: string;
	color?: string;
	best_direction?: string;
	syllables?: string;
	birth_stone?: string;
	gender?: string;
	planet?: string;
	enemy_yoni?: string;
	[key: string]: unknown;
}

export interface ProkeralaBirthDetailsResponse {
	status: string;
	data: {
		nakshatra: BirthDetailsNakshatra;
		chandra_rasi: BirthDetailsRasi;
		soorya_rasi: BirthDetailsRasi;
		zodiac: BirthDetailsZodiac;
		additional_info?: BirthDetailsAdditionalInfo;
		[key: string]: unknown;
	};
}

export interface ProkeralaKaalSarpDoshaResponse {
	status: string;
	data: {
		type: string | null;
		dosha_type: string;
		has_dosha: boolean;
		description: string;
		[key: string]: unknown;
	};
}

export interface ProkeralaMangalDoshaResponse {
	status: string;
	data: {
		has_dosha: boolean;
		description: string;
		[key: string]: unknown;
	};
}

/**
 * Detailed Mangal Dosha (advanced)
 * See: /astrology/mangal-dosha/advanced
 */
export interface ProkeralaMangalDoshaAdvancedResponse {
	status: string;
	data: {
		has_dosha: boolean;
		description: string;
		has_exception: boolean;
		type: string | null;
		exceptions?: unknown;
		remedies?: unknown;
		[key: string]: unknown;
	};
}

/**
 * Papasamyam
 * See: /astrology/papasamyam
 */
export interface PapaPlanetDoshaItem {
	id: number;
	name: string;
	position: number;
	has_dosha: boolean;
}

export interface PapaPlanetItem {
	name: string;
	planet_dosha: PapaPlanetDoshaItem[];
}

export interface ProkeralaPapasamyamResponse {
	status: string;
	data: {
		total_points: number;
		papa_samyam: {
			papa_planet: PapaPlanetItem[];
		};
	};
}

/**
 * Planet Position
 * See: /astrology/planet-position
 */
export interface PlanetPositionRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface PlanetPositionItem {
	id: number;
	name: string;
	longitude: number;
	is_retrograde: boolean;
	position: number;
	degree: number;
	rasi: PlanetPositionRasi;
}

export interface ProkeralaPlanetPositionResponse {
	status: string;
	data: {
		planet_position: PlanetPositionItem[];
	};
}

/**
 * Divisional Planet Position
 * See: /astrology/divisional-planet-position
 */
export interface DivisionalHouse {
	id: number;
	name: string;
	number: number;
}

export interface DivisionalPlanet {
	id: number;
	name: string;
	vedic_name: string;
}

export interface DivisionalRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface DivisionalDivision {
	id: number;
	number: number;
	name: string;
}

export interface DivisionalNakshatra {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface DivisionalPlanetPositionItem {
	planet: DivisionalPlanet;
	nakshatra: DivisionalNakshatra;
	house: DivisionalHouse;
	rasi: DivisionalRasi;
	division: DivisionalDivision;
	sign_degree: number;
	sign_degree_dms: string;
	longitude: number;
	longitude_dms: string;
}

export interface DivisionalHousePosition {
	house: DivisionalHouse;
	rasi: DivisionalRasi;
	planet_positions: DivisionalPlanetPositionItem[];
}

export interface ProkeralaDivisionalPlanetPositionResponse {
	status: string;
	data: {
		divisional_positions: DivisionalHousePosition[];
	};
}

/**
 * Chandrashtama Periods
 * See: /astrology/chandrashtama-periods
 */
export interface ChandrashtamaRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface ChandrashtamaNakshatra {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface ChandrashtamaPeakNakshatraTiming {
	nakshatra: ChandrashtamaNakshatra;
	start: string;
	end: string;
	is_peak: boolean | null;
}

export interface ChandrashtamaTiming {
	start: string;
	end: string;
	nakshatra_timings: ChandrashtamaPeakNakshatraTiming[];
}

export interface ProkeralaChandrashtamaPeriodsResponse {
	status: string;
	data: {
		chandrashtama: {
			rasi: ChandrashtamaRasi;
			nakshatra: ChandrashtamaNakshatra[];
		};
		chandrashtama_timing: ChandrashtamaTiming[];
	};
}

/**
 * Planet Relationship
 * See: /astrology/planet-relationship
 */
export interface ProkeralaPlanetRelationshipPlanet {
	id: number;
	name: string;
	vedic_name: string;
}

export interface ProkeralaNaturalRelationshipItem {
	first_planet: ProkeralaPlanetRelationshipPlanet;
	second_planet: ProkeralaPlanetRelationshipPlanet;
	relationship: string;
}

export interface ProkeralaPlanetRelationshipResponse {
	status: string;
	data: {
		planet_relationship: {
			natural_relationship: ProkeralaNaturalRelationshipItem[];
		};
	};
}

/**
 * Kundli (full horoscope)
 * See: /astrology/kundli
 */
export interface KundliNakshatraDetails {
	nakshatra: BirthDetailsNakshatra;
	chandra_rasi: BirthDetailsRasi;
	soorya_rasi: BirthDetailsRasi;
	zodiac: BirthDetailsZodiac;
	additional_info?: BirthDetailsAdditionalInfo;
}

export interface KundliMangalDoshaSummary {
	has_dosha: boolean;
	description: string;
}

export interface KundliYogaDetail {
	name: string;
	description: string;
	yoga_list?: KundliYogaListItem[];
}

export interface KundliYogaListItem {
	name: string;
	has_yoga: boolean;
	description: string;
}

export interface ProkeralaKundliResponse {
	status: string;
	data: {
		nakshatra_details: KundliNakshatraDetails;
		mangal_dosha: KundliMangalDoshaSummary;
		yoga_details: KundliYogaDetail[];
		[key: string]: unknown;
	};
}

/**
 * Detailed Kundli (advanced) - includes dasha periods and expanded mangal dosha
 * See: /astrology/kundli/advanced
 */
export interface KundliMangalDoshaAdvanced {
	has_dosha: boolean;
	description: string;
	has_exception: boolean;
	type: string | null;
	exceptions: string[];
	remedies: string[];
}

export interface DashaBalanceLord {
	id: number;
	name: string;
	vedic_name: string;
}

export interface DashaBalance {
	lord: DashaBalanceLord;
	duration: string;
	description: string;
}

export interface DashaPeriodItem {
	id: number;
	name: string;
	start: string;
	end: string;
	antardasha?: DashaPeriodItem[];
	pratyantardasha?: DashaPeriodItem[];
}

export interface ProkeralaKundliAdvancedResponse {
	status: string;
	data: {
		nakshatra_details: KundliNakshatraDetails;
		mangal_dosha: KundliMangalDoshaAdvanced;
		yoga_details: KundliYogaDetail[];
		dasha_balance?: DashaBalance;
		dasha_periods?: DashaPeriodItem[];
		[key: string]: unknown;
	};
}

/**
 * Dasha Periods (dedicated endpoint)
 * See: /astrology/dasha-periods
 */
export interface ProkeralaDashaPeriodsResponse {
	status: string;
	data: {
		dasha_periods: DashaPeriodItem[];
		dasha_balance: DashaBalance;
	};
}

/**
 * Kundli Matching
 * See: /astrology/kundli-matching and /astrology/kundli-matching/advanced
 */
export interface KundliMatchingPersonInfo {
	koot: string;
	nakshatra: string;
	rasi: string;
	[key: string]: unknown;
}

export interface KundliMatchingMessage {
	type: string;
	description: string;
	[key: string]: unknown;
}

export interface KundliMatchingGunaMilan {
	total_points: number;
	maximum_points: number;
	[key: string]: unknown;
}

export interface KundliMatchingGunaBreakdownItem {
	name: string;
	maximum_points: number;
	obtained_points: number;
	description?: string;
	[key: string]: unknown;
}

export interface ProkeralaKundliMatchingResponse {
	status: string;
	data: {
		girl_info: KundliMatchingPersonInfo;
		boy_info: KundliMatchingPersonInfo;
		message: KundliMatchingMessage;
		guna_milan: KundliMatchingGunaMilan;
		[key: string]: unknown;
	};
}

export interface ProkeralaKundliMatchingAdvancedResponse {
	status: string;
	data: {
		girl_info: KundliMatchingPersonInfo;
		boy_info: KundliMatchingPersonInfo;
		message: KundliMatchingMessage;
		guna_milan: KundliMatchingGunaMilan & {
			guna?: KundliMatchingGunaBreakdownItem[];
		};
		girl_mangal_dosha_details?: Record<string, unknown>;
		boy_mangal_dosha_details?: Record<string, unknown>;
		exceptions?: unknown[];
		[key: string]: unknown;
	};
}

/**
 * Nakshatra Porutham
 * See: /astrology/nakshatra-porutham and /astrology/nakshatra-porutham/advanced
 */
export interface NakshatraPoruthamMatchItem {
	id: number;
	name: string;
	has_porutham: boolean;
	[key: string]: unknown;
}

export interface NakshatraPoruthamAdvancedMatchItem
	extends NakshatraPoruthamMatchItem {
	porutham_status?: string;
	points?: number;
	description?: string;
}

export interface ProkeralaNakshatraPoruthamResponse {
	status: string;
	data: {
		maximum_points: number;
		obtained_points: number;
		message: string;
		matches: NakshatraPoruthamMatchItem[];
		[key: string]: unknown;
	};
}

export interface ProkeralaNakshatraPoruthamAdvancedResponse {
	status: string;
	data: {
		maximum_points: number;
		obtained_points: number;
		message: string;
		matches: NakshatraPoruthamAdvancedMatchItem[];
		[key: string]: unknown;
	};
}

/**
 * Thirumana Porutham
 * See: /astrology/thirumana-porutham and /astrology/thirumana-porutham/advanced
 */
export interface ThirumanaPoruthamMessage {
	type: string | null;
	description: string;
	[key: string]: unknown;
}

export interface ThirumanaPoruthamMatchItem {
	id: number;
	name: string;
	has_porutham: boolean;
	[key: string]: unknown;
}

export interface ThirumanaPoruthamAdvancedMatchItem
	extends ThirumanaPoruthamMatchItem {
	porutham_status: string | null;
	points: number;
	description: string;
}

export interface ProkeralaThirumanaPoruthamResponse {
	status: string;
	data: {
		maximum_points: number;
		obtained_points: number;
		message: ThirumanaPoruthamMessage;
		matches: ThirumanaPoruthamMatchItem[];
		[key: string]: unknown;
	};
}

export interface ProkeralaThirumanaPoruthamAdvancedResponse {
	status: string;
	data: {
		maximum_points: number;
		obtained_points: number;
		message: ThirumanaPoruthamMessage;
		matches: ThirumanaPoruthamAdvancedMatchItem[];
		[key: string]: unknown;
	};
}

/**
 * Porutham (Kerala/Tamil marriage matching)
 * See: /astrology/porutham
 */
export interface PoruthamPlanetLord {
	id: number;
	name: string;
	vedic_name: string;
	[key: string]: unknown;
}

export interface PoruthamNakshatraInfo {
	id: number;
	name: string;
	lord: PoruthamPlanetLord;
	pada: number;
	[key: string]: unknown;
}

export interface PoruthamRasiInfo {
	id: number;
	name: string;
	lord: PoruthamPlanetLord;
	[key: string]: unknown;
}

export interface PoruthamPersonInfo {
	nakshatra: PoruthamNakshatraInfo;
	rasi: PoruthamRasiInfo;
	[key: string]: unknown;
}

export interface PoruthamMessage {
	type: string | null;
	description: string;
	[key: string]: unknown;
}

export interface ProkeralaPoruthamMatchItem {
	id: number;
	name: string;
	has_porutham: boolean;
	[key: string]: unknown;
}

export interface ProkeralaPoruthamResponse {
	status: string;
	data: {
		girl_info: PoruthamPersonInfo;
		boy_info: PoruthamPersonInfo;
		maximum_points: number;
		total_points: number;
		message: PoruthamMessage;
		matches: ProkeralaPoruthamMatchItem[];
		[key: string]: unknown;
	};
}

export interface ProkeralaPoruthamAdvancedMatchItem
	extends ProkeralaPoruthamMatchItem {
	porutham_status: string | null;
	points: number;
	description: string;
}

export interface ProkeralaPoruthamAdvancedResponse {
	status: string;
	data: {
		girl_info: PoruthamPersonInfo;
		boy_info: PoruthamPersonInfo;
		maximum_points: number;
		total_points: number;
		message: PoruthamMessage;
		matches: ProkeralaPoruthamAdvancedMatchItem[];
		[key: string]: unknown;
	};
}

/**
 * Papasamyam Check (marriage compatibility)
 * See: /astrology/papasamyam-check
 */
export interface ProkeralaPapasamyamCheckMessage {
	type: string | null;
	description: string;
	[key: string]: unknown;
}

export interface ProkeralaPapasamyamCheckResponse {
	status: string;
	data: {
		girl_papasamyam: ProkeralaPapasamyamResponse["data"];
		boy_papasamyam: ProkeralaPapasamyamResponse["data"];
		message: ProkeralaPapasamyamCheckMessage;
		[key: string]: unknown;
	};
}

/**
 * Batch Compatibility
 * See: /astrology/batch-compatibility
 */
export interface BatchCompatibilityResult {
	status: string;
	description: string;
	[key: string]: unknown;
}

export interface BatchCompatibilityItem {
	status: string;
	error: unknown | null;
	result: BatchCompatibilityResult | null;
	[key: string]: unknown;
}

export interface ProkeralaBatchCompatibilityResponse {
	status: string;
	data: {
		batch_compatibility: BatchCompatibilityItem[];
		[key: string]: unknown;
	};
}

/**
 * Upagraha Position
 * See: /astrology/upagraha-position
 */
export interface UpagrahaPositionRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface UpagrahaPositionItem {
	id: number;
	name: string;
	longitude: number;
	is_retrograde: boolean;
	position: number;
	degree: number;
	rasi: UpagrahaPositionRasi;
}

export interface ProkeralaUpagrahaPositionResponse {
	status: string;
	data: {
		upagraha_position: UpagrahaPositionItem[];
	};
}

/**
 * Sade Sati
 * See: /astrology/sade-sati
 */
export interface ProkeralaSadeSatiResponse {
	status: string;
	data: {
		is_in_sade_sati: boolean;
		transit_phase: string;
		description: string;
	};
}

/**
 * Detailed Sade Sati (advanced)
 * See: /astrology/sade-sati/advanced
 */
export interface SadeSatiTransitItem {
	saturn_sign: string;
	phase: string;
	start: string;
	end: string;
	is_retrograde: boolean | null;
	description: string;
}

export interface ProkeralaSadeSatiAdvancedResponse {
	status: string;
	data: {
		is_in_sade_sati: boolean;
		transit_phase: string;
		description: string;
		transits: SadeSatiTransitItem[];
	};
}

/**
 * Yoga (kundli yogas)
 * See: /astrology/yoga
 */
export interface ProkeralaYogaResponse {
	status: string;
	data: {
		yoga_details: KundliYogaDetail[];
	};
}

/**
 * Ashtakavarga
 * See: /astrology/ashtakavarga
 */
export interface AshtakavargaHouseInfo {
	id: number;
	name: string;
	number: number;
}

export interface AshtakavargaRasi {
	id: number;
	name: string;
	lord: PanchangLord;
}

export interface AshtakavargaPlanetScore {
	planet: PanchangLord;
	score: number;
}

export interface AshtakavargaHouse {
	house: AshtakavargaHouseInfo;
	rasi: AshtakavargaRasi;
	planets: AshtakavargaPlanetScore[];
	score: number;
}

export interface AshtakavargaPrastara {
	houses: AshtakavargaHouse[];
}

export interface ProkeralaAshtakavargaResponse {
	status: string;
	data: {
		ashtakavarga: {
			prastara: AshtakavargaPrastara;
		};
	};
}

/**
 * Sarvashtakavarga
 * See: /astrology/sarvashtakavarga
 */
export interface ProkeralaSarvashtakavargaResponse {
	status: string;
	data: {
		sarvashtakavarga: {
			prastara: AshtakavargaPrastara;
		};
	};
}

export interface ProkeralaOkResponse<TData> {
	status: "ok";
	data: TData;
}

export interface ProkeralaNameChartEntry {
	character: string;
	number: number;
}

export interface ProkeralaNameChart {
	first_name: ProkeralaNameChartEntry[];
	middle_name: ProkeralaNameChartEntry[];
	last_name: ProkeralaNameChartEntry[];
}

export interface ProkeralaNumerologySingleNumber {
	name: string;
	number: number;
	description: string;
}

export interface ProkeralaNumerologyListEntry {
	name: string;
	number: number;
	description: string;
}

export interface ProkeralaNumerologyEssenceEntry {
	character_number: number;
	number: number;
	description: string;
}

export interface ProkeralaNumerologyInclusionEntry {
	character_value: number;
	repeated_number_count: number;
	description: string;
}

export interface ProkeralaNumerologyKarmicDebtEntry {
	name: string;
	number: number | null;
	description: string;
}

export type ProkeralaLifePathNumberResponse = ProkeralaOkResponse<{
	life_path_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaChaldeanBirthNumberResponse = ProkeralaOkResponse<{
	birth_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaChaldeanDailyNameNumberResponse = ProkeralaOkResponse<{
	daily_name_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaChaldeanIdentityInitialCodeNumberResponse =
	ProkeralaOkResponse<{
		identity_initial_code_number: ProkeralaNumerologySingleNumber;
		name_chart: ProkeralaNameChart;
	}>;

export interface ProkeralaChaldeanWholeNameEnergy {
	name: string;
	number: number | null;
	description: string;
}

export type ProkeralaChaldeanWholeNameNumberResponse = ProkeralaOkResponse<{
	whole_name_number: {
		name: string;
		energies: ProkeralaChaldeanWholeNameEnergy[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaBalanceNumberResponse = ProkeralaOkResponse<{
	balance_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaAttainmentNumberResponse = ProkeralaOkResponse<{
	attainment_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaBirthdayNumberResponse = ProkeralaOkResponse<{
	birthday_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaBirthMonthNumberResponse = ProkeralaOkResponse<{
	birth_month_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaBridgeNumberResponse = ProkeralaOkResponse<{
	bridge_number: {
		name: string;
		differences: ProkeralaNumerologyListEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaChallengeNumberResponse = ProkeralaOkResponse<{
	challenge_number: {
		name: string;
		challenges: Array<{
			name: string;
			age: string;
			number: number;
			description: string;
		}>;
	};
}>;

export type ProkeralaCapstoneNumberResponse = ProkeralaOkResponse<{
	capstone_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaCornerstoneNumberResponse = ProkeralaOkResponse<{
	cornerstone_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaDestinyNumberResponse = ProkeralaOkResponse<{
	destiny_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaEssenceNumberResponse = ProkeralaOkResponse<{
	essence_number: {
		name: string;
		essence: ProkeralaNumerologyEssenceEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaExpressionNumberResponse = ProkeralaOkResponse<{
	expression_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaHiddenPassionNumberResponse = ProkeralaOkResponse<{
	hidden_passion_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaInclusionTableNumberResponse = ProkeralaOkResponse<{
	inclusion_table_number: {
		name: string;
		inclusion: ProkeralaNumerologyInclusionEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaInnerDreamNumberResponse = ProkeralaOkResponse<{
	inner_dream_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaKarmicDebtNumberResponse = ProkeralaOkResponse<{
	karmic_debt_number: {
		name: string;
		debts: ProkeralaNumerologyKarmicDebtEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaKarmicLessonNumberResponse = ProkeralaOkResponse<{
	karmic_lesson_number: {
		name: string;
		numbers: Array<{
			number: number;
			description: string;
		}>;
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaMaturityNumberResponse = ProkeralaOkResponse<{
	maturity_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaPeriodCycleNumberResponse = ProkeralaOkResponse<{
	period_cycle_number: {
		name: string;
		cycles: ProkeralaNumerologyListEntry[];
	};
}>;

export type ProkeralaPersonalDayNumberResponse = ProkeralaOkResponse<{
	personal_day_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaPersonalityNumberResponse = ProkeralaOkResponse<{
	personality_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaPersonalMonthNumberResponse = ProkeralaOkResponse<{
	personal_month_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaPersonalYearNumberResponse = ProkeralaOkResponse<{
	personal_year_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaPinnacleNumberResponse = ProkeralaOkResponse<{
	pinnacle_number: {
		name: string;
		pinnacles: Array<{
			name: string;
			age: string;
			number: number;
			description: string;
		}>;
	};
}>;

export type ProkeralaPlanesOfExpressionNumberResponse = ProkeralaOkResponse<{
	planes_of_expression: {
		name: string;
		expression: ProkeralaNumerologyListEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaRationalThoughtNumberResponse = ProkeralaOkResponse<{
	rational_thought_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaSoulUrgeNumberResponse = ProkeralaOkResponse<{
	soul_urge_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaSubconsciousSelfNumberResponse = ProkeralaOkResponse<{
	subconscious_self_number: ProkeralaNumerologySingleNumber;
	name_chart: ProkeralaNameChart;
}>;

export interface ProkeralaTransitCycleEntry {
	character: string;
	number: number;
	description: string;
}

export type ProkeralaTransitCycleNumberResponse = ProkeralaOkResponse<{
	transit_cycle_number: {
		name: string;
		physical: ProkeralaTransitCycleEntry[];
		mental: ProkeralaTransitCycleEntry[];
		spiritual: ProkeralaTransitCycleEntry[];
	};
	name_chart: ProkeralaNameChart;
}>;

export type ProkeralaUniversalDayNumberResponse = ProkeralaOkResponse<{
	universal_day_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaUniversalMonthNumberResponse = ProkeralaOkResponse<{
	universal_month_number: ProkeralaNumerologySingleNumber;
}>;

export type ProkeralaUniversalYearNumberResponse = ProkeralaOkResponse<{
	universal_year_number: ProkeralaNumerologySingleNumber;
}>;

export const PROKERALA_WESTERN_HOUSE_SYSTEMS = [
	"placidus",
	"koch",
	"porphyrius",
	"regiomontanus",
	"campanus",
	"equal",
	"whole_sign",
] as const;

export type ProkeralaWesternHouseSystem =
	(typeof PROKERALA_WESTERN_HOUSE_SYSTEMS)[number];

export const PROKERALA_WESTERN_CHART_TYPES = ["tropical", "sidereal"] as const;

export type ProkeralaWesternChartType =
	(typeof PROKERALA_WESTERN_CHART_TYPES)[number];

export const PROKERALA_WESTERN_ASPECT_FILTERS = [
	"all",
	"major",
	"minor",
] as const;

export type ProkeralaWesternAspectFilter =
	(typeof PROKERALA_WESTERN_ASPECT_FILTERS)[number];

export interface ProkeralaWesternCoordinates {
	latitude: number;
	longitude: number;
}

export interface ProkeralaWesternPoint {
	id: number;
	name: string;
	sign: string;
	position: number;
	house: number | null;
	retrograde: boolean;
	[key: string]: unknown;
}

export interface ProkeralaWesternAspect {
	name: string;
	angle: number;
	orb: number;
	primary_point: string;
	secondary_point: string;
	[key: string]: unknown;
}

export interface ProkeralaWesternHouse {
	number: number;
	sign: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

export interface ProkeralaWesternProfile {
	datetime: string;
	coordinates: ProkeralaWesternCoordinates;
	[key: string]: unknown;
}

export interface ProkeralaWesternBaseData {
	profile?: ProkeralaWesternProfile;
	primary_profile?: ProkeralaWesternProfile;
	secondary_profile?: ProkeralaWesternProfile;
	transit_datetime?: string;
	progression_year?: number;
	solar_return_year?: number;
	house_system?: ProkeralaWesternHouseSystem | string;
	chart_type?: ProkeralaWesternChartType | string;
	orb?: number;
	points?: ProkeralaWesternPoint[];
	houses?: ProkeralaWesternHouse[];
	aspects?: ProkeralaWesternAspect[];
	[key: string]: unknown;
}

export interface ProkeralaWesternResponse<TData extends ProkeralaWesternBaseData> {
	status: string;
	data: TData;
}

export interface ProkeralaWesternChartData extends ProkeralaWesternBaseData {
	chart: string;
}

export interface ProkeralaWesternAspectChartData extends ProkeralaWesternBaseData {
	aspect_chart: ProkeralaWesternAspect[];
}

export interface ProkeralaWesternPlanetPositionData
	extends ProkeralaWesternBaseData {
	planet_positions: ProkeralaWesternPoint[];
}

export type ProkeralaNatalChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaNatalAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaNatalPlanetPositionResponse =
	ProkeralaWesternResponse<ProkeralaWesternPlanetPositionData>;

export type ProkeralaTransitChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaTransitAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaTransitPlanetPositionResponse =
	ProkeralaWesternResponse<ProkeralaWesternPlanetPositionData>;

export type ProkeralaProgressionChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaProgressionAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaProgressionPlanetPositionResponse =
	ProkeralaWesternResponse<ProkeralaWesternPlanetPositionData>;

export type ProkeralaSolarReturnChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaSolarReturnAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaSolarReturnPlanetPositionResponse =
	ProkeralaWesternResponse<ProkeralaWesternPlanetPositionData>;

export type ProkeralaSynastryChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaSynastryPlanetAspectResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaSynastryAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;

export type ProkeralaCompositeChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternChartData>;
export type ProkeralaCompositeAspectChartResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;
export type ProkeralaCompositePlanetAspectResponse =
	ProkeralaWesternResponse<ProkeralaWesternAspectChartData>;

/**
 * PDF Report APIs
 * See:
 * - /report/personal-reading/instant
 * - /report/compatibility-reading/instant
 */

export type ProkeralaReportInput = Record<string, unknown>;

export interface ProkeralaReportModuleOption {
	[key: string]: unknown;
}

export interface ProkeralaReportModule {
	code: string;
	options?: ProkeralaReportModuleOption;
	[key: string]: unknown;
}

export interface ProkeralaReportOptions {
	report?: {
		la?: string;
		modules?: Array<string | ProkeralaReportModule>;
		[key: string]: unknown;
	};
	template?: {
		style?: string;
		footer?: string;
		[key: string]: unknown;
	};
	modules?: Array<string | ProkeralaReportModule>;
	[key: string]: unknown;
}

export interface ProkeralaReportRequestBody {
	input: ProkeralaReportInput;
	options: ProkeralaReportOptions;
}

export interface ProkeralaReportDocument {
	url?: string;
	file?: string;
	file_name?: string;
	content_type?: string;
	expires_at?: string;
	[key: string]: unknown;
}

export interface ProkeralaReportResponseData {
	report?: ProkeralaReportDocument;
	credits_used?: number;
	[key: string]: unknown;
}

export interface ProkeralaReportResponse {
	status: string;
	data: ProkeralaReportResponseData;
	[key: string]: unknown;
}
