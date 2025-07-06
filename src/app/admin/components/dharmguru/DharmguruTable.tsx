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

// Categories for Kathavachaks
export const DharmguruCategories = [
	"Sanatan",
	"Jain",
	"Sikh",
	"Buddhism",
];

// Ranks for Kathavachaks
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

export default function DharmguruTable({
	dharmgurus,
	onAddDharmguru,
	onEditDharmguru,
	onDeleteDharmguru,
	onUpdateStatus,
	onToggleApproval,
}: DharmguruTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [rankFilter, setRankFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

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
							placeholder="Search kathavachaks..."
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
												<DropdownMenuLabel>
													Manage Dharmguru
												</DropdownMenuLabel>
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
													onSelect={(e) => {
														e.preventDefault();
														onDeleteDharmguru(
															dharmguru.id,
															dharmguru.name
														);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<a href="/dashboard/dharmguru/posts">
														<LogIn className="h-4 w-4 mr-2" />
														Login as Dharmguru
													</a>
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
		</div>
	);
}
