import type { LucideIcon } from "lucide-react";
import {
	Baby,
	BookOpen,
	Calendar,
	CalendarClock,
	CircleDot,
	Clock,
	CloudSun,
	Compass,
	FileText,
	Flame,
	Flower2,
	Gauge,
	Globe2,
	Grid3x3,
	Heart,
	HeartHandshake,
	Home,
	Languages,
	LayoutGrid,
	Moon,
	MoonStar,
	Orbit,
	PieChart,
	Route,
	Shield,
	Sparkles,
	Sun,
	Timer,
	Users,
	Waves,
} from "lucide-react";

export type ProkeralaServiceDef = {
	slug: string;
	label: string;
	/** Short line for detail page placeholder */
	description: string;
	icon: LucideIcon;
	/** Relative to /api/prokerala/ — used for future wiring */
	apiPath: string | null;
	/** Hint for panchang-style APIs that use `la` */
	defaultLanguage?: string;
};

export type ProkeralaSectionDef = {
	id: string;
	title: string;
	items: ProkeralaServiceDef[];
};

export const PROKERALA_SERVICE_CATALOG: ProkeralaSectionDef[] = [
	{
		id: "numerology-daily",
		title: "Numerology & Daily Horoscope Calculators",
		items: [
			{
				slug: "numerology",
				label: "Numerology",
				description:
					"Numerology calculators: life path, expression, personal year, and more.",
				icon: CircleDot,
				apiPath: "numerology/life-path-number",
			},
			{
				slug: "daily-horoscope",
				label: "Daily Horoscope",
				description: "Daily horoscope based on your sign and date.",
				icon: Sparkles,
				apiPath: "horoscope/daily/advanced",
			},
			{
				slug: "daily-love-horoscope",
				label: "Daily Love Horoscope",
				description: "Love compatibility and romance outlook for the day.",
				icon: Heart,
				apiPath: "horoscope/daily/love-compatibility",
			},
		],
	},
	{
		id: "panchang",
		title: "Daily Panchang Calculators",
		items: [
			{
				slug: "panchang",
				label: "Panchang",
				description: "Panchang details for a given time and place.",
				icon: Home,
				apiPath: "panchang",
			},
			{
				slug: "auspicious-period",
				label: "Auspicious Period",
				description: "Shubh muhurat and auspicious windows.",
				icon: Sun,
				apiPath: "auspicious-period",
			},
			{
				slug: "inauspicious-period",
				label: "Inauspicious Period",
				description: "Periods to avoid for important tasks.",
				icon: Moon,
				apiPath: "inauspicious-period",
			},
			{
				slug: "choghadiya",
				label: "Choghadiya",
				description: "Choghadiya table for the day.",
				icon: Clock,
				apiPath: "choghadiya",
			},
			{
				slug: "hindu-panchang",
				label: "Hindu Panchang",
				description: "Hindu calendar panchang (default language preset).",
				icon: Calendar,
				apiPath: "panchang/advanced",
				defaultLanguage: "en",
			},
			{
				slug: "tamil-panchang",
				label: "Tamil Panchang",
				description: "Tamil panchang for the selected date.",
				icon: Languages,
				apiPath: "panchang/advanced",
				defaultLanguage: "ta",
			},
			{
				slug: "telugu-panchang",
				label: "Telugu Panchang",
				description: "Telugu panchang for the selected date.",
				icon: Languages,
				apiPath: "panchang/advanced",
				defaultLanguage: "te",
			},
			{
				slug: "malayalam-panchang",
				label: "Malayalam Panchang",
				description: "Malayalam panchang for the selected date.",
				icon: Languages,
				apiPath: "panchang/advanced",
				defaultLanguage: "ml",
			},
			{
				slug: "calendar",
				label: "Calendar",
				description: "Regional and lunar calendars.",
				icon: CalendarClock,
				apiPath: "calendar",
			},
			{
				slug: "anandadi-yoga",
				label: "Anandadi Yoga",
				description: "Anandadi yoga for the moment.",
				icon: Sun,
				apiPath: "anandadi-yoga",
			},
			{
				slug: "chandra-bala",
				label: "Chandra Bala",
				description: "Moon strength and Chandra Bala.",
				icon: MoonStar,
				apiPath: "chandra-bala",
			},
			{
				slug: "tara-bala",
				label: "Tara Bala",
				description: "Tara Bala for nakshatra timing.",
				icon: Moon,
				apiPath: "tara-bala",
			},
			{
				slug: "ritu",
				label: "Ritu",
				description: "Season (Ritu) information.",
				icon: Flower2,
				apiPath: "ritu",
			},
			{
				slug: "solstice",
				label: "Solstice",
				description: "Solstice and equinox related calculations.",
				icon: CloudSun,
				apiPath: "solstice",
			},
			{
				slug: "hora",
				label: "Hora",
				description: "Planetary hora timings.",
				icon: Timer,
				apiPath: "hora",
			},
			{
				slug: "disha-shool",
				label: "Disha Shool",
				description: "Directional strength and Disha Shool.",
				icon: Compass,
				apiPath: "disha-shool",
			},
			{
				slug: "auspicious-yoga",
				label: "Auspicious Yoga",
				description: "Auspicious yogas in the panchang.",
				icon: BookOpen,
				apiPath: "auspicious-yoga",
			},
		],
	},
	{
		id: "pdf-report",
		title: "PDF Report Calculators",
		items: [
			{
				slug: "pdf-report",
				label: "PDF Report",
				description: "Generate personal reading PDF reports.",
				icon: FileText,
				apiPath: "report/personal-reading/instant",
			},
		],
	},
	{
		id: "horoscope-calculators",
		title: "Horoscope Calculators",
		items: [
			{
				slug: "birth-details",
				label: "Birth Details",
				description: "Birth chart basics and planetary positions at birth.",
				icon: Baby,
				apiPath: "birth-details",
			},
			{
				slug: "kundli",
				label: "Kundli",
				description: "Vedic birth chart (Kundli).",
				icon: CircleDot,
				apiPath: "kundli",
			},
			{
				slug: "mangal-dosha",
				label: "Mangal Dosha",
				description: "Mangal Dosha analysis.",
				icon: Flame,
				apiPath: "mangal-dosha",
			},
			{
				slug: "kaal-sarp-dosha",
				label: "Kaalsarp Dosha",
				description: "Kaal Sarp Dosha check.",
				icon: Waves,
				apiPath: "kaal-sarp-dosha",
			},
			{
				slug: "sade-sati",
				label: "Sade-Sati",
				description: "Sade Sati period and phases.",
				icon: MoonStar,
				apiPath: "sade-sati",
			},
			{
				slug: "papa-dosham",
				label: "Papa Dosham",
				description: "Papasamyam and dosha summary.",
				icon: Grid3x3,
				apiPath: "papasamyam",
			},
			{
				slug: "planet-position",
				label: "Planet Position",
				description: "Planetary longitudes and positions.",
				icon: Orbit,
				apiPath: "planet-position",
			},
			{
				slug: "birth-chart",
				label: "Birth Chart",
				description: "Chart image and divisional options.",
				icon: PieChart,
				apiPath: "chart",
			},
			{
				slug: "dasha-periods",
				label: "Dasha Periods",
				description: "Vimshottari and related dasha periods.",
				icon: Route,
				apiPath: "dasha-periods",
			},
			{
				slug: "yoga-details",
				label: "Yoga Details",
				description: "Yogas active at birth time.",
				icon: CircleDot,
				apiPath: "yoga",
			},
			{
				slug: "sudarshana-chakra",
				label: "Sudarshana chakra",
				description: "Sudarshana chakra chart.",
				icon: Gauge,
				apiPath: "sudharshanachakra-chart",
			},
			{
				slug: "planet-relationship",
				label: "Planet Relationship",
				description: "Friendship and relationship between grahas.",
				icon: Users,
				apiPath: "planet-relationship",
			},
			{
				slug: "ashtakavarga-sarvashtakavarga",
				label: "Ashtakavarga and Sarvashta varga Chart",
				description: "Ashtakavarga and Sarvashtakavarga charts.",
				icon: LayoutGrid,
				apiPath: "ashtakavarga",
			},
			{
				slug: "chandrashtama-periods",
				label: "Chandrashtama Periods",
				description: "Chandrashtama timing windows.",
				icon: Clock,
				apiPath: "chandrashtama-periods",
			},
			{
				slug: "gowri-nalla-neram",
				label: "Gowri Nalla Neram",
				description: "Gowri Nalla Neram for the day.",
				icon: Sun,
				apiPath: "gowri-nalla-neram",
			},
		],
	},
	{
		id: "marriage",
		title: "Marriage Matching Calculators",
		items: [
			{
				slug: "kundli-matching",
				label: "Kundli Matching",
				description: "Match two horoscopes for marriage.",
				icon: HeartHandshake,
				apiPath: "kundli-matching",
			},
			{
				slug: "nakshatra-porutham",
				label: "Nakshatra Porutham",
				description: "Nakshatra compatibility.",
				icon: Sparkles,
				apiPath: "nakshatra-porutham",
			},
			{
				slug: "thirumana-porutham",
				label: "Thirumana Porutham",
				description: "Tamil marriage porutham.",
				icon: Users,
				apiPath: "thirumana-porutham",
			},
			{
				slug: "porutham",
				label: "Porutham",
				description: "General porutham analysis.",
				icon: LayoutGrid,
				apiPath: "porutham",
			},
			{
				slug: "papasamyam-check",
				label: "Papasamyam Check",
				description: "Papasamyam matching check.",
				icon: Shield,
				apiPath: "papasamyam-check",
			},
		],
	},
	{
		id: "western",
		title: "Western Astrology Calculators",
		items: [
			{
				slug: "natal-chart",
				label: "Natal Chart",
				description: "Western natal chart and planet positions.",
				icon: PieChart,
				apiPath: "western-astrology/natal-chart",
			},
			{
				slug: "transit-chart",
				label: "Transit Chart",
				description: "Transits over the natal chart.",
				icon: Globe2,
				apiPath: "western-astrology/transit-chart",
			},
			{
				slug: "progression-chart",
				label: "Progression Chart",
				description: "Secondary progressions chart.",
				icon: Calendar,
				apiPath: "western-astrology/progression-chart",
			},
			{
				slug: "solar-return-chart",
				label: "Solar Return Chart",
				description: "Solar return for the year.",
				icon: Sun,
				apiPath: "western-astrology/solar-return-chart",
			},
			{
				slug: "synastry-chart",
				label: "Synastry Chart",
				description: "Relationship chart between two people.",
				icon: Heart,
				apiPath: "western-astrology/synastry-chart",
			},
			{
				slug: "composite-chart",
				label: "Composite Chart",
				description: "Composite midpoint chart.",
				icon: CircleDot,
				apiPath: "western-astrology/composite-chart",
			},
		],
	},
];

const slugToService = new Map<
	string,
	{ section: ProkeralaSectionDef; service: ProkeralaServiceDef }
>();

for (const section of PROKERALA_SERVICE_CATALOG) {
	for (const service of section.items) {
		slugToService.set(service.slug, { section, service });
	}
}

/** Images from `public/services/` — rotated by slug for ProfileCard (matches /services page assets). */
const DEFAULT_SERVICE_CARD_IMAGES = [
	"/services/book-pooja.jpg",
	"/services/temple.jpg",
	"/services/events.jpg",
	"/services/yoga.jpg",
	"/services/dharmshala.jpg",
	"/services/audio-library.jpg",
	"/services/e-book.webp",
	"/services/bal-vidhya.jpg",
	"/services/blogs.jpg",
	"/services/e-shop.jpg",
	"/services/motivational-speaker.jpg",
] as const;

export function getServiceCardImageForSlug(slug: string): string {
	let h = 0;
	for (let i = 0; i < slug.length; i++) {
		h = (h * 31 + slug.charCodeAt(i)) >>> 0;
	}
	return DEFAULT_SERVICE_CARD_IMAGES[h % DEFAULT_SERVICE_CARD_IMAGES.length];
}

export function getAllServiceSlugs(): string[] {
	return [...slugToService.keys()];
}

export function getServiceBySlug(slug: string): {
	section: ProkeralaSectionDef;
	service: ProkeralaServiceDef;
} | null {
	return slugToService.get(slug) ?? null;
}
