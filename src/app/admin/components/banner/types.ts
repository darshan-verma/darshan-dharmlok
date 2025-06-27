export type Banner = {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	imageUrl?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type BannerFormErrors = {
	title?: string;
	date?: string;
	description?: string;
	category?: string;
	type?: string;
	status?: string;
	imageUrl?: string;
};
