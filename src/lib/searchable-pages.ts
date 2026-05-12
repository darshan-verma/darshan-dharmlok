export interface SearchablePage {
	title: string;
	description: string;
	href: string;
	category: string;
	keywords?: string[];
}

export const searchablePages: SearchablePage[] = [
	// Main Pages
	{
		title: "Home",
		description: "Dharmlok homepage - Discover spiritual services and guidance",
		href: "/",
		category: "Main",
		keywords: ["home", "welcome", "main", "start"],
	},
	{
		title: "Services",
		description: "Browse all spiritual services and offerings",
		href: "/services",
		category: "Main",
		keywords: ["all services", "browse", "offerings"],
	},
	{
		title: "Know More",
		description: "Learn about Dharmlok and get in touch with our team",
		href: "/know-more",
		category: "Main",
		keywords: ["about", "contact", "reach out", "support", "help", "know more", "about us"],
	},

	// Legal / Policies
	{
		title: "Privacy Policy",
		description: "How Dharmlok collects, uses, and protects your data",
		href: "/privacy-policy",
		category: "Legal",
		keywords: ["privacy", "data", "personal information", "gdpr"],
	},
	{
		title: "Terms & Conditions",
		description: "Terms of use for the Dharmlok platform",
		href: "/terms-and-conditions",
		category: "Legal",
		keywords: ["terms", "conditions", "agreement", "terms of use"],
	},
	{
		title: "Delete Account",
		description: "How to permanently delete your Dharmlok account and data",
		href: "/delete-account",
		category: "Legal",
		keywords: ["delete account", "remove account", "data deletion", "account deletion"],
	},
	{
		title: "Community Guidelines",
		description: "Rules for posting and interacting in the Dharmlok community",
		href: "/community-guidelines",
		category: "Legal",
		keywords: ["community", "guidelines", "rules", "posting", "conduct"],
	},
	{
		title: "Cookie Policy",
		description: "How Dharmlok uses cookies and similar technologies",
		href: "/cookie-policy",
		category: "Legal",
		keywords: ["cookies", "cookie policy", "tracking", "analytics"],
	},
	{
		title: "Content Disclaimer",
		description: "Disclaimer for religious and spiritual content on Dharmlok",
		href: "/content-disclaimer",
		category: "Legal",
		keywords: ["disclaimer", "content", "religious", "spiritual", "liability"],
	},

	// Community
	{
		title: "Community",
		description: "Explore posts from the Dharmlok community",
		href: "/community",
		category: "Community",
		keywords: ["community", "posts", "feed", "social"],
	},
	{
		title: "Create Post",
		description: "Create a new community post",
		href: "/community/create",
		category: "Community",
		keywords: ["create", "post", "upload", "share"],
	},
	{
		title: "My Posts",
		description: "View posts you have created",
		href: "/community/my-posts",
		category: "Community",
		keywords: ["my posts", "own posts", "profile posts"],
	},
	{
		title: "Community Chat",
		description: "Chat with people and groups in the community",
		href: "/community/chat",
		category: "Community",
		keywords: ["chat", "messages", "inbox", "groups", "direct message"],
	},

	// Spiritual Guides
	{
		title: "Kathavachak",
		description:
			"Find and book experienced Kathavachaks for spiritual discourses",
		href: "/kathavachak",
		category: "Spiritual Guides",
		keywords: ["kathavachak", "discourse", "storytelling", "religious speaker"],
	},
	{
		title: "Dharmguru",
		description: "Connect with enlightened spiritual masters and teachers",
		href: "/dharmguru",
		category: "Spiritual Guides",
		keywords: ["dharmguru", "spiritual master", "guru", "teacher", "guide"],
	},
	{
		title: "Panditji",
		description: "Book qualified pandits for religious ceremonies and rituals",
		href: "/panditji",
		category: "Spiritual Guides",
		keywords: ["pandit", "priest", "ceremony", "ritual", "puja"],
	},
	{
		title: "Motivational Speaker",
		description: "Inspire your audience with renowned motivational speakers",
		href: "/motivational-speaker",
		category: "Spiritual Guides",
		keywords: [
			"motivational",
			"speaker",
			"inspiration",
			"motivation",
			"seminar",
		],
	},

	// Services
	{
		title: "Book Pooja",
		description: "Book religious ceremonies and poojas for various occasions",
		href: "/book-pooja",
		category: "Services",
		keywords: ["pooja", "booking", "ceremony", "ritual", "worship", "aarti"],
	},
	{
		title: "Book Yoga Session",
		description: "Schedule yoga sessions with certified instructors",
		href: "/book-yoga",
		category: "Services",
		keywords: [
			"yoga",
			"meditation",
			"fitness",
			"wellness",
			"asana",
			"pranayama",
		],
	},
	{
		title: "E-Books",
		description: "Browse and read spiritual and religious e-books",
		href: "/e-book",
		category: "Services",
		keywords: ["ebook", "book", "reading", "literature", "spiritual books"],
	},
	{
		title: "Events",
		description: "Discover upcoming spiritual events and gatherings",
		href: "/events",
		category: "Services",
		keywords: ["events", "gathering", "festival", "celebration", "ceremony"],
	},
	{
		title: "Dharmshala",
		description: "Find accommodation in dharmshalas near pilgrimage sites",
		href: "/dharmshala",
		category: "Services",
		keywords: ["dharmshala", "accommodation", "lodging", "stay", "pilgrim"],
	},
	{
		title: "Temples",
		description: "Explore famous temples and religious sites",
		href: "/temple",
		category: "Services",
		keywords: ["temple", "shrine", "mandir", "religious site", "pilgrimage"],
	},
	{
		title: "Bal Vidhya",
		description: "Educational content and activities for children",
		href: "/bal-vidhya",
		category: "Services",
		keywords: ["children", "kids", "education", "learning", "bal vidhya"],
	},

	// Dharmlok Travels
	{
		title: "Dharmlok Travels",
		description: "Plan your spiritual journeys with flights and hotels",
		href: "/travel-portal",
		category: "Travel",
		keywords: ["travel", "journey", "trip", "pilgrimage", "tour"],
	},
	{
		title: "Flight Search",
		description: "Search and book flights for your spiritual journey",
		href: "/travel-portal/flight-search",
		category: "Travel",
		keywords: ["flight", "airplane", "air travel", "booking", "tickets"],
	},
	{
		title: "Hotel Search",
		description: "Find and book hotels near temples and pilgrimage sites",
		href: "/travel-portal/hotel-search",
		category: "Travel",
		keywords: ["hotel", "accommodation", "stay", "lodging", "rooms"],
	},
	{
		title: "Travel Destinations",
		description: "Discover popular spiritual travel destinations",
		href: "/travel-portal/destinations",
		category: "Travel",
		keywords: ["destination", "places", "location", "pilgrimage sites"],
	},
	{
		title: "My Trips",
		description: "View and manage your travel bookings",
		href: "/travel-portal/my-trips",
		category: "Travel",
		keywords: ["bookings", "trips", "my bookings", "reservations", "itinerary"],
	},

	// E-Commerce
	{
		title: "E-Shop",
		description: "Shop for spiritual items and religious products",
		href: "/e-shop",
		category: "Shopping",
		keywords: [
			"shop",
			"store",
			"buy",
			"products",
			"religious items",
			"puja items",
		],
	},

	// Media
	{
		title: "Audio Library",
		description: "Listen to spiritual music, bhajans, and discourses",
		href: "/audio-library",
		category: "Media",
		keywords: [
			"audio",
			"music",
			"bhajan",
			"kirtan",
			"mantra",
			"chanting",
			"songs",
		],
	},
	{
		title: "Blogs",
		description: "Read spiritual articles and insights",
		href: "/blogs",
		category: "Media",
		keywords: ["blog", "article", "reading", "insights", "spiritual content"],
	},

	// User Account
	{
		title: "Dashboard",
		description: "Access your personal dashboard",
		href: "/dashboard",
		category: "Account",
		keywords: ["dashboard", "profile", "account", "my account"],
	},
];

// Categories for filtering
export const categories = [
	"All",
	"Main",
	"Legal",
	"Community",
	"Spiritual Guides",
	"Services",
	"Travel",
	"Shopping",
	"Media",
	"Account",
];
