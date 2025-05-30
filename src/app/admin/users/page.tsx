"use client";

import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import UserTable, { User } from "../components/users/UserTable";
import UserForm from "../components/users/UserForm";

// Mock data as fallback
const mockUsers = [
	{
		id: "1",
		name: "Rahul Sharma",
		phone: "+91 9876543210",
		email: "rahul.sharma@gmail.com",
		userType: "Admin",
		status: "Active",
		isLoggedIn: false,
		lastLoginAt: undefined,
		lastLogoutAt: undefined,
	},
	{
		id: "2",
		name: "Priya Patel",
		phone: "+91 8765432109",
		email: "priya.patel@gmail.com",
		userType: "User",
		status: "Active",
		isLoggedIn: true,
		lastLoginAt: new Date(),
		lastLogoutAt: undefined,
	},
];

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isDataLoading, setIsDataLoading] = useState(true);

	// Fetch users from the API
	useEffect(() => {
		const fetchUsers = async () => {
			setIsDataLoading(true);
			try {
				const response = await fetch("/api/auth/register");
				if (!response.ok) {
					throw new Error("Failed to fetch users");
				}
				const data = await response.json();

				// Transform API data to match User interface
				const transformedUsers = data.map((user: User) => ({
					id: user.id,
					name: user.name,
					phone: user.phone || "",
					email: user.email,
					userType: user.userType || "User",
					status: user.status || "Active", // Default status
					isLoggedIn: user.isLoggedIn || false,
					lastLoginAt: user.lastLoginAt
						? new Date(user.lastLoginAt)
						: undefined,
					lastLogoutAt: user.lastLogoutAt
						? new Date(user.lastLogoutAt)
						: undefined,
				}));

				setUsers(transformedUsers);
			} catch (error) {
				console.error("Error fetching users:", error);
				toast.error("Failed to load users. Using mock data instead.");
				setUsers(mockUsers); // Fallback to mock data
			} finally {
				setIsDataLoading(false);
			}
		};

		fetchUsers();
	}, []);

	const handleAddUser = async (userData: Omit<User, "id">) => {
		setIsLoading(true);
		const loadingToast = toast.loading("Adding new user...");

		try {
			// Make actual API call to register a new user
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: userData.name,
					email: userData.email,
					phone: userData.phone,
					userType: userData.userType,
					password: "tempPassword123", // Default password for admin-created users
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add user");
			}

			const newUser = await response.json();

			// Add the new user to the state
			setUsers([
				...users,
				{
					id: newUser.id,
					name: userData.name,
					phone: userData.phone,
					email: userData.email,
					userType: userData.userType,
					status: userData.status,
					isLoggedIn: false,
					lastLoginAt: undefined,
					lastLogoutAt: undefined,
				},
			]);

			setIsAddUserOpen(false);
			toast.success("User added successfully");
		} catch (error) {
			console.error("Error adding user:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to add user"
			);
		} finally {
			setIsLoading(false);
			toast.dismiss(loadingToast);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">User Management</h1>
				<Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-2">
							<PlusCircle className="h-4 w-4" />
							Add User
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New User</DialogTitle>
							<DialogDescription>
								Fill in the details below to add a new user.
							</DialogDescription>
						</DialogHeader>
						<UserForm
							onSubmit={handleAddUser}
							onCancel={() => setIsAddUserOpen(false)}
							isLoading={isLoading}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{isDataLoading ? (
				<div className="flex justify-center items-center py-10">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span className="ml-2">Loading users...</span>
				</div>
			) : (
				<UserTable
					users={users}
					setUsers={setUsers}
					onAddUser={() => setIsAddUserOpen(true)}
				/>
			)}
		</div>
	);
}
