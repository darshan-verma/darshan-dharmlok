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
import { toast } from "@/lib/toast";

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

// Ranks for Dharmguru
interface Dharmguru {
	id: string;
	name: string;
	category: string;
	phone: string;
	email: string;
	status: string;
	rank: string;
	isApproved: boolean;
}

export default function DharmguruPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [dharmgurus, setDharmgurus] = useState(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem("dharmgurus");
				return saved ? JSON.parse(saved) : mockDharmgurus;
			} catch{
				toast.error("Failed to load Dharmguru data");
				return mockDharmgurus;
			}
		}
		return mockDharmgurus;
	});

	// Save to localStorage whenever dharmgurus change
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem("dharmgurus", JSON.stringify(dharmgurus));
			} catch{
				toast.error("Failed to save Dharmguru data");
			}
		}
	}, [dharmgurus]);

	const [isAddDharmguruOpen, setIsAddDharmguruOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [dharmguruToDelete, setDharmguruToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [newDharmguru, setNewDharmguru] = useState<
		Omit<Dharmguru, "id"> & { id?: string }
	>({
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (dharmguruData: typeof newDharmguru) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!dharmguruData.name.trim()) {
			errors.name = "Name is required";
		} else if (dharmguruData.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Category validation
		if (!dharmguruData.category.trim()) {
			errors.category = "Category is required";
		}

		// Email validation
		if (!dharmguruData.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dharmguruData.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation (assuming Indian phone numbers)
		if (!dharmguruData.phone) {
			errors.phone = "Phone number is required";
		} else if (
			!/^[6-9]\d{9}$/.test(dharmguruData.phone.replace(/[^0-9]/g, ""))
		) {
			errors.phone = "Please enter a valid 10-digit phone number";
		}

		// Rank validation
		if (!dharmguruData.rank) {
			errors.rank = "Please select a rank";
		}

		return errors;
	};

	const handleAddDharmguru = async () => {
		const errors = validateForm(newDharmguru);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) {
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading("Adding new dharmguru...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const id = (dharmgurus.length + 1).toString();
			const updatedDharmgurus = [...dharmgurus, { ...newDharmguru, id }];
			setDharmgurus(updatedDharmgurus);

			// Reset form
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
			toast.success("Dharmguru added successfully");
		} catch {
			toast.error("Failed to add dharmguru");
		} finally {
			setIsLoading(false);
			toast.dismiss(loadingToast);
		}
	};

	const handleStatusChange = (dharmguruId: string, newStatus: string) => {
		try {
			setDharmgurus(
				dharmgurus.map((dharmguru: Dharmguru) =>
					dharmguru.id === dharmguruId
						? { ...dharmguru, status: newStatus }
						: dharmguru
				)
			);
			toast.success(`Status updated to ${newStatus}`);
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleApprovalChange = (dharmguruId: string, isApproved: boolean) => {
		try {
			setDharmgurus(
				dharmgurus.map((dharmguru: Dharmguru) =>
					dharmguru.id === dharmguruId
						? { ...dharmguru, isApproved }
						: dharmguru
				)
			);
			toast.success(
				`Dharmguru ${isApproved ? "approved" : "disapproved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleDeleteDharmguru = (id: string, name: string) => {
		setDharmguruToDelete({ id, name });
		setIsDeleteConfirmOpen(true);
	};

	const confirmDeleteDharmguru = async () => {
		if (!dharmguruToDelete) return;

		setIsLoading(true);
		const loadingToast = toast.loading(`Deleting ${dharmguruToDelete.name}...`);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setDharmgurus(
				dharmgurus.filter((d: Dharmguru) => d.id !== dharmguruToDelete.id)
			);
			toast.dismiss(loadingToast);
			toast.success(`${dharmguruToDelete.name} deleted successfully`);
		} catch {
			toast.dismiss(loadingToast);
			toast.error(`Failed to delete ${dharmguruToDelete.name}`);
		} finally {
			setDharmguruToDelete(null);
			setIsDeleteConfirmOpen(false);
			setIsLoading(false);
		}
	};

	const handleLoginAsDharmguru = (dharmguru: Dharmguru) => {
		const loadingToast = toast.loading(`Logging in as ${dharmguru.name}...`);
		// In a real app, you would implement a secure way to login as the dharmguru
		setTimeout(() => {
			toast.dismiss(loadingToast);
			toast.success(`Successfully logged in as ${dharmguru.name}`);
			// Redirect to dharmguru dashboard or perform other actions
		}, 1000);
	};

	const filteredDharmgurus = dharmgurus.filter(
		(dharmguru: Dharmguru) =>
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
								Fill in the details below to add a new dharmguru.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name *</Label>
								<Input
									id="name"
									value={newDharmguru.name}
									onChange={(e) => {
										setNewDharmguru({ ...newDharmguru, name: e.target.value });
										if (formErrors.name)
											setFormErrors({ ...formErrors, name: "" });
									}}
									placeholder="Enter full name"
									className={formErrors.name ? "border-red-500" : ""}
								/>
								{formErrors.name && (
									<p className="text-sm text-red-500">{formErrors.name}</p>
								)}
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Category *
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
								
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={newDharmguru.email}
									onChange={(e) => {
										setNewDharmguru({ ...newDharmguru, email: e.target.value });
										if (formErrors.email)
											setFormErrors({ ...formErrors, email: "" });
									}}
									placeholder="Enter email address"
									className={formErrors.email ? "border-red-500" : ""}
								/>
								{formErrors.email && (
									<p className="text-sm text-red-500">{formErrors.email}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number *</Label>
								<Input
									id="phone"
									type="tel"
									value={newDharmguru.phone}
									onChange={(e) => {
										setNewDharmguru({ ...newDharmguru, phone: e.target.value });
										if (formErrors.phone)
											setFormErrors({ ...formErrors, phone: "" });
									}}
									placeholder="Enter phone number"
									className={formErrors.phone ? "border-red-500" : ""}
								/>
								{formErrors.phone && (
									<p className="text-sm text-red-500">{formErrors.phone}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="rank">Rank *</Label>
								<Select
									value={newDharmguru.rank}
									onValueChange={(value) => {
										setNewDharmguru({ ...newDharmguru, rank: value });
										if (formErrors.rank)
											setFormErrors({ ...formErrors, rank: "" });
									}}
								>
									<SelectTrigger
										className={formErrors.rank ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select rank" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Junior">Junior</SelectItem>
										<SelectItem value="Senior">Senior</SelectItem>
										<SelectItem value="Expert">Expert</SelectItem>
										<SelectItem value="Master">Master</SelectItem>
									</SelectContent>
								</Select>
								{formErrors.rank && (
									<p className="text-sm text-red-500">{formErrors.rank}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="status">Status *</Label>
								<Select
									value={newDharmguru.status}
									onValueChange={(value) =>
										setNewDharmguru({ ...newDharmguru, status: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">Active</SelectItem>
										<SelectItem value="Inactive">Inactive</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center space-x-2">
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
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<Label htmlFor="isApproved">Approved</Label>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddDharmguruOpen(false);
									setFormErrors({});
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								onClick={handleAddDharmguru}
								disabled={isLoading}
							>
								{isLoading ? "Saving..." : "Save Dharmguru"}
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
							filteredDharmgurus.map((dharmguru: Dharmguru) => (
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
													onClick={() =>
														handleDeleteDharmguru(dharmguru.id, dharmguru.name)
													}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleLoginAsDharmguru(dharmguru)}
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete {dharmguruToDelete?.name}? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteDharmguru}
							disabled={isLoading}
						>
							{isLoading ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
