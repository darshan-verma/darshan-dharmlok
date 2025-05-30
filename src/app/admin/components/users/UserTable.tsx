"use client";

import { useState } from "react";
import { Search, Eye, X, Check, LogIn, LogOut } from "lucide-react";
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

// Define the User interface
export interface User {
	id: string;
	name: string;
	phone: string;
	email: string;
	userType: string;
	status: string;
	isLoggedIn?: boolean;
	lastLoginAt?: Date;
	lastLogoutAt?: Date;
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
			case "pandit ji":
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

			const updatedUser = await response.json();

			// Update the users state with the updated user
			setUsers(
				users.map((user) =>
					user.id === userId
						? {
								...user,
								status: newStatus,
								isLoggedIn: updatedUser.isLoggedIn,
						  }
						: user
				)
			);

			toast.dismiss(loadingToast);
			toast.success(`User ${newStatus.toLowerCase()} successfully`);

			// Show additional message if user was logged out as a result of deactivation
			if (newStatus === "Inactive" && user.isLoggedIn) {
				toast.info("User has been logged out due to account deactivation");
			}
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

	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.phone.includes(searchQuery) ||
			user.userType.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center w-full max-w-sm space-x-2 mb-6">
				<Input
					type="text"
					placeholder="Search users..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="flex-1"
				/>
				<Button type="submit" variant="outline" size="icon">
					<Search className="h-4 w-4" />
				</Button>
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
							<TableHead>Login State</TableHead>
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
										{user.isLoggedIn ? (
											<span className="flex items-center text-green-600">
												<LogIn className="h-4 w-4 mr-1" />
												Online
											</span>
										) : (
											<span className="flex items-center text-gray-500">
												<LogOut className="h-4 w-4 mr-1" />
												Offline
											</span>
										)}
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
								<TableCell colSpan={8} className="text-center py-6">
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
