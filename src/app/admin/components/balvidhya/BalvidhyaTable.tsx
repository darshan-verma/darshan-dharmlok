"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
	Activity,
	PlusCircle,
	TrendingUp,
	TrendingDown,
	Play,
	BookOpen,
	Image as ImageIcon,
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

// Define the Balvidhya interface
export interface Balvidhya {
	id: string;
	name: string;
	description: string;
	type: string; // "video" | "book" | "audio" | "other"
	category: string;
	status: string; // "Active" | "Inactive" | "Draft"
	trending: boolean;
	thumbnailUrl?: string;
	dateAdded: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface BalvidhyaTableProps {
	balvidhyas: Balvidhya[];
	setBalvidhyas: React.Dispatch<React.SetStateAction<Balvidhya[]>>;
	onAddBalvidhya?: () => void;
	onEditBalvidhya: (balvidhya: Balvidhya) => void;
	onDeleteBalvidhya: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onToggleTrending: (id: string, currentStatus: boolean) => Promise<void>;
	onViewBalvidhya: (balvidhya: Balvidhya) => void;
}

// Types for Balvidhya content
export const balvidhyaTypes = [
	"Video",
	"Book",
	"Audio",
	"Podcast",
	"Article",
	"Other",
];

// Categories for Balvidhya
export const balvidhyaCategories = [
	"Vedic Stories",
	"Moral Stories",
	"Historical Tales",
	"Bhagavad Gita for Kids",
	"Ramayana for Kids",
	"Mahabharata for Kids",
	"Sanskrit Learning",
	"Yoga for Kids",
	"Meditation",
	"Festivals",
	"Values & Ethics",
	"Other",
];

// Function to get color based on type
export const getTypeColor = (type: string): string => {
	switch (type) {
		case "Video":
			return "bg-red-100 text-red-800";
		case "Book":
			return "bg-blue-100 text-blue-800";
		case "Audio":
			return "bg-green-100 text-green-800";
		case "Podcast":
			return "bg-purple-100 text-purple-800";
		case "Article":
			return "bg-orange-100 text-orange-800";
		case "Other":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

// Function to get color based on category
export const getCategoryColor = (category: string): string => {
	switch (category) {
		case "Vedic Stories":
			return "bg-amber-100 text-amber-800";
		case "Moral Stories":
			return "bg-emerald-100 text-emerald-800";
		case "Historical Tales":
			return "bg-indigo-100 text-indigo-800";
		case "Bhagavad Gita for Kids":
			return "bg-orange-100 text-orange-800";
		case "Ramayana for Kids":
			return "bg-rose-100 text-rose-800";
		case "Mahabharata for Kids":
			return "bg-violet-100 text-violet-800";
		case "Sanskrit Learning":
			return "bg-cyan-100 text-cyan-800";
		case "Yoga for Kids":
			return "bg-lime-100 text-lime-800";
		case "Meditation":
			return "bg-teal-100 text-teal-800";
		case "Festivals":
			return "bg-fuchsia-100 text-fuchsia-800";
		case "Values & Ethics":
			return "bg-sky-100 text-sky-800";
		case "Other":
			return "bg-slate-100 text-slate-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

// Function to get icon based on type
const getTypeIcon = (type: string) => {
	switch (type) {
		case "Video":
			return <Play className="h-3 w-3" />;
		case "Book":
			return <BookOpen className="h-3 w-3" />;
		case "Audio":
		case "Podcast":
			return <Play className="h-3 w-3" />;
		default:
			return <ImageIcon className="h-3 w-3" />;
	}
};

export default function BalvidhyaTable({
	balvidhyas,
	onAddBalvidhya,
	onEditBalvidhya,
	onDeleteBalvidhya,
	onUpdateStatus,
	onToggleTrending,
	onViewBalvidhya,
}: BalvidhyaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [trendingFilter, setTrendingFilter] = useState<string>("all");

	// Add mock data for demonstration
	const mockBalvidhyas: Balvidhya[] = [
		{
			id: "mock-1",
			name: "Stories from Ramayana for Kids",
			description:
				"Engaging animated stories from the epic Ramayana specially designed for children aged 5-12. Features colorful animations, simple language, and moral lessons.",
			type: "Video",
			category: "Ramayana for Kids",
			status: "Active",
			trending: true,
			thumbnailUrl:
				"https://tulsibooks.com/wp-content/uploads/2023/06/untold-stories-of-krishna.jpg",
			dateAdded: new Date("2024-01-15"),
			createdAt: new Date("2024-01-15"),
			updatedAt: new Date("2024-01-20"),
		},
		{
			id: "mock-2",
			name: "Bhagavad Gita Chapter 1: The Battlefield",
			description:
				"An in-depth audio commentary on the first chapter of Bhagavad Gita, explaining the context and setting of this sacred dialogue between Krishna and Arjuna.",
			type: "Audio",
			category: "Bhagavad Gita for Kids",
			status: "Draft",
			trending: false,
			thumbnailUrl:
				"https://gogita.in/wp-content/uploads/2021/07/KrishnaBook-kan.jpg",
			dateAdded: new Date("2024-01-10"),
			createdAt: new Date("2024-01-10"),
			updatedAt: new Date("2024-01-18"),
		},
	];

	// Use mock data if no real data is provided
	const displayBalvidhyas = balvidhyas.length > 0 ? balvidhyas : mockBalvidhyas;

	// Helper function to format date
	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "N/A";
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(date);
	};

	// Filter balvidhyas based on search and filter criteria
	const filteredBalvidhyas = displayBalvidhyas.filter((balvidhya) => {
		// Apply search filter
		const matchesSearch =
			balvidhya.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			balvidhya.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			balvidhya.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			balvidhya.category.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply type filter
		const matchesType = typeFilter === "all" || balvidhya.type === typeFilter;

		// Apply category filter
		const matchesCategory =
			categoryFilter === "all" || balvidhya.category === categoryFilter;

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || balvidhya.status === statusFilter;

		// Apply trending filter
		const matchesTrending =
			trendingFilter === "all" ||
			(trendingFilter === "trending" && balvidhya.trending) ||
			(trendingFilter === "notTrending" && !balvidhya.trending);

		return (
			matchesSearch &&
			matchesType &&
			matchesCategory &&
			matchesStatus &&
			matchesTrending
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
							placeholder="Search content..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Balvidhya Button */}
					{onAddBalvidhya && (
						<Button onClick={onAddBalvidhya} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Content
						</Button>
					)}
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* Type Filter */}
					<div className="w-32">
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								{balvidhyaTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Category Filter */}
					<div className="w-44">
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{balvidhyaCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
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
								<SelectItem value="Draft">Draft</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Trending Filter */}
					<div className="w-32">
						<Select value={trendingFilter} onValueChange={setTrendingFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Trending" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="trending">Trending</SelectItem>
								<SelectItem value="notTrending">Not Trending</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredBalvidhyas.length} item
					{filteredBalvidhyas.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Thumbnail</TableHead>
							<TableHead>Date Added</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Trending</TableHead>
							<TableHead>Detail</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredBalvidhyas.length > 0 ? (
							filteredBalvidhyas.map((balvidhya) => (
								<TableRow key={balvidhya.id}>
									{/* Thumbnail */}
									<TableCell>
										{balvidhya.thumbnailUrl ? (
											<img
												src={balvidhya.thumbnailUrl}
												alt={balvidhya.name}
												className="w-16 h-10 object-cover rounded"
												style={{ maxWidth: 64, maxHeight: 40 }}
											/>
										) : (
											<div className="w-16 h-10 bg-gray-200 flex items-center justify-center text-xs text-gray-400 rounded">
												No Image
											</div>
										)}
									</TableCell>

									{/* Date Added */}
									<TableCell className="text-sm">
										{formatDate(balvidhya.dateAdded)}
									</TableCell>

									{/* Name */}
									<TableCell className="font-medium max-w-48">
										<div className="truncate" title={balvidhya.name}>
											{balvidhya.name}
										</div>
									</TableCell>

									{/* Description */}
									<TableCell className="max-w-60">
										<div
											className="truncate text-sm text-gray-600"
											title={balvidhya.description}
										>
											{balvidhya.description}
										</div>
									</TableCell>

									{/* Type */}
									<TableCell>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
												balvidhya.type
											)}`}
										>
											{getTypeIcon(balvidhya.type)}
											{balvidhya.type}
										</span>
									</TableCell>

									{/* Category */}
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
												balvidhya.category
											)}`}
										>
											{balvidhya.category}
										</span>
									</TableCell>

									{/* Status */}
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												balvidhya.status === "Active"
													? "bg-green-100 text-green-800"
													: balvidhya.status === "Draft"
													? "bg-yellow-100 text-yellow-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{balvidhya.status}
										</span>
									</TableCell>

									{/* Trending */}
									<TableCell>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
												balvidhya.trending
													? "bg-orange-100 text-orange-800"
													: "bg-gray-100 text-gray-800"
											}`}
										>
											{balvidhya.trending ? (
												<>
													<TrendingUp className="h-3 w-3" />
													Trending
												</>
											) : (
												"Normal"
											)}
										</span>
									</TableCell>

									{/* Detail */}
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/balvidhya/${balvidhya.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
										</Button>
									</TableCell>

									{/* Actions */}
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Content</DropdownMenuLabel>
												<DropdownMenuSeparator />

												{/* Toggle Trending */}
												{!balvidhya.trending ? (
													<DropdownMenuItem
														onClick={() =>
															onToggleTrending(balvidhya.id, balvidhya.trending)
														}
														className="text-orange-600"
													>
														<TrendingUp className="h-4 w-4 mr-2" />
														Mark as Trending
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															onToggleTrending(balvidhya.id, balvidhya.trending)
														}
														className="text-gray-600"
													>
														<TrendingDown className="h-4 w-4 mr-2" />
														Remove from Trending
													</DropdownMenuItem>
												)}

												{/* Change Status */}
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(balvidhya.id, "Active")
															}
															className={
																balvidhya.status === "Active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(balvidhya.id, "Inactive")
															}
															className={
																balvidhya.status === "Inactive"
																	? "bg-blue-50"
																	: ""
															}
														>
															<div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
															Inactive
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(balvidhya.id, "Draft")
															}
															className={
																balvidhya.status === "Draft" ? "bg-blue-50" : ""
															}
														>
															<div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
															Draft
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>

												{/* Edit */}
												<DropdownMenuItem
													onClick={() => onEditBalvidhya(balvidhya)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>

												{/* Delete */}
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteBalvidhya(balvidhya.id, balvidhya.name);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={10} className="text-center py-6">
									No videos or books found. Try a different search or add new
									content.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
