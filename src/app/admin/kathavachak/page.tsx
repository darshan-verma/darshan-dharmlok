"use client";

import { useState, useEffect } from "react";
import {
	PlusCircle,
	Search,
	Eye,
	Edit,
	Trash2,
	LogIn,
	ThumbsUp,
	ThumbsDown,
	CheckCircle2,
	CircleSlash,
	Activity,
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
const mockKathavachaks = [
	{
		id: "1",
		name: "Pandit Ramesh Sharma",
		category: "Bhagavad Gita",
		phone: "+91 9876543210",
		email: "ramesh.sharma@gmail.com",
		status: "Active",
		rank: "Senior",
		isApproved: true,
	},
	{
		id: "2",
		name: "Acharya Priya Joshi",
		category: "Ramayana",
		phone: "+91 8765432109",
		email: "priya.joshi@gmail.com",
		status: "Active",
		rank: "Expert",
		isApproved: true,
	},
	{
		id: "3",
		name: "Swami Amit Trivedi",
		category: "Vedas",
		phone: "+91 7654321098",
		email: "amit.trivedi@gmail.com",
		status: "Inactive",
		rank: "Master",
		isApproved: false,
	},
	{
		id: "4",
		name: "Pandit Deepika Singh",
		category: "Puranas",
		phone: "+91 6543210987",
		email: "deepika.singh@gmail.com",
		status: "Active",
		rank: "Senior",
		isApproved: true,
	},
	{
		id: "5",
		name: "Acharya Vikram Mehta",
		category: "Upanishads",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
		rank: "Junior",
		isApproved: false,
	},
];

// Categories for Kathavachaks
const kathavachakCategories = [
	"Bhagavad Gita",
	"Ramayana",
	"Mahabharata",
	"Vedas",
	"Puranas",
	"Upanishads",
	"Bhakti Yoga",
	"Other",
];

// Ranks for Kathavachaks
const kathavachakRanks = ["Junior", "Senior", "Expert", "Master"];

interface Kathavachak {
	id: string;
	name: string;
	category: string;
	phone: string;
	email: string;
	status: string;
	rank: string;
	isApproved: boolean;
}

export default function KathavachakPage() {
	const router = useRouter();
	// Load kathavachaks from localStorage or use mock data if not found
	const [kathavachaks, setKathavachaks] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("kathavachaks");
			return saved ? JSON.parse(saved) : mockKathavachaks;
		}
		return mockKathavachaks;
	});

	// Save to localStorage whenever kathavachaks change
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("kathavachaks", JSON.stringify(kathavachaks));
		}
	}, [kathavachaks]);

	const [isAddKathavachakOpen, setIsAddKathavachakOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [kathavachakToDelete, setKathavachakToDelete] = useState<string | null>(
		null
	);
	const [newKathavachak, setNewKathavachak] = useState<Omit<Kathavachak, 'id'> & { id?: string }>({
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	});
	const [searchQuery, setSearchQuery] = useState("");

	const handleAddKathavachak = () => {
		const id = Date.now().toString(); // Use timestamp for unique ID
		const updatedKathavachaks = [...kathavachaks, { ...newKathavachak, id }];
		setKathavachaks(updatedKathavachaks);
		setNewKathavachak({
			name: "",
			category: "",
			phone: "",
			email: "",
			status: "Active",
			rank: "",
			isApproved: false,
		});
		setIsAddKathavachakOpen(false);
	};

	const handleStatusChange = (kathavachakId: string, newStatus: string) => {
		setKathavachaks(
			kathavachaks.map((kathavachak: Kathavachak) =>
				kathavachak.id === kathavachakId
					? { ...kathavachak, status: newStatus }
					: kathavachak
			)
		);
	};

	const handleApprovalChange = (kathavachakId: string, isApproved: boolean) => {
		setKathavachaks(
			kathavachaks.map((kathavachak: Kathavachak) =>
				kathavachak.id === kathavachakId
					? { ...kathavachak, isApproved }
					: kathavachak
			)
		);
		// In a real app, you would call an API to update the approval status
		alert(
			`Kathavachak ${isApproved ? "approved" : "disapproved"} successfully!`
		);
	};

	const handleDeleteKathavachak = (id: string) => {
		setKathavachakToDelete(id);
		setIsDeleteConfirmOpen(true);
	};

	const confirmDeleteKathavachak = () => {
		if (kathavachakToDelete) {
			setKathavachaks(kathavachaks.filter((k: Kathavachak) => k.id !== kathavachakToDelete));
			setKathavachakToDelete(null);
			setIsDeleteConfirmOpen(false);
			// In a real app, you would call an API to delete the kathavachak
			alert("Kathavachak deleted successfully!");
		}
	};

	const handleLoginAsKathavachak = (kathavachakId: string) => {
		// In a real app, you would implement a secure way to login as the kathavachak
		alert(`Logging in as Kathavachak ID: ${kathavachakId}`);
		// Redirect to kathavachak dashboard or perform other actions
	};

	const filteredKathavachaks = kathavachaks.filter(
		(kathavachak: Kathavachak) =>
			kathavachak.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			kathavachak.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			kathavachak.phone.includes(searchQuery) ||
			kathavachak.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Kathavachak Management</h1>
				<Dialog
					open={isAddKathavachakOpen}
					onOpenChange={setIsAddKathavachakOpen}
				>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-2">
							<PlusCircle className="h-4 w-4" />
							Add Kathavachak
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New Kathavachak</DialogTitle>
							<DialogDescription>
								Fill in the details to add a new kathavachak to the system.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input
									id="name"
									value={newKathavachak.name}
									onChange={(e) =>
										setNewKathavachak({
											...newKathavachak,
											name: e.target.value,
										})
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Category
								</Label>
								<Select
									value={newKathavachak.category}
									onValueChange={(value) =>
										setNewKathavachak({ ...newKathavachak, category: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{kathavachakCategories.map((category) => (
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
									value={newKathavachak.phone}
									onChange={(e) =>
										setNewKathavachak({
											...newKathavachak,
											phone: e.target.value,
										})
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
									value={newKathavachak.email}
									onChange={(e) =>
										setNewKathavachak({
											...newKathavachak,
											email: e.target.value,
										})
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="rank" className="text-right">
									Rank
								</Label>
								<Select
									value={newKathavachak.rank}
									onValueChange={(value) =>
										setNewKathavachak({ ...newKathavachak, rank: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select rank" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{kathavachakRanks.map((rank) => (
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
									value={newKathavachak.status}
									onValueChange={(value) =>
										setNewKathavachak({ ...newKathavachak, status: value })
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
										checked={newKathavachak.isApproved}
										onChange={(e) =>
											setNewKathavachak({
												...newKathavachak,
												isApproved: e.target.checked,
											})
										}
										className="h-4 w-4 mr-2"
									/>
									<Label htmlFor="isApproved">
										{newKathavachak.isApproved ? "Yes" : "No"}
									</Label>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit" onClick={handleAddKathavachak}>
								Add Kathavachak
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex items-center w-full max-w-sm space-x-2 mb-6">
				<Input
					type="text"
					placeholder="Search kathavachaks..."
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
						{filteredKathavachaks.length > 0 ? (
							filteredKathavachaks.map((kathavachak: Kathavachak) => (
								<TableRow key={kathavachak.id}>
									<TableCell className="font-medium">
										{kathavachak.name}
									</TableCell>
									<TableCell>{kathavachak.category}</TableCell>
									<TableCell>{kathavachak.phone}</TableCell>
									<TableCell>{kathavachak.email}</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												kathavachak.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{kathavachak.status}
										</span>
									</TableCell>
									<TableCell>
										<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{kathavachak.rank}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												kathavachak.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{kathavachak.isApproved ? "Approved" : "Pending"}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/kathavachak/${kathavachak.id}`}>
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
												<DropdownMenuLabel>
													Manage Kathavachak
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{!kathavachak.isApproved ? (
													<DropdownMenuItem
														onClick={() =>
															handleApprovalChange(kathavachak.id, true)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															handleApprovalChange(kathavachak.id, false)
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
																handleStatusChange(kathavachak.id, "Active")
															}
															className={
																kathavachak.status === "Active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleStatusChange(kathavachak.id, "Inactive")
															}
															className={
																kathavachak.status === "Inactive"
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
														router.push(`/admin/kathavachak/${kathavachak.id}`)
													}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleDeleteKathavachak(kathavachak.id)
													}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleLoginAsKathavachak(kathavachak.id)
													}
												>
													<LogIn className="h-4 w-4 mr-2" />
													Login as Kathavachak
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-6">
									No kathavachaks found. Try a different search or add a new
									kathavachak.
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
							Are you sure you want to delete this kathavachak? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex justify-between">
						<Button
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDeleteKathavachak}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
