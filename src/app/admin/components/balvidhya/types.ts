import type { ReligiousCategory } from "@/lib/religious-categories";

export type BalvidhyaData = {
	_id: string;
	name: string;
	description: string;
	type: string;
	category: string;
	religiousCategories?: ReligiousCategory[];
	status: string;
	trending: boolean;
	thumbnailUrl?: string;
	videoUrl?: string;
	bookFile?: string;
	videoFile?: string;
	dateAdded?: string;
	updatedAt?: string;
};

export type Errors = {
	name?: string;
	description?: string;
	type?: string;
	category?: string;
	thumbnailUrl?: string;
};

export const typeOptions = [
	{ value: "video", label: "Video" },
	{ value: "book", label: "Book" },
];

export const categoryOptions = [
	{ value: "BhagavadGita", label: "Bhagavad Gita" },
	{ value: "Ramayana", label: "Ramayana" },
	{ value: "Mahabharata", label: "Mahabharata" },
	{ value: "Vedas", label: "Vedas" },
	{ value: "Puranas", label: "Puranas" },
	{ value: "Upanishads", label: "Upanishads" },
	{ value: "BhaktiYoga", label: "Bhakti Yoga" },
	{ value: "Other", label: "Other" },
];

export const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export const typeLabel = (type: string) =>
	type === "video" ? "Video" : type === "book" ? "Book" : type;

export const categoryLabel = (cat: string) => {
	switch (cat) {
		case "BhagavadGita":
			return "Bhagavad Gita";
		case "Ramayana":
			return "Ramayana";
		case "Mahabharata":
			return "Mahabharata";
		case "Vedas":
			return "Vedas";
		case "Puranas":
			return "Puranas";
		case "Upanishads":
			return "Upanishads";
		case "BhaktiYoga":
			return "Bhakti Yoga";
		default:
			return "Other";
	}
};

export const statusLabel = (status: string) => status;

export const getStatusColor = (status: string) => {
	if (status === "Active") return "bg-green-100 text-green-800";
	return "bg-red-100 text-red-800";
};

export const formatDate = (dateString: string | Date) => {
	if (!dateString) return "N/A";
	const date =
		typeof dateString === "string" ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(date);
};
