"use client";

import { useState } from "react";
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

// Mock data for initial display
const mockUsers = [
	{
		id: "1",
		name: "Rahul Sharma",
		phone: "+91 9876543210",
		email: "rahul.sharma@gmail.com",
		status: "Active",
	},
	{
		id: "2",
		name: "Priya Patel",
		phone: "+91 8765432109",
		email: "priya.patel@gmail.com",
		status: "Active",
	},
	{
		id: "3",
		name: "Amit Kumar",
		phone: "+91 7654321098",
		email: "amit.kumar@gmail.com",
		status: "Inactive",
	},
	{
		id: "4",
		name: "Deepika Singh",
		phone: "+91 6543210987",
		email: "deepika.singh@gmail.com",
		status: "Active",
	},
	{
		id: "5",
		name: "Vikram Mehta",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
	},
];

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>(mockUsers);
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleAddUser = async (userData: Omit<User, "id">) => {
		setIsLoading(true);
		const loadingToast = toast.loading("Adding new user...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const id = (users.length + 1).toString();
			const updatedUsers = [...users, { ...userData, id }];
			setUsers(updatedUsers);

			setIsAddUserOpen(false);
			toast.success("User added successfully");
		} catch (error) {
			console.error("Error adding user:", error);
			toast.error("Failed to add user");
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

			<UserTable
				users={users}
				setUsers={setUsers}
				onAddUser={() => setIsAddUserOpen(true)}
			/>
		</div>
	);
}
