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

// Define the User interface
export interface User {
	id: string;
	name: string;
	phone: string;
	email: string;
	status: string;
}

interface UserTableProps {
	users: User[];
	setUsers: React.Dispatch<React.SetStateAction<User[]>>;
	onAddUser?: () => void;
}

export default function UserTable({
	users,
	setUsers,
}: UserTableProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const handleStatusChange = async (userId: string, newStatus: string) => {
		const user = users.find((u) => u.id === userId);
		if (!user) return;

		const loadingToast = toast.loading("Updating user status...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, status: newStatus } : user
				)
			);

			toast.dismiss(loadingToast);
			toast.success(`User ${newStatus.toLowerCase()} successfully`);
		} catch (error) {
			console.error("Error updating user status:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to update user status");
		}
	};

	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.phone.includes(searchQuery)
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
											>
												<X className="h-4 w-4 mr-1" />
												Deactivate
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="text-green-500 border-green-200 hover:bg-green-50"
												onClick={() => handleStatusChange(user.id, "Active")}
											>
												<Check className="h-4 w-4 mr-1" />
												Activate
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-6">
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
