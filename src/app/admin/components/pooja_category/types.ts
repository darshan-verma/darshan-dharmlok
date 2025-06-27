export interface PoojaCategory {
	id: string;
	name: string;
	description?: string;
	date?: string;
	price?: number;
	details?: string;
	status?: string;
}

export interface Offering {
	id: string;
	price: number;
	details?: string;
	status?: string;
	provider: {
		id: string;
		name: string;
		email?: string;
	};
	metadata?: Record<string, unknown>;
}

export interface PanditjiUser {
	id: string;
	name: string;
	email?: string;
}

export interface OfferingFormData {
	providerId: string;
	price: string;
	details: string;
}
