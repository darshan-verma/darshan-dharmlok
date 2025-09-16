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

// User type-specific interfaces for API routes
export type UserType =
	| "dharmguru"
	| "kathavachak"
	| "panditji"
	| "seller"
	| "hotel_dharamshala_vendor";

export interface BaseUserData {
	name: string;
	email: string;
	phone: string;
	password: string;
	userType: UserType;
	bio?: string;
	description?: string;
	status?: string;
	active?: number;
	availability?: number;
	kycApproved?: number;
	rank?: string;
	social?: number;
}

export interface DharmguruData extends BaseUserData {
	userType: "dharmguru";
}

export interface KathavachakData extends BaseUserData {
	userType: "kathavachak";
}

export interface PanditjiData extends BaseUserData {
	userType: "panditji";
}

export interface SellerData extends BaseUserData {
	userType: "seller";
}

export interface HotelDharamshalaVendorData extends BaseUserData {
	userType: "hotel_dharamshala_vendor";
	typeVendor?: string;
	category?: string;
}

export interface ServiceOffering {
	id: string;
	serviceType: string;
	targetType?: string;
	targetId?: string;
	price: number;
	details?: string;
	metadata?: ServiceMetadata;
	status: string;
	createdAt?: Date;
}

export interface Product {
	id: string;
	name: string;
	category: string[];
	pricePerUnit: number;
	availableQty: number;
	description?: string;
	images?: string[];
	videos?: string[];
	status: string;
	date?: Date;
	createdAt?: Date;
}

// Metadata interface for service offerings
export interface ServiceMetadata {
	roomType?: string;
	capacity?: number;
	amenities?: string[];
	checkInTime?: string;
	checkOutTime?: string;
	cancellationPolicy?: string;
	[key: string]: unknown; // For additional dynamic properties
}

// Where condition for complex queries
export interface WhereCondition {
	[key: string]: unknown;
}

export interface UserWhereConditions {
	userType: UserType;
	AND?: WhereCondition[];
	OR?: Array<{
		name?: { contains: string; mode: "insensitive" };
		email?: { contains: string; mode: "insensitive" };
		phone?: { contains: string; mode: "insensitive" };
	}>;
	status?: string;
	kycApproved?: number;
	active?: number;
	availability?: number;
	addresses?: {
		some: {
			state?: { contains: string; mode: "insensitive" };
			city?: { contains: string; mode: "insensitive" };
		};
	};
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCount: number;
	hasNext: boolean;
	hasPrev: boolean;
	limit: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	pagination?: PaginationInfo;
}

export interface UserUpdateData {
	[key: string]: unknown; // Index signature for dynamic property access (safer than 'any')
	name?: string;
	bio?: string;
	description?: string;
	category?: string;
	status?: string;
	active?: number;
	availability?: number;
	kycApproved?: number;
	rank?: string;
	social?: number;
	email?: string;
	phone?: string;
	password?: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
}

export interface RoomTypeCount {
	[roomType: string]: number;
}

export interface AddressCreateData {
	userId: string;
	type: string;
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state: string;
	country: string;
	pincode?: string;
}

export interface ProductAnalytics {
	totalProducts: number;
	activeProducts: number;
	inactiveProducts: number;
	totalInventoryValue: number;
	totalInventoryItems: number;
	categories: string[];
	averagePrice: number;
	recentProducts: Product[];
	lowStockProducts: Product[];
}

export interface ServiceOfferingCreateData {
	providerId: string;
	serviceType: string;
	targetType?: string;
	targetId?: string;
	price: number;
	details?: string;
	metadata?: ServiceMetadata;
	status?: string;
}

export interface Dharamshala {
	id: string;
	name: string;
	city: string;
	state: string;
	description?: string | null;
	imageFile?: string | null;
	status?: string;
	address?: string | null;
	location?: string | null;
	amenities?: string | null;
}

export interface PoojaCategory {
	id: string;
	name: string;
	description?: string | null;
	price?: number | null;
	details?: string | null;
}
