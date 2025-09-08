export interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: "Active" | "Inactive" | "Suspended";
	bio?: string;
	address?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface UserFilters {
	search?: string;
	status?: string;
	isApproved?: boolean;
}

export interface UserTableProps {
	users: User[];
	onEdit: (user: User) => void;
	onDelete: (userId: string) => void;
	onView: (userId: string) => void;
	onApprove: (userId: string, approve: boolean) => void;
	isLoading?: boolean;
}

export interface UserFormData {
	name: string;
	email: string;
	phone: string;
	// Add other fields as needed
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

export interface UserPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

export interface Activity {
	date: string;
	action: string;
}

export interface FullUser extends User {
	userType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	coverImageUrl?: string;
	category?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	rank?: number;
	availability?: number;
	kycApproved?: number;
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	preferences?: UserPreferences;
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
