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
	onUpdateStatus,
	onToggleApproval,
}: SellerTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

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
													onSelect={(e) => {
														e.preventDefault();
														onDeleteSeller(seller.id, seller.name);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
														try {
															// 1. Fetch JWT from custom API
															const jwtRes = await fetch("/api/auth/get-jwt", {
																credentials: "include",
															});
															const { token } = await jwtRes.json();
															if (token) {
																localStorage.setItem(
																	"adminSessionToken",
																	token
																);
															}
															// 2. Call impersonation API
															const res = await fetch("/api/auth/impersonate", {
																method: "POST",
																headers: { "Content-Type": "application/json" },
																credentials: "include",
																body: JSON.stringify({
																	userId: seller.id,
																}),
															});
															if (!res.ok)
																throw new Error("Impersonation failed");
															window.location.href = "/dashboard/seller/dashboard";
														} catch {
															alert(
																"Impersonation failed. See console for details."
															);
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
									No sellers found. Try a different search or add a new seller.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
