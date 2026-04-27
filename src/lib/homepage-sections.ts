/**
 * Homepage section keys and default content. Used by API to seed/merge and by admin/frontend.
 */
export const HOMEPAGE_SECTION_KEYS = [
	"about",
	"kathavachak",
	"our-services",
	"dharmguru",
	"panditji",
	"explore-dharmlok",
	"horoscope",
	"eshop",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export const HOMEPAGE_SECTION_DEFAULTS: Record<
	HomepageSectionKey,
	{ title: string; description: string; sortOrder: number; extraData?: unknown }
> = {
	about: {
		title: "About Dharmlok",
		description:
			"Dharmlok is your comprehensive spiritual platform connecting devotees with authentic spiritual services, sacred destinations, and experienced guides for a meaningful spiritual journey.",
		sortOrder: 0,
	},
	kathavachak: {
		title: "Kathavachak",
		description:
			"Connect with our experienced and knowledgeable Kathavachaks who share spiritual wisdom and guide you on your spiritual journey.",
		sortOrder: 1,
	},
	"our-services": {
		title: "Our Services",
		description:
			"Comprehensive spiritual services to support your journey - from pooja bookings to pilgrimage planning, all in one trusted platform.",
		sortOrder: 2,
	},
	dharmguru: {
		title: "Dharmguru",
		description:
			"Connect with our experienced and knowledgeable Dharmgurus who share spiritual wisdom and guide you on your spiritual journey.",
		sortOrder: 3,
	},
	panditji: {
		title: "Panditji",
		description:
			"Meet our verified and experienced Panditji dedicated to supporting your spiritual journey with authentic rituals and guidance.",
		sortOrder: 4,
	},
	"explore-dharmlok": {
		title: "Explore Dharmlok",
		description:
			"Discover the diverse spiritual services and resources available on Dharmlok. From temples to educational programs, explore everything that makes your spiritual journey meaningful.",
		sortOrder: 5,
		extraData: {
			cards: [
				{
					title: "Temple",
					description:
						"Discover sacred temples and plan your spiritual journey to holy places across India.",
					image:
						"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop",
					className: "col-span-2 row-span-2 flex flex-col justify-between",
				},
				{
					title: "Dharmshala",
					description:
						"Find comfortable and affordable accommodations near temples for your pilgrimage.",
					image:
						"https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&h=600&fit=crop",
					className: "",
				},
				{
					title: "Bal-vidhya",
					description:
						"Educational programs and spiritual learning for children to connect with our rich heritage.",
					image:
						"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
					className: "",
				},
				{
					title: "Audio Library",
					description:
						"Access a vast collection of spiritual chants, mantras, and devotional music.",
					image:
						"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
					className: "row-span-2",
				},
				{
					title: "Events",
					description:
						"Stay updated with upcoming religious festivals, ceremonies, and spiritual gatherings.",
					image:
						"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
					className: "col-span-2",
				},
				{
					title: "Motivational Speakers",
					description:
						"Connect with inspiring spiritual leaders and motivational speakers for guidance.",
					image:
						"https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
					className: "",
				},
			],
		},
	},
	horoscope: {
		title: "Horoscope Services",
		description:
			"Explore daily horoscope updates, Panchang, and essential astrology services to guide your spiritual and personal journey.",
		sortOrder: 6,
	},
	eshop: {
		title: "E-Shop Products",
		description:
			"Discover authentic spiritual products, pooja items, and sacred artifacts from our curated e-shop to enhance your spiritual practice.",
		sortOrder: 7,
	},
};
