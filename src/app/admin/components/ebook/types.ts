import type { ReligiousCategory } from "@/lib/religious-categories";

export interface Ebook {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	religiousCategories?: ReligiousCategory[];
	detail?: string;
	status: string;
	bookFile?: string;
	bookCover?: string;
	createdAt?: string;
	updatedAt?: string;
}

export type EbookErrors = {
	title?: string;
	date?: string;
	description?: string;
	type?: string;
	category?: string;
	detail?: string;
	status?: string;
	bookFile?: string;
	bookCover?: string;
};
