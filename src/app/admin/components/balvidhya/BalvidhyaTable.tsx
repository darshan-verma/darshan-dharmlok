"use client";

import { useState } from "react";
import {
	Eye,
	Edit,
	Trash2,
	PlusCircle,
	TrendingUp,
	TrendingDown,
	Play,
	BookOpen,
	Image as ImageIcon,
	MoreVertical,
	CircleSlash,
	CheckCircle2,
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
import Image from "next/image";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import {
	matchesReligiousFilter,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";
import {
	categoryOptions as balvidhyaCategories,
	categoryLabel,
	typeOptions as balvidhyaTypes,
	statusOptions as balvidhyaStatuses,
} from "./types";

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

export type Balvidhya = {
	id: string;
	name: string;
	description?: string;
	thumbnailUrl?: string;
	dateAdded?: string | Date;
	type: string;
	category: string;
	religiousCategories?: ReligiousCategory[];
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

export default function BalvidhyaTable(props: BalvidhyaTableProps) {
	const {
		balvidhyas,
		onAddBalvidhya,
		onEditBalvidhya,
		onDeleteBalvidhya,
		onUpdateStatus,
		onToggleTrending,
		onViewBalvidhya,
	} = props;
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [trendingFilter, setTrendingFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

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
		const matchesReligious = matchesReligiousFilter(
			resolveReligiousCategories(balvidhya),
			religiousFilter === "all" ? null : religiousFilter
		);
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
			matchesReligious &&
			matchesStatus &&
			matchesTrending
		);
	});

	const totalItems = filteredBalvidhyas.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedBalvidhyas = filteredBalvidhyas.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	if (currentPage > totalPages) setCurrentPage(1);

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
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
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
					<ReligiousCategoryFilter
						value={religiousFilter}
						onChange={(val) => {
							setReligiousFilter(val);
							setCurrentPage(1);
						}}
						page="admin-balvidhya"
						variant="select" hideLabel allLabel="All Traditions" className="w-44"
					/>
					<div className="w-32">
						<Select
							value={typeFilter}
							onValueChange={(val) => {
								setTypeFilter(val);
								setCurrentPage(1);
							}}
						>
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
						<Select
							value={categoryFilter}
							onValueChange={(val) => {
								setCategoryFilter(val);
								setCurrentPage(1);
							}}
						>
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
						<Select
							value={statusFilter}
							onValueChange={(val) => {
								setStatusFilter(val);
								setCurrentPage(1);
							}}
						>
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
						<Select
							value={trendingFilter}
							onValueChange={(val) => {
								setTrendingFilter(val);
								setCurrentPage(1);
							}}
						>
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
					{totalItems} item
					{totalItems !== 1 ? "s" : ""} found
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
							<TableHead>Religion</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Trending</TableHead>
							<TableHead>Date Added</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedBalvidhyas.length > 0 ? (
							paginatedBalvidhyas.map((balvidhya) => (
								<TableRow key={balvidhya.id}>
									<TableCell>
										{balvidhya.thumbnailUrl ? (
											<Image
												src={balvidhya.thumbnailUrl}
												alt={balvidhya.name}
												width={64}
												height={40}
												className="w-16 h-10 object-cover rounded"
												style={{ maxWidth: 64, maxHeight: 40 }}
												unoptimized={true}
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
											{categoryLabel(balvidhya.category)}
										</span>
									</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={balvidhya.religiousCategories}
										/>
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
														Status
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
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
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
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
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
								<TableCell colSpan={11} className="text-center py-6">
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
