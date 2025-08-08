"use client";

import { useState } from "react";
import {
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
	PlusCircle,
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
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toastSuccess, toastError } from "@/lib/toast";

// Define the Dharmguru interface
export interface Dharmguru {
	id: string;
	name: string;
	category: string;
	phone: string;
	email: string;
	status: string;
	rank: string;
	isApproved: boolean;
}

interface DharmguruTableProps {
	dharmgurus: Dharmguru[];
	setDharmgurus: React.Dispatch<React.SetStateAction<Dharmguru[]>>;
	onAddDharmguru?: () => void;
	onEditDharmguru: (dharmguru: Dharmguru) => void;
	onDeleteDharmguru: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onToggleApproval: (id: string, currentStatus: boolean) => Promise<void>;
	onLoginAsDharmguru: (dharmguru: Dharmguru) => void;
}

// Categories for dharmgurus
export const DharmguruCategories = ["Sanatan", "Jain", "Sikh", "Buddhism"];

// Ranks for dharmgurus
export const DharmguruRanks = ["Junior", "Senior", "Expert", "Master"];

// Function to get color based on rank
export const getRankColor = (rank: string): string => {
	switch (rank) {
		case "Junior":
			return "bg-blue-100 text-blue-800";
		case "Senior":
			return "bg-green-100 text-green-800";
		case "Expert":
			return "bg-purple-100 text-purple-800";
		case "Master":
			return "bg-amber-100 text-amber-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

// Function to get color based on category
export const getCategoryColor = (category: string): string => {
	switch (category) {
		case "Sanatan":
			return "bg-orange-100 text-orange-800";
		case "Jain":
			return "bg-rose-100 text-rose-800";
		case "Sikh":
			return "bg-indigo-100 text-indigo-800";
		case "Buddhism":
			return "bg-emerald-100 text-emerald-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export default function DharmguruTable({
	dharmgurus,
	onAddDharmguru,
	onEditDharmguru,
	onDeleteDharmguru,
	setDharmgurus,
	onUpdateStatus,
	onToggleApproval,
}: DharmguruTableProps) {
	// Helper to save the current URL (with query params) for admin return
	const saveAdminReturnUrl = () => {
		if (typeof window !== "undefined") {
			localStorage.setItem(
				"adminReturnUrl",
				window.location.pathname + window.location.search
			);
		}
	};
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [rankFilter, setRankFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		dharmguru?: Dharmguru;
		mediaInfo?: {
			hasMedia: boolean;
			imageCount: number;
			videoCount: number;
			videoThumbnailCount: number;
		};
	}>({ open: false });
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter dharmgurus based on search and filter criteria
	const filteredDharmgurus = dharmgurus.filter((dharmguru) => {
		// Apply search filter
		const matchesSearch =
			dharmguru.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			dharmguru.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			dharmguru.phone.includes(searchTerm) ||
			dharmguru.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			dharmguru.rank.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply category filter
		const matchesCategory =
			categoryFilter === "all" || dharmguru.category === categoryFilter;

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || dharmguru.status === statusFilter;

		// Apply rank filter
		const matchesRank = rankFilter === "all" || dharmguru.rank === rankFilter;

		// Apply approval filter
		const matchesApproval =
			approvalFilter === "all" ||
			(approvalFilter === "approved" && dharmguru.isApproved) ||
			(approvalFilter === "notApproved" && !dharmguru.isApproved);

		return (
			matchesSearch &&
			matchesCategory &&
			matchesStatus &&
			matchesRank &&
			matchesApproval
		);
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search dharmgurus..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Dharmguru Button */}
					{onAddDharmguru && (
						<Button onClick={onAddDharmguru} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Dharmguru
						</Button>
					)}
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* Category Filter */}
					<div className="w-40">
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{DharmguruCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Rank Filter */}
					<div className="w-36">
						<Select value={rankFilter} onValueChange={setRankFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select rank" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Ranks</SelectItem>
								{DharmguruRanks.map((rank) => (
									<SelectItem key={rank} value={rank}>
										{rank}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Status Filter */}
					<div className="w-32">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="Active">Active</SelectItem>
								<SelectItem value="Inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Approval Filter */}
					<div className="w-32">
						<Select value={approvalFilter} onValueChange={setApprovalFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Approval" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="notApproved">Not Approved</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredDharmgurus.length} dharmguru
					{filteredDharmgurus.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Rank</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Approved</TableHead>
							<TableHead>View</TableHead>
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
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
												dharmguru.category
											)}`}
										>
											{dharmguru.category}
										</span>
									</TableCell>
									<TableCell>{dharmguru.phone}</TableCell>
									<TableCell>{dharmguru.email}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRankColor(
												dharmguru.rank
											)}`}
										>
											{dharmguru.rank || "Unranked"}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												dharmguru.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{dharmguru.status}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												dharmguru.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{dharmguru.isApproved ? "Approved" : "Not Approved"}
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
															onToggleApproval(
																dharmguru.id,
																dharmguru.isApproved
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
															onToggleApproval(
																dharmguru.id,
																dharmguru.isApproved
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
																onUpdateStatus(dharmguru.id, "Active")
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
																onUpdateStatus(dharmguru.id, "Inactive")
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
													onClick={() => onEditDharmguru(dharmguru)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={async (e) => {
														e.preventDefault();
														// Prevent opening dialog if already open for this user
														if (
															deleteDialog.open &&
															deleteDialog.dharmguru?.id === dharmguru.id
														)
															return;
														try {
															const res = await fetch(
																`/api/users?id=${dharmguru.id}&mediaInfo=true`
															);
															const data = await res.json();
															setDeleteDialog({
																open: true,
																dharmguru,
																mediaInfo: {
																	hasMedia: !!data.hasMedia,
																	imageCount:
																		typeof data.imageCount === "number"
																			? data.imageCount
																			: 0,
																	videoCount:
																		typeof data.videoCount === "number"
																			? data.videoCount
																			: 0,
																	videoThumbnailCount:
																		typeof data.videoThumbnailCount === "number"
																			? data.videoThumbnailCount
																			: 0,
																},
															});
														} catch {
															toastError("Failed to check media info.");
														}
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
														saveAdminReturnUrl(); // Save current admin table URL for return
														try {
															// 1. Get the admin's session token
															const res = await fetch("/api/auth/get-jwt");
															if (!res.ok) {
																throw new Error("Failed to get admin token");
															}
															const { token } = await res.json();

															// 2. Save the admin token to localStorage
															localStorage.setItem("adminSessionToken", token);

															// 3. Call the impersonation API
															const impersonateRes = await fetch(
																"/api/auth/impersonate",
																{
																	method: "POST",
																	headers: {
																		"Content-Type": "application/json",
																	},
																	body: JSON.stringify({
																		userId: dharmguru.id,
																	}),
																}
															);

															if (!impersonateRes.ok) {
																localStorage.removeItem("adminSessionToken"); // Clean up on failure
																throw new Error("Impersonation failed");
															}

															// 4. Redirect to the dharmguru's dashboard
															window.location.href =
																"/dashboard/dharmguru";
														} catch (err) {
															console.error("Impersonation error:", err);
															alert("Impersonation failed. Please try again.");
															localStorage.removeItem("adminSessionToken"); // Clean up on failure
														}
													}}
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
			{/* Delete Confirmation Dialog (shadcn) */}
			<Dialog
				open={deleteDialog.open}
				onOpenChange={(open) => {
					if (!open) setDeleteDialog({ open: false });
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete dharmguru</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						{(() => {
							const hasMedia =
								!!deleteDialog.mediaInfo &&
								((deleteDialog.mediaInfo.imageCount ?? 0) > 0 ||
									(deleteDialog.mediaInfo.videoCount ?? 0) > 0 ||
									(deleteDialog.mediaInfo.videoThumbnailCount ?? 0) > 0);
							return hasMedia ? (
								<p>
									This user has {deleteDialog.mediaInfo?.imageCount ?? 0}{" "}
									images, {deleteDialog.mediaInfo?.videoCount ?? 0} videos, and{" "}
									{deleteDialog.mediaInfo?.videoThumbnailCount ?? 0} video
									thumbnails. Are you sure you want to delete this user and all
									associated media?
								</p>
							) : (
								<p>
									Are you sure you want to delete {deleteDialog.dharmguru?.name}
									? This action cannot be undone.
								</p>
							);
						})()}
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setDeleteDialog({ open: false })}
							disabled={isDeleteLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isDeleteLoading}
							onClick={async () => {
								if (deleteDialog.dharmguru) {
									setIsDeleteLoading(true);
									// toastLoading("Deleting user...");
									try {
										const res = await fetch(
											`/api/users?id=${deleteDialog.dharmguru.id}`,
											{ method: "DELETE" }
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted user from local state immediately
										if (deleteDialog.dharmguru?.id) {
											setDharmgurus((prev: Dharmguru[]) =>
												prev.filter(
													(k: Dharmguru) => k.id !== deleteDialog.dharmguru!.id
												)
											);
										}
										onDeleteDharmguru(
											deleteDialog.dharmguru.id,
											deleteDialog.dharmguru.name
										);
										setDeleteDialog({
											open: false,
											dharmguru: undefined,
											mediaInfo: undefined,
										});
										setIsDeleteLoading(false);
										toastSuccess("User deleted");
									} catch {
										setIsDeleteLoading(false);
										toastError("Delete failed");
									}
								}
							}}
						>
							{isDeleteLoading ? "Deleting..." : "Confirm Delete"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
