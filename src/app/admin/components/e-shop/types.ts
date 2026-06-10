import type { ReligiousCategory } from "@/lib/religious-categories";

export interface Product {
	id: string;
	name: string;
	description?: string;
	category: string[];
	religiousCategories?: ReligiousCategory[];
	date: string;
	pricePerUnit: number;
	availableQty: number;
	status: string;
	images: string[];
	videos: string[];
	createdAt?: string;
	updatedAt?: string;
}

export const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export const formatDate = (dateString: string | Date): string => {
	if (!dateString) return "N/A";
	const date =
		typeof dateString === "string" ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};
