export type Faq = {
	id?: string;
	question: string;
	answer: string;
};

export type TempleData = {
	id: string;
	name: string;
	date: string;
	state: string;
	city: string;
	status: string;
	description?: string;
	history?: string;
	additionalInfo?: string;
	rituals?: string;
	address?: string;
	location?: string;
	travelByAir?: string | string[];
	travelByTrain?: string | string[];
	travelByBus?: string | string[];
	travelByRoad?: string | string[];
	timings?: string;
	amenities?: string[];
	templeFaq?: Faq[];
	createdAt?: string;
	updatedAt?: string;
	imageFile?: string | string[];
	videoFile?: string | string[];
};

export type BlockNoteBlock = {
	content?: { text: string }[];
	[key: string]: unknown;
};

// Helper types for the TempleInfoCard component
export type TravelFieldSetter = React.Dispatch<React.SetStateAction<string[]>>;

export type BlockNoteField =
	| "description"
	| "history"
	| "additionalInfo"
	| "rituals";
