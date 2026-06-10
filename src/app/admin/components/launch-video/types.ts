import type { ReligiousCategory } from "@/lib/religious-categories";

export type VideoData = {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	videoUrl: string;
	thumbnailUrl?: string | null;
	religiousCategories?: ReligiousCategory[];
	createdAt?: string;
	updatedAt?: string;
};

export type VideoFormErrors = {
	title?: string;
	date?: string;
	description?: string;
	category?: string;
	type?: string;
	status?: string;
	videoUrl?: string;
	thumbnailUrl?: string;
};
