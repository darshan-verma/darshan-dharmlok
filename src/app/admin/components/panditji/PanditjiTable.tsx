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

// Define the Panditji interface
export interface Panditji {
	id: string;
	name: string;
	category: string;
	phone: string;
	email: string;
	status: string;
	rank: string;
	isApproved: boolean;
}

interface PanditjiTableProps {
	panditjis: Panditji[];
	setPanditjis: React.Dispatch<React.SetStateAction<Panditji[]>>;
	onAddPanditji?: () => void;
	onEditPanditji: (panditji: Panditji) => void;
	onDeletePanditji: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onToggleApproval: (id: string, currentStatus: boolean) => Promise<void>;
	onLoginAsPanditji: (panditji: Panditji) => void;
}

// Categories for Panditji
export const panditjiCategories = ["Sanatan", "Jain", "Sikh", "Buddhism"];

// Ranks for Panditji
export const panditjiRanks = ["Junior", "Senior", "Expert", "Master"];

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
		// case "Puranas":
		// 	return "bg-cyan-100 text-cyan-800";
		// case "Upanishads":
		// 	return "bg-violet-100 text-violet-800";
		// case "Bhakti Yoga":
		// 	return "bg-fuchsia-100 text-fuchsia-800";
		// case "Other":
		// 	return "bg-slate-100 text-slate-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export default function PanditjiTable({
	panditjis,
	onAddPanditji,
	onEditPanditji,
	onDeletePanditji,
	onUpdateStatus,
	onToggleApproval,
}: PanditjiTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [rankFilter, setRankFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

	// Filter panditjis based on search and filter criteria
	const filteredPanditjis = panditjis.filter((panditji) => {
		// Apply search filter
		const matchesSearch =
			panditji.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			panditji.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			panditji.phone.includes(searchTerm) ||
			panditji.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			panditji.rank.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply category filter
		const matchesCategory =
			categoryFilter === "all" || panditji.category === categoryFilter;

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || panditji.status === statusFilter;

		// Apply rank filter
		const matchesRank = rankFilter === "all" || panditji.rank === rankFilter;

		// Apply approval filter
		const matchesApproval =
			approvalFilter === "all" ||
			(approvalFilter === "approved" && panditji.isApproved) ||
			(approvalFilter === "notApproved" && !panditji.isApproved);

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
							placeholder="Search panditjis..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Panditji Button */}
					{onAddPanditji && (
						<Button onClick={onAddPanditji} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Panditji
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
								{panditjiCategories.map((category) => (
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
								{panditjiRanks.map((rank) => (
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
					{filteredPanditjis.length} panditji
					{filteredPanditjis.length !== 1 ? "s" : ""} found
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
						{filteredPanditjis.length > 0 ? (
							filteredPanditjis.map((panditji) => (
								<TableRow key={panditji.id}>
									<TableCell className="font-medium">{panditji.name}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
												panditji.category
											)}`}
										>
											{panditji.category}
										</span>
									</TableCell>
									<TableCell>{panditji.phone}</TableCell>
									<TableCell>{panditji.email}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRankColor(
												panditji.rank
											)}`}
										>
											{panditji.rank || "Unranked"}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												panditji.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{panditji.status}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												panditji.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{panditji.isApproved ? "Approved" : "Not Approved"}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/panditji/${panditji.id}`}>
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
												<DropdownMenuLabel>Manage Panditji</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{!panditji.isApproved ? (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(panditji.id, panditji.isApproved)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(panditji.id, panditji.isApproved)
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
																onUpdateStatus(panditji.id, "Active")
															}
															className={
																panditji.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(panditji.id, "Inactive")
															}
															className={
																panditji.status === "Inactive"
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
													onClick={() => onEditPanditji(panditji)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeletePanditji(panditji.id, panditji.name);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
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
																		userId: panditji.id,
																	}),
																}
															);

															if (!impersonateRes.ok) {
																localStorage.removeItem("adminSessionToken"); // Clean up on failure
																throw new Error("Impersonation failed");
															}

															// 4. Redirect to the panditji's dashboard
															window.location.href =
																"/dashboard/panditji/dashboard";
														} catch (err) {
															localStorage.removeItem("adminSessionToken"); // Clean up on failure
														}
													}}
												>
													<LogIn className="h-4 w-4 mr-2" />
													Login as Panditji
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-6">
									No panditjis found. Try a different search or add a new
									panditji.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
