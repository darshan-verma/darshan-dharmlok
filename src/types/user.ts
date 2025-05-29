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
