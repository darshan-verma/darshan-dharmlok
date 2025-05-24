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
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
	const [newUser, setNewUser] = useState({
		name: "",
		phone: "",
		email: "",
		status: "Active",
	});
	const [searchQuery, setSearchQuery] = useState("");

	const handleAddUser = () => {
		const id = (users.length + 1).toString();
		setUsers([...users, { ...newUser, id }]);
		setNewUser({
			name: "",
			phone: "",
			email: "",
			status: "Active",
		});
		setIsAddUserOpen(false);
	};

	const handleStatusChange = (userId: string, newStatus: string) => {
		setUsers(
			users.map((user) =>
				user.id === userId ? { ...user, status: newStatus } : user
			)
		);
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
								Fill in the details to add a new user to the system.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input
									id="name"
									value={newUser.name}
									onChange={(e) =>
										setNewUser({ ...newUser, name: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="phone" className="text-right">
									Phone
								</Label>
								<Input
									id="phone"
									value={newUser.phone}
									onChange={(e) =>
										setNewUser({ ...newUser, phone: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="email" className="text-right">
									Email
								</Label>
								<Input
									id="email"
									type="email"
									value={newUser.email}
									onChange={(e) =>
										setNewUser({ ...newUser, email: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="status" className="text-right">
									Status
								</Label>
								<Select
									value={newUser.status}
									onValueChange={(value) =>
										setNewUser({ ...newUser, status: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="Active">Active</SelectItem>
											<SelectItem value="Inactive">Inactive</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit" onClick={handleAddUser}>
								Add User
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
