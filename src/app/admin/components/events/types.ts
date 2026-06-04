import type {
	LocaleTranslations,
	TranslationStatus,
} from "@/lib/content-lang";

export interface Event {
	id: string;
	title: string;
	description?: string;
	bookingUrl?: string;
	address?: string;
	fromDate: string;
	fromTime?: string;
	toDate: string;
	toTime?: string;
	place?: string;
	location?: string; // Google iframe URL
	category: string;
	type: string;
	price?: number;
	bannerImage?: string;
	relatedImages?: string[];
	status: string;
	translations?: LocaleTranslations;
	translationStatus?: TranslationStatus;
	createdAt?: string;
	updatedAt?: string;
}

export const eventCategories = ["Sanatan", "Buddhism", "Sikh", "Jain"];
export const eventTypes = ["Free", "Subscription"];
export const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

// Helper to extract src from iframe HTML or return direct URL
export const extractGoogleMapsSrc = (input?: string): string => {
	if (!input) return "";
	// If input is a full iframe HTML, extract src
	const match = input.match(/src=["']([^"']+)["']/);
	if (match && match[1]) return match[1];
	// Otherwise, assume it's a direct URL
	return input.trim();
};
