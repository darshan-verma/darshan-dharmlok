"use client";

import { useState } from "react";
import { PlusCircle, Search, Eye, X, Check } from "lucide-react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

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
	const [users, setUsers] = useState(mockUsers);
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [newUser, setNewUser] = useState({
		name: "",
		phone: "",
		email: "",
		status: "Active",
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (userData: typeof newUser) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!userData.name.trim()) {
			errors.name = "Name is required";
		} else if (userData.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Email validation
		if (!userData.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation (assuming Indian phone numbers)
		if (
			userData.phone &&
			!/^[6-9]\d{9}$/.test(userData.phone.replace(/[^0-9]/g, ""))
		) {
			errors.phone = "Please enter a valid 10-digit phone number";
		}

		return errors;
	};

	const handleAddUser = async () => {
		const errors = validateForm(newUser);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading("Adding new user...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const id = (users.length + 1).toString();
			const updatedUsers = [...users, { ...newUser, id }];
			setUsers(updatedUsers);

			// Reset form
			setNewUser({
				name: "",
				phone: "",
				email: "",
				status: "Active",
			});
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
						<div className="grid gap-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name *</Label>
								<Input
									id="name"
									value={newUser.name}
									onChange={(e) => {
										setNewUser({ ...newUser, name: e.target.value });
										if (formErrors.name) {
											setFormErrors({ ...formErrors, name: "" });
										}
									}}
									placeholder="Enter full name"
									className={formErrors.name ? "border-red-500" : ""}
								/>
								{formErrors.name && (
									<p className="text-sm text-red-500">{formErrors.name}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={newUser.email}
									onChange={(e) => {
										setNewUser({ ...newUser, email: e.target.value });
										if (formErrors.email) {
											setFormErrors({ ...formErrors, email: "" });
										}
									}}
									placeholder="Enter email address"
									className={formErrors.email ? "border-red-500" : ""}
								/>
								{formErrors.email && (
									<p className="text-sm text-red-500">{formErrors.email}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									type="tel"
									value={newUser.phone}
									onChange={(e) => {
										setNewUser({ ...newUser, phone: e.target.value });
										if (formErrors.phone) {
											setFormErrors({ ...formErrors, phone: "" });
										}
									}}
									placeholder="Enter phone number"
									className={formErrors.phone ? "border-red-500" : ""}
								/>
								{formErrors.phone && (
									<p className="text-sm text-red-500">{formErrors.phone}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status *</Label>
								<Select
									value={newUser.status}
									onValueChange={(value) =>
										setNewUser({ ...newUser, status: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">Active</SelectItem>
										<SelectItem value="Inactive">Inactive</SelectItem>
										<SelectItem value="Suspended">Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddUserOpen(false);
									setFormErrors({});
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								onClick={handleAddUser}
								disabled={isLoading}
							>
								{isLoading ? "Saving..." : "Save User"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

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
