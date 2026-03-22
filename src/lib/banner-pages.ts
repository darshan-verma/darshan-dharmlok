/**
 * Page slugs for banner assignment. Used in admin banner management
 * and by frontend pages to fetch their banner from the API.
 */
export const BANNER_PAGE_SLUGS = [
	{ value: "blogs", label: "Blogs" },
	{ value: "community", label: "Community" },
	{ value: "e-shop", label: "E-Shop" },
	{ value: "e-book", label: "E-Book" },
	{ value: "bal-vidhya", label: "Bal Vidhya" },
	{ value: "book-pooja", label: "Book Pooja" },
	{ value: "book-yoga", label: "Book Yoga" },
	{ value: "temple", label: "Temple" },
	{ value: "dharmshala", label: "Dharmshala" },
	{ value: "events", label: "Events" },
	{ value: "kathavachak", label: "Kathavachak" },
	{ value: "panditji", label: "Panditji" },
	{ value: "dharmguru", label: "Dharmguru" },
	{ value: "motivational-speaker", label: "Motivational Speaker" },
	{ value: "services", label: "Services" },
	{ value: "audio-library", label: "Audio Library" },
	{ value: "horoscope", label: "Horoscope" },
] as const;

export type BannerPageSlug = (typeof BANNER_PAGE_SLUGS)[number]["value"];
