"use client";

import { useState } from "react";
import {
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
	MoreVertical,
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

// These enums match your schema
const balvidhyaTypes = [
	{ value: "video", label: "Video" },
	{ value: "book", label: "Book" },
];

const balvidhyaCategories = [
	{ value: "BhagavadGita", label: "Bhagavad Gita" },
	{ value: "Ramayana", label: "Ramayana" },
	{ value: "Mahabharata", label: "Mahabharata" },
	{ value: "Vedas", label: "Vedas" },
	{ value: "Puranas", label: "Puranas" },
	{ value: "Upanishads", label: "Upanishads" },
	{ value: "BhaktiYoga", label: "Bhakti Yoga" },
	{ value: "Other", label: "Other" },
];

const balvidhyaStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

const getTypeColor = (type: string): string =>
	type === "video"
		? "bg-red-100 text-red-800"
		: type === "book"
		? "bg-blue-100 text-blue-800"
		: "bg-gray-100 text-gray-800";

const getCategoryColor = (category: string): string => {
	switch (category) {
		case "BhagavadGita":
			return "bg-orange-100 text-orange-800";
		case "Ramayana":
			return "bg-rose-100 text-rose-800";
		case "Mahabharata":
			return "bg-violet-100 text-violet-800";
		case "Vedas":
			return "bg-cyan-100 text-cyan-800";
		case "Puranas":
			return "bg-fuchsia-100 text-fuchsia-800";
		case "Upanishads":
			return "bg-lime-100 text-lime-800";
		case "BhaktiYoga":
			return "bg-emerald-100 text-emerald-800";
		case "Other":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

const getTypeIcon = (type: string) =>
	type === "video" ? (
		<Play className="h-3 w-3" />
	) : type === "book" ? (
		<BookOpen className="h-3 w-3" />
	) : (
		<ImageIcon className="h-3 w-3" />
	);

type Balvidhya = {
	id: string;
	name: string;
	description?: string;
	thumbnailUrl?: string;
	dateAdded?: string | Date;
	type: string;
	category: string;
	status: string;
	trending: boolean;
	createdAt?: string | Date; // Optional, if needed for other purposes
	updatedAt?: string | Date; // Optional, if needed for other purposes
};

type BalvidhyaTableProps = {
	balvidhyas: Balvidhya[];
	setBalvidhyas?: (balvidhyas: Balvidhya[]) => void; // Make setBalvidhyas optional if not always used for direct manipulation from table
	onAddBalvidhya?: () => void;
	onEditBalvidhya: (balvidhya: Balvidhya) => void;
	onDeleteBalvidhya: (id: string, name: string) => void;
	onUpdateStatus: (id: string, status: string) => void;
	onToggleTrending: (id: string, trending: boolean) => void;
	onViewBalvidhya: (balvidhya: Balvidhya) => void; // Added onViewBalvidhya
};

export default function BalvidhyaTable({
	balvidhyas,
	onAddBalvidhya,
	onEditBalvidhya,
	onDeleteBalvidhya,
	onUpdateStatus,
	onToggleTrending,
	onViewBalvidhya, // Added onViewBalvidhya
}: BalvidhyaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [trendingFilter, setTrendingFilter] = useState<string>("all");

	const displayBalvidhyas = balvidhyas;

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

	const filteredBalvidhyas = displayBalvidhyas.filter((balvidhya) => {
		const matchesSearch =
			balvidhya.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			balvidhya.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = typeFilter === "all" || balvidhya.type === typeFilter;
		const matchesCategory =
			categoryFilter === "all" || balvidhya.category === categoryFilter;
		const matchesStatus =
			statusFilter === "all" || balvidhya.status === statusFilter;
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
					<div className="relative w-full sm:w-96">
						<Input
							type="search"
							placeholder="Search content..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{onAddBalvidhya && (
						<Button onClick={onAddBalvidhya} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Content
						</Button>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<div className="w-32">
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								{balvidhyaTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-44">
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{balvidhyaCategories.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-32">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								{balvidhyaStatuses.map((status) => (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
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
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Trending</TableHead>
							<TableHead>Date Added</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredBalvidhyas.length > 0 ? (
							filteredBalvidhyas.map((balvidhya) => (
								<TableRow key={balvidhya.id}>
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
									<TableCell className="font-medium max-w-48">
										<div className="truncate" title={balvidhya.name}>
											{balvidhya.name}
										</div>
									</TableCell>
									<TableCell className="max-w-60">
										<div
											className="truncate text-sm text-gray-600"
											title={balvidhya.description}
										>
											{balvidhya.description}
										</div>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
												balvidhya.type
											)}`}
										>
											{getTypeIcon(balvidhya.type)}
											{
												balvidhyaTypes.find((t) => t.value === balvidhya.type)
													?.label
											}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
												balvidhya.category
											)}`}
										>
											{balvidhyaCategories.find(
												(c) => c.value === balvidhya.category
											)?.label || balvidhya.category}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												balvidhya.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{balvidhya.status}
										</span>
									</TableCell>
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
									<TableCell className="text-sm">
										{formatDate(balvidhya.dateAdded!)}
									</TableCell>
									<TableCell>
										<Button
											variant="outline"
											size="sm"
											onClick={() => onViewBalvidhya(balvidhya)}
											className="h-8 px-2"
										>
											<Eye className="h-3.5 w-3.5 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreVertical className="h-4 w-4" />
													<span className="sr-only">Actions</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Content</DropdownMenuLabel>
												{/* <DropdownMenuItem onClick={() => onViewBalvidhya(balvidhya)}>
													<Eye className="h-4 w-4 mr-2" />
													View Details
												</DropdownMenuItem> */}{" "}
												{/* Removed from here */}
												<DropdownMenuSeparator />
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
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														{balvidhyaStatuses.map((status) => (
															<DropdownMenuItem
																key={status.value}
																onClick={() =>
																	onUpdateStatus(balvidhya.id, status.value)
																}
																className={
																	balvidhya.status === status.value
																		? "bg-blue-50"
																		: ""
																}
															>
																{status.label}
															</DropdownMenuItem>
														))}
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem
													onClick={() => onEditBalvidhya(balvidhya)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
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
