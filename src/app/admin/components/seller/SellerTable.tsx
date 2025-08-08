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


// Define the Seller interface
export interface Seller {
	id: string;
	name: string;
	phone: string;
	email: string;
	status: string;
	isApproved: boolean;
}

interface SellerTableProps {
	sellers: Seller[];
	setSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
	onAddSeller?: () => void;
	onEditSeller: (seller: Seller) => void;
	onDeleteSeller: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onToggleApproval: (id: string, currentStatus: boolean) => Promise<void>;
	onLoginAsSeller: (seller: Seller) => void;
}

export default function SellerTable({
	sellers,
	onAddSeller,
	onEditSeller,
	onDeleteSeller,
	setSellers,
	onUpdateStatus,
	onToggleApproval,
}: SellerTableProps) {
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
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

	const [deleteDialog, setDeleteDialog] = useState<{
			open: boolean;
			seller?: Seller;
			mediaInfo?: {
				hasMedia: boolean;
				imageCount: number;
				videoCount: number;
				videoThumbnailCount: number;
			};
		}>({ open: false });
		const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter sellers based on search and filter criteria
	const filteredSellers = sellers.filter((seller) => {
		// Apply search filter
		const matchesSearch =
			seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			seller.phone.includes(searchTerm);

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || seller.status === statusFilter;

		// Apply approval filter
		const matchesApproval =
			approvalFilter === "all" ||
			(approvalFilter === "approved" && seller.isApproved) ||
			(approvalFilter === "notApproved" && !seller.isApproved);

		return matchesSearch && matchesStatus && matchesApproval;
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
							placeholder="Search sellers..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Seller Button */}
					{onAddSeller && (
						<Button onClick={onAddSeller} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Seller
						</Button>
					)}
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
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
					{filteredSellers.length} seller
					{filteredSellers.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Approved</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSellers.length > 0 ? (
							filteredSellers.map((seller) => (
								<TableRow key={seller.id}>
									<TableCell className="font-medium">{seller.name}</TableCell>
									<TableCell>{seller.phone}</TableCell>
									<TableCell>{seller.email}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												seller.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{seller.status}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												seller.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{seller.isApproved ? "Approved" : "Not Approved"}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/seller/${seller.id}`}>
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
												<DropdownMenuLabel>Manage Seller</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{!seller.isApproved ? (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(seller.id, seller.isApproved)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(seller.id, seller.isApproved)
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
																onUpdateStatus(seller.id, "Active")
															}
															className={
																seller.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(seller.id, "Inactive")
															}
															className={
																seller.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditSeller(seller)}>
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
															deleteDialog.seller?.id === seller.id
														)
															return;
														try {
															const res = await fetch(
																`/api/users?id=${seller.id}&mediaInfo=true`
															);
															const data = await res.json();
															setDeleteDialog({
																open: true,
																seller,
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
																		userId: seller.id,
																	}),
																}
															);

															if (!impersonateRes.ok) {
																localStorage.removeItem("adminSessionToken"); // Clean up on failure
																throw new Error("Impersonation failed");
															}

															// 4. Redirect to the seller's dashboard
															window.location.href =
																"/dashboard/seller/dashboard";
														} catch (err) {
															console.error("Impersonation error:", err);
															alert("Impersonation failed. Please try again.");
															localStorage.removeItem("adminSessionToken"); // Clean up on failure
														}
													}}
												>
													<LogIn className="h-4 w-4 mr-2" />
													Login as Seller
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-6">
									No sellers found. Try a different search or add a new
									seller.
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
						<DialogTitle>Delete seller</DialogTitle>
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
									Are you sure you want to delete {deleteDialog.seller?.name}
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
								if (deleteDialog.seller) {
									setIsDeleteLoading(true);
									// toastLoading("Deleting user...");
									try {
										const res = await fetch(
											`/api/users?id=${deleteDialog.seller.id}`,
											{ method: "DELETE" }
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted user from local state immediately
										if (deleteDialog.seller?.id) {
											setSellers((prev: Seller[]) =>
												prev.filter(
													(k: Seller) => k.id !== deleteDialog.seller!.id
												)
											);
										}
										onDeleteSeller(
											deleteDialog.seller.id,
											deleteDialog.seller.name
										);
										setDeleteDialog({
											open: false,
											seller: undefined,
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
