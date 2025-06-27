export type Song = {
	id: string;
	name: string;
	date: string;
	description: string;
	audioFile: string;
	thumbnail: string;
	status: string;
};

export type SongFormData = Omit<Song, "id"> & {
	id?: string;
};

export type SongFormErrors = {
	name?: string;
	date?: string;
	audioFile?: string;
	thumbnail?: string;
	status?: string;
};

export const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export const getStatusColor = (status: string): string => {
	switch (status) {
		case "Active":
			return "bg-green-100 text-green-800";
		case "Inactive":
			return "bg-red-100 text-gray-600";
		default:
			return "bg-gray-100 text-gray-600";
	}
};
