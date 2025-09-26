export type Faq = {
	id?: string;
	question: string;
	answer: string;
};

export type DharamshalaData = {
	id: string;
	name: string;
	date: string;
	state: string;
	city: string;
	status: string;
	description?: string;
	additionalInfo?: string;
	address?: string;
	location?: string;
	travelByAir?: string | string[];
	travelByTrain?: string | string[];
	travelByBus?: string | string[];
	travelByRoad?: string | string[];
	timings?: string;
	amenities?: string[];
	dharamshalaFaqs?: Faq[];
	createdAt?: string;
	updatedAt?: string;
	imageFile?: string | string[];
	videoFile?: string | string[];
	bannerImage?: string; // NEW
	coverImage?: string; // NEW
};

// Helper types for the DharamshalaInfoCard component
export type TravelFieldSetter = React.Dispatch<React.SetStateAction<string[]>>;

export type BlockNoteBlock = {
	content?: { text: string }[];
	[key: string]: unknown;
};
export type BlockNoteField = "description" | "additionalInfo";
