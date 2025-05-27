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
import { toast } from "@/lib/toast";

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
	const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [isAddKathavachakOpen, setIsAddKathavachakOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [kathavachakToDelete, setKathavachakToDelete] =
		useState<Kathavachak | null>(null);
	const [newKathavachak, setNewKathavachak] = useState<Partial<Kathavachak>>({
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: Partial<Kathavachak>) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Category validation
		if (!data.category) {
			errors.category = "Category is required";
		}

		// Email validation
		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation (Indian format)
		if (!data.phone) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit phone number";
		}

		// Rank validation
		if (!data.rank) {
			errors.rank = "Please select a rank";
		}

		return errors;
	};

	// Load kathavachaks from localStorage or use mock data
	useEffect(() => {
		const loadKathavachaks = async () => {
			const loadingToast = toast.loading("Loading Kathavachaks...");
			try {
				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 1000));

				try {
					const saved = localStorage.getItem("kathavachaks");
					const data = saved ? JSON.parse(saved) : mockKathavachaks;
					setKathavachaks(data);
					toast.dismiss(loadingToast);
				} catch (error) {
					console.error("Error loading kathavachaks:", error);
					toast.dismiss(loadingToast);
					toast.error("Failed to load Kathavachak data");
					setKathavachaks(mockKathavachaks);
				}
			} catch (error) {
				console.error("Error in loadKathavachaks:", error);
				toast.dismiss(loadingToast);
				toast.error("Failed to load Kathavachak data");
				setKathavachaks(mockKathavachaks);
			} finally {
				setIsLoading(false);
			}
		};

		loadKathavachaks();
	}, []);

	// Save kathavachaks to localStorage whenever they change
	useEffect(() => {
		if (kathavachaks.length > 0) {
			try {
				localStorage.setItem("kathavachaks", JSON.stringify(kathavachaks));
			} catch (error) {
				console.error("Error saving kathavachaks:", error);
				toast.error("Failed to save Kathavachak data");
			}
		}
	}, [kathavachaks]);

	const handleAddKathavachak = async () => {
		const validationErrors = validateForm(newKathavachak);
		setFormErrors(validationErrors);

		if (Object.keys(validationErrors).length > 0) {
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading("Adding new Kathavachak...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const newKavach = {
				...newKathavachak,
				id: Math.random().toString(36).substr(2, 9),
				isApproved: newKathavachak.isApproved || false,
			} as Kathavachak;

			setKathavachaks([...kathavachaks, newKavach]);

			// Reset form
			setNewKathavachak({
				name: "",
				category: "",
				phone: "",
				email: "",
				status: "Active",
				rank: "",
				isApproved: false,
			});

			// Clear errors
			setFormErrors({});

			// Close modal and show success
			setIsAddKathavachakOpen(false);
			toast.success("Kathavachak added successfully!");
		} catch (error) {
			console.error("Error adding kathavachak:", error);
			toast.error("Failed to add Kathavachak");
		} finally {
			setIsLoading(false);
			toast.dismiss(loadingToast);
		}
	};

	const handleDeleteKathavachak = async () => {
		if (!kathavachakToDelete) return;

		setIsLoading(true);
		const loadingToast = toast.loading(
			`Deleting ${kathavachakToDelete.name}...`
		);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setKathavachaks(
				kathavachaks.filter((k) => k.id !== kathavachakToDelete.id)
			);
			toast.dismiss(loadingToast);
			toast.success(`${kathavachakToDelete.name} deleted successfully`);
		} catch (error) {
			console.error("Error deleting kathavachak:", error);
			toast.dismiss(loadingToast);
			toast.error(`Failed to delete ${kathavachakToDelete.name}`);
		} finally {
			setKathavachakToDelete(null);
			setIsDeleteConfirmOpen(false);
			setIsLoading(false);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		const loadingToast = toast.loading("Updating status...");
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setKathavachaks(
				kathavachaks.map((k) => (k.id === id ? { ...k, status: newStatus } : k))
			);
			toast.dismiss(loadingToast);
			toast.success(`Status updated to ${newStatus}`);
		} catch (error) {
			console.error("Error updating status:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to update status");
		}
	};

	const handleToggleApproval = async (id: string, currentStatus: boolean) => {
		const loadingToast = toast.loading("Updating approval status...");
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setKathavachaks(
				kathavachaks.map((k) =>
					k.id === id ? { ...k, isApproved: !currentStatus } : k
				)
			);
			toast.dismiss(loadingToast);
			toast.success(
				`Kathavachak ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch (error) {
			console.error("Error updating approval status:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsKathavachak = (kathavachak: Kathavachak) => {
		const loadingToast = toast.loading(`Logging in as ${kathavachak.name}...`);

		try {
			// Simulate login
			setTimeout(() => {
				toast.dismiss(loadingToast);
				toast.success(`Successfully logged in as ${kathavachak.name}`);
				// In a real app, you would redirect to the kathavachak's dashboard
			}, 1000);
		} catch (error) {
			console.error("Error logging in as kathavachak:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to log in as Kathavachak");
		}
	};

	const filteredKathavachaks = kathavachaks.filter(
		(kathavachak: Kathavachak) =>
			kathavachak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			kathavachak.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			kathavachak.phone.includes(searchTerm) ||
			kathavachak.category.toLowerCase().includes(searchTerm.toLowerCase())
	);
	if (isLoading) {
		return <div>Loading kathavachaks...</div>; // Or a nice loading spinner
	}
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
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Add New Kathavachak</DialogTitle>
							<DialogDescription>
								Fill in the details to add a new kathavachak to the system.
								Fields marked with <span className="text-red-500">*</span> are
								required.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-2">
							{/* Name Field */}
							<div className="space-y-2">
								<div className="flex items-center">
									<Label htmlFor="name" className="text-sm font-medium w-32">
										Name <span className="text-red-500">*</span>
									</Label>
									<div className="flex-1">
										<Input
											id="name"
											value={newKathavachak.name}
											onChange={(e) => {
												setNewKathavachak({
													...newKathavachak,
													name: e.target.value,
												});
												if (formErrors.name)
													setFormErrors({ ...formErrors, name: "" });
											}}
											className={`w-full ${
												formErrors.name ? "border-red-500" : ""
											}`}
											placeholder="Enter full name"
										/>
									</div>
								</div>
								{formErrors.name && (
									<p className="text-sm text-red-600 mt-1 ml-32 pl-2">
										{formErrors.name}
									</p>
								)}
							</div>

							{/* Category Field */}
							<div className="space-y-2">
								<div className="flex items-center">
									<Label
										htmlFor="category"
										className="text-sm font-medium w-32"
									>
										Category <span className="text-red-500">*</span>
									</Label>
									<div className="flex-1">
										<Select
											value={newKathavachak.category}
											onValueChange={(value) => {
												setNewKathavachak({
													...newKathavachak,
													category: value,
												});
												if (formErrors.category)
													setFormErrors({ ...formErrors, category: "" });
											}}
										>
											<SelectTrigger
												className={`w-full ${
													formErrors.category ? "border-red-500" : ""
												}`}
											>
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
								</div>
								{formErrors.category && (
									<p className="text-sm text-red-600 mt-1 ml-32 pl-2">
										{formErrors.category}
									</p>
								)}
							</div>

							{/* Email Field */}
							<div className="space-y-2">
								<div className="flex items-center">
									<Label htmlFor="email" className="text-sm font-medium w-32">
										Email <span className="text-red-500">*</span>
									</Label>
									<div className="flex-1">
										<Input
											id="email"
											type="email"
											value={newKathavachak.email}
											onChange={(e) => {
												setNewKathavachak({
													...newKathavachak,
													email: e.target.value,
												});
												if (formErrors.email)
													setFormErrors({ ...formErrors, email: "" });
											}}
											className={`w-full ${
												formErrors.email ? "border-red-500" : ""
											}`}
											placeholder="Enter email address"
										/>
									</div>
								</div>
								{formErrors.email && (
									<p className="text-sm text-red-600 mt-1 ml-32 pl-2">
										{formErrors.email}
									</p>
								)}
							</div>

							{/* Phone Field */}
							<div className="space-y-2">
								<div className="flex items-center">
									<Label htmlFor="phone" className="text-sm font-medium w-32">
										Phone <span className="text-red-500">*</span>
									</Label>
									<div className="flex-1">
										<Input
											id="phone"
											type="tel"
											value={newKathavachak.phone}
											onChange={(e) => {
												setNewKathavachak({
													...newKathavachak,
													phone: e.target.value,
												});
												if (formErrors.phone)
													setFormErrors({ ...formErrors, phone: "" });
											}}
											className={`w-full ${
												formErrors.phone ? "border-red-500" : ""
											}`}
											placeholder="Enter phone number"
										/>
									</div>
								</div>
								{formErrors.phone && (
									<p className="text-sm text-red-600 mt-1 ml-32 pl-2">
										{formErrors.phone}
									</p>
								)}
							</div>

							{/* Rank Field */}
							<div className="space-y-2">
								<div className="flex items-center">
									<Label htmlFor="rank" className="text-sm font-medium w-32">
										Rank <span className="text-red-500">*</span>
									</Label>
									<div className="flex-1">
										<Select
											value={newKathavachak.rank}
											onValueChange={(value) => {
												setNewKathavachak({
													...newKathavachak,
													rank: value,
												});
												if (formErrors.rank)
													setFormErrors({ ...formErrors, rank: "" });
											}}
										>
											<SelectTrigger
												className={`w-full ${
													formErrors.rank ? "border-red-500" : ""
												}`}
											>
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
								</div>
								{formErrors.rank && (
									<p className="text-sm text-red-600 mt-1 ml-32 pl-2">
										{formErrors.rank}
									</p>
								)}
							</div>

							{/* Status Field */}
							<div className="flex items-center">
								<Label htmlFor="status" className="text-sm font-medium w-32">
									Status
								</Label>
								<div className="flex-1">
									<Select
										value={newKathavachak.status}
										onValueChange={(value) =>
											setNewKathavachak({ ...newKathavachak, status: value })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Active">Active</SelectItem>
											<SelectItem value="Inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Approved Checkbox */}
							<div className="flex items-center pt-2">
								<div className="w-32"></div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="isApproved"
										checked={newKathavachak.isApproved || false}
										onChange={(e) =>
											setNewKathavachak({
												...newKathavachak,
												isApproved: e.target.checked,
											})
										}
										className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
									/>
									<Label htmlFor="isApproved" className="text-sm font-medium">
										Approved
									</Label>
								</div>
							</div>
						</div>
						<DialogFooter className="pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddKathavachakOpen(false);
									setFormErrors({});
								}}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								onClick={handleAddKathavachak}
								disabled={isLoading}
								className="bg-primary hover:bg-primary/90"
							>
								{isLoading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Saving...
									</>
								) : (
									"Add Kathavachak"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex items-center w-full max-w-sm space-x-2 mb-6">
				<Input
					type="text"
					placeholder="Search kathavachaks..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
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
															handleToggleApproval(
																kathavachak.id,
																kathavachak.isApproved
															)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															handleToggleApproval(
																kathavachak.id,
																kathavachak.isApproved
															)
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
																handleUpdateStatus(kathavachak.id, "Active")
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
																handleUpdateStatus(kathavachak.id, "Inactive")
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
													onClick={() => setKathavachakToDelete(kathavachak)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleLoginAsKathavachak(kathavachak)}
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
						<Button variant="destructive" onClick={handleDeleteKathavachak}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
