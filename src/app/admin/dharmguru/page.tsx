"use client";

import { useState } from "react";
import {
	PlusCircle,
	Search,
	Eye,
	Edit,
	Trash2,
	LogIn,
	ThumbsUp,
	ThumbsDown,
	Activity,
	CheckCircle2,
	CircleSlash,
} from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

// Mock data for initial display
const mockDharmgurus = [
	{
		id: "1",
		name: "Swami Anand Sharma",
		category: "Spiritual Guidance",
		phone: "+91 9876543210",
		email: "anand.sharma@gmail.com",
		status: "Active",
		rank: "Senior",
		isApproved: true,
	},
	{
		id: "2",
		name: "Acharya Sunita Joshi",
		category: "Meditation",
		phone: "+91 8765432109",
		email: "sunita.joshi@gmail.com",
		status: "Active",
		rank: "Expert",
		isApproved: true,
	},
	{
		id: "3",
		name: "Guru Rajesh Trivedi",
		category: "Yoga",
		phone: "+91 7654321098",
		email: "rajesh.trivedi@gmail.com",
		status: "Inactive",
		rank: "Master",
		isApproved: false,
	},
	{
		id: "4",
		name: "Swamini Deepa Singh",
		category: "Vedanta",
		phone: "+91 6543210987",
		email: "deepa.singh@gmail.com",
		status: "Active",
		rank: "Senior",
		isApproved: true,
	},
	{
		id: "5",
		name: "Acharya Vikram Mehta",
		category: "Ayurveda",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
		rank: "Junior",
		isApproved: false,
	},
];

// Categories for Dharmgurus
const dharmguruCategories = [
	"Spiritual Guidance",
	"Meditation",
	"Yoga",
	"Vedanta",
	"Ayurveda",
	"Astrology",
	"Life Coaching",
	"Other",
];

// Ranks for Dharmgurus
const dharmguruRanks = ["Junior", "Senior", "Expert", "Master"];

export default function DharmguruPage() {
	const router = useRouter();
	const [dharmgurus, setDharmgurus] = useState(mockDharmgurus);
	const [isAddDharmguruOpen, setIsAddDharmguruOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [dharmguruToDelete, setDharmguruToDelete] = useState<string | null>(
		null
	);
	const [newDharmguru, setNewDharmguru] = useState({
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	});
	const [searchQuery, setSearchQuery] = useState("");

	const handleAddDharmguru = () => {
		const id = (dharmgurus.length + 1).toString();
		setDharmgurus([...dharmgurus, { ...newDharmguru, id }]);
		setNewDharmguru({
			name: "",
			category: "",
			phone: "",
			email: "",
			status: "Active",
			rank: "",
			isApproved: false,
		});
		setIsAddDharmguruOpen(false);
	};

	const handleStatusChange = (dharmguruId: string, newStatus: string) => {
		setDharmgurus(
			dharmgurus.map((dharmguru) =>
				dharmguru.id === dharmguruId
					? { ...dharmguru, status: newStatus }
					: dharmguru
			)
		);
	};

	const handleApprovalChange = (dharmguruId: string, isApproved: boolean) => {
		setDharmgurus(
			dharmgurus.map((dharmguru) =>
				dharmguru.id === dharmguruId ? { ...dharmguru, isApproved } : dharmguru
			)
		);
		// In a real app, you would call an API to update the approval status
		alert(`Dharmguru ${isApproved ? "approved" : "disapproved"} successfully!`);
	};

	const handleDeleteDharmguru = (id: string) => {
		setDharmguruToDelete(id);
		setIsDeleteConfirmOpen(true);
	};

	const confirmDeleteDharmguru = () => {
		if (dharmguruToDelete) {
			setDharmgurus(dharmgurus.filter((k) => k.id !== dharmguruToDelete));
			setDharmguruToDelete(null);
			setIsDeleteConfirmOpen(false);
			// In a real app, you would call an API to delete the dharmguru
			alert("Dharmguru deleted successfully!");
		}
	};

	const handleLoginAsDharmguru = (dharmguruId: string) => {
		// In a real app, you would implement a secure way to login as the dharmguru
		alert(`Logging in as Dharmguru ID: ${dharmguruId}`);
		// Redirect to dharmguru dashboard or perform other actions
	};

	const filteredDharmgurus = dharmgurus.filter(
		(dharmguru) =>
			dharmguru.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			dharmguru.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			dharmguru.phone.includes(searchQuery) ||
			dharmguru.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Dharmguru Management</h1>
				<Dialog open={isAddDharmguruOpen} onOpenChange={setIsAddDharmguruOpen}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-2">
							<PlusCircle className="h-4 w-4" />
							Add Dharmguru
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New Dharmguru</DialogTitle>
							<DialogDescription>
								Fill in the details to add a new dharmguru to the system.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input
									id="name"
									value={newDharmguru.name}
									onChange={(e) =>
										setNewDharmguru({ ...newDharmguru, name: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Category
								</Label>
								<Select
									value={newDharmguru.category}
									onValueChange={(value) =>
										setNewDharmguru({ ...newDharmguru, category: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{dharmguruCategories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="phone" className="text-right">
									Phone
								</Label>
								<Input
									id="phone"
									value={newDharmguru.phone}
									onChange={(e) =>
										setNewDharmguru({ ...newDharmguru, phone: e.target.value })
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
									value={newDharmguru.email}
									onChange={(e) =>
										setNewDharmguru({ ...newDharmguru, email: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="rank" className="text-right">
									Rank
								</Label>
								<Select
									value={newDharmguru.rank}
									onValueChange={(value) =>
										setNewDharmguru({ ...newDharmguru, rank: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select rank" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{dharmguruRanks.map((rank) => (
												<SelectItem key={rank} value={rank}>
													{rank}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="status" className="text-right">
									Status
								</Label>
								<Select
									value={newDharmguru.status}
									onValueChange={(value) =>
										setNewDharmguru({ ...newDharmguru, status: value })
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
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="isApproved" className="text-right">
									Approved
								</Label>
								<div className="col-span-3 flex items-center">
									<input
										type="checkbox"
										id="isApproved"
										checked={newDharmguru.isApproved}
										onChange={(e) =>
											setNewDharmguru({
												...newDharmguru,
												isApproved: e.target.checked,
											})
										}
										className="h-4 w-4 mr-2"
									/>
									<Label htmlFor="isApproved">
										{newDharmguru.isApproved ? "Yes" : "No"}
									</Label>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit" onClick={handleAddDharmguru}>
								Add Dharmguru
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex items-center w-full max-w-sm space-x-2 mb-6">
				<Input
					type="text"
					placeholder="Search dharmgurus..."
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
							<TableHead>Category</TableHead>
							<TableHead>Phone No.</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Rank</TableHead>
							<TableHead>Approved</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredDharmgurus.length > 0 ? (
							filteredDharmgurus.map((dharmguru) => (
								<TableRow key={dharmguru.id}>
									<TableCell className="font-medium">
										{dharmguru.name}
									</TableCell>
									<TableCell>{dharmguru.category}</TableCell>
									<TableCell>{dharmguru.phone}</TableCell>
									<TableCell>{dharmguru.email}</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												dharmguru.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{dharmguru.status}
										</span>
									</TableCell>
									<TableCell>
										<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{dharmguru.rank}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												dharmguru.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{dharmguru.isApproved ? "Approved" : "Pending"}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/dharmguru/${dharmguru.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
										</Button>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Dharmguru</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{!dharmguru.isApproved ? (
													<DropdownMenuItem
														onClick={() =>
															handleApprovalChange(dharmguru.id, true)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															handleApprovalChange(dharmguru.id, false)
														}
														className="text-amber-600"
													>
														<ThumbsDown className="h-4 w-4 mr-2" />
														Disapprove
													</DropdownMenuItem>
												)}
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																handleStatusChange(dharmguru.id, "Active")
															}
															className={
																dharmguru.status === "Active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleStatusChange(dharmguru.id, "Inactive")
															}
															className={
																dharmguru.status === "Inactive"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem
													onClick={() =>
														router.push(`/admin/dharmguru/${dharmguru.id}`)
													}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDeleteDharmguru(dharmguru.id)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleLoginAsDharmguru(dharmguru.id)}
												>
													<LogIn className="h-4 w-4 mr-2" />
													Login as Dharmguru
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-6">
									No dharmgurus found. Try a different search or add a new
									dharmguru.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this dharmguru? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex justify-between">
						<Button
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDeleteDharmguru}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
