export interface Activity {
	date: string;
	action: string;
}

export interface PanditjiPreferences {
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

import type {
	LocaleTranslations,
	TranslationStatus,
} from "@/lib/content-lang";

export interface Panditji {
	id: string;
	name: string;
	phone: string;
	email: string;
	translations?: LocaleTranslations;
	translationStatus?: TranslationStatus;
	description?: string;
	PanditjiType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bio?: string;
	coverImageUrl?: string;
	category?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	rank?: string;
	availability?: number;
	kycApproved?: number;
	status?: string;
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	createdAt: string | Date;
	preferences?: PanditjiPreferences;
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
	_isFromDialog?: boolean; // Flag to track if uploaded via dialog
}

export interface VideoObject {
	id?: string;
	url: string;
	title?: string;
	description?: string;
	source?: string;
	videoFile?: string;
	_isFromDialog?: boolean; // Flag to track if uploaded via dialog
}
