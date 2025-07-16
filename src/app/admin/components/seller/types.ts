export interface Activity {
	date: string;
	action: string;
}

export interface SellerPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

export interface Address {
	id?: string;
	type: "home" | "work" | "other";
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	country: string;
	pincode?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

export interface Seller {
	id: string;
	name: string;
	phone: string;
	email: string;
	SellerType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bio?: string;
	coverImageUrl?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	availability?: number;
	kycApproved?: number;
	status?: string;
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	createdAt: string | Date;
	// Client-side only properties
	preferences?: SellerPreferences;
	activities?: Activity[];
}

export interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	addresses?: {
		[key: string]: {
			line1?: string;
			city?: string;
			country?: string;
			label?: string;
		};
	};
}

export interface ImageObject {
	id?: string;
	url: string;
	title?: string;
	description?: string;
	userId?: string;
	source?: "gallery" | "post";
}

export interface VideoObject {
	id?: string;
	url: string;
	videoUrl?: string;
	videoFile?: string;
	title?: string;
	description?: string;
	userId?: string;
	source?: string;
}
