"use client";

import { useState } from "react";
import { Search, Eye, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Define the User interface
export interface User {
	id: string;
	name: string;
	phone: string;
	email: string;
	userType: string;
	status: string;
}

interface UserTableProps {
	users: User[];
	setUsers: React.Dispatch<React.SetStateAction<User[]>>;
	onAddUser?: () => void;
}

export default function UserTable({ users, setUsers }: UserTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>(
		{}
	);
	const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Define user types for the filter
	const userTypes = [
		{ value: "all", label: "All Types" },
		{ value: "admin", label: "Admin" },
		{ value: "user", label: "User" },
		{ value: "moderator", label: "Moderator" },
		{ value: "kathavachak", label: "Kathavachak" },
		{ value: "dharmguru", label: "Dharmguru" },
		{ value: "vendor", label: "Vendor" },
		{ value: "hotel/dharamshala", label: "Hotel/Dharamshala" },
		{ value: "panditji", label: "Pandit Ji" },
		{ value: "seller", label: "Seller" },
	];

	// Helper function to get color class based on user type
	const getUserTypeColor = (userType: string) => {
		switch (userType?.toLowerCase()) {
			case "admin":
				return "bg-purple-100 text-purple-800";
			case "vendor":
				return "bg-orange-100 text-orange-800";
			case "moderator":
				return "bg-blue-100 text-blue-800";
			case "kathavachak":
				return "bg-green-100 text-green-800";
			case "dharmguru":
				return "bg-yellow-100 text-yellow-800";
			case "hotel/dharamshala":
				return "bg-pink-100 text-pink-800";
			case "panditji":
				return "bg-indigo-100 text-indigo-800";
			case "seller":
				return "bg-red-100 text-red-800";
			case "user":
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const handleStatusChange = async (userId: string, newStatus: string) => {
		const user = users.find((u) => u.id === userId);
		if (!user) return;

		setUpdatingUsers((prev) => ({ ...prev, [userId]: true }));
		const loadingToast = toast.loading("Updating user status...");

		try {
			// Make API call to update user status
			const response = await fetch("/api/users/status", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId,
					status: newStatus,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update user status");
			}

			// Update the users state with the updated user
			setUsers(
				users.map((user) =>
					user.id === userId
						? {
								...user,
								status: newStatus,
						  }
						: user
				)
			);

			toast.dismiss(loadingToast);
			toast.success(`User ${newStatus.toLowerCase()} successfully`);
		} catch (error) {
			console.error("Error updating user status:", error);
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update user status"
			);
		} finally {
			setUpdatingUsers((prev) => ({ ...prev, [userId]: false }));
		}
	};

	// Filter users based on search and filter criteria
	const filteredUsers = users.filter((user) => {
		// Apply search filter
		const matchesSearch =
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.phone.includes(searchQuery) ||
			user.userType.toLowerCase().includes(searchQuery.toLowerCase());

		// Apply user type filter
		const matchesUserType =
			userTypeFilter === "all" ||
			user.userType.toLowerCase() === userTypeFilter.toLowerCase();

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" ||
			user.status.toLowerCase() === statusFilter.toLowerCase();

		return matchesSearch && matchesUserType && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
					{/* Search Bar */}
					<div className="w-full sm:w-64">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search users..."
								className="w-full bg-background pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
						{/* User Type Filter */}
						<div className="w-full sm:w-40">
							<Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="User Type" />
								</SelectTrigger>
								<SelectContent>
									{userTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Status Filter */}
						<div className="w-full sm:w-32">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
					found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Phone No.</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>User Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredUsers.length > 0 ? (
							filteredUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.phone}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(
												user.userType
											)}`}
										>
											{user.userType || "User"}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												user.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{user.status}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/users/${user.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
										</Button>
									</TableCell>
									<TableCell>
										{user.status === "Active" ? (
											<Button
												variant="outline"
												size="sm"
												className="text-red-500 border-red-200 hover:bg-red-50"
												onClick={() => handleStatusChange(user.id, "Inactive")}
												disabled={updatingUsers[user.id]}
											>
												{updatingUsers[user.id] ? (
													<span className="flex items-center">
														<span className="animate-spin h-4 w-4 mr-1 border-2 border-red-500 border-t-transparent rounded-full"></span>
														Processing...
													</span>
												) : (
													<>
														<X className="h-4 w-4 mr-1" />
														Deactivate
													</>
												)}
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="text-green-500 border-green-200 hover:bg-green-50"
												onClick={() => handleStatusChange(user.id, "Active")}
												disabled={updatingUsers[user.id]}
											>
												{updatingUsers[user.id] ? (
													<span className="flex items-center">
														<span className="animate-spin h-4 w-4 mr-1 border-2 border-green-500 border-t-transparent rounded-full"></span>
														Processing...
													</span>
												) : (
													<>
														<Check className="h-4 w-4 mr-1" />
														Activate
													</>
												)}
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-6">
									No users found. Try a different search or add a new user.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
