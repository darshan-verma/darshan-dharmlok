"use client";

import { useState } from "react";
import {
	Eye,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	PlusCircle,
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
import Image from "next/image";
import Link from "next/link";

// Banner interface
export interface Banner {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	imageUrl?: string;
}

interface BannerTableProps {
	banners: Banner[];
	setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
	onAddBanner?: () => void;
	onEditBanner: (banner: Banner) => void;
	onDeleteBanner: (id: string, title: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewBanner: (banner: Banner) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export default function BannerTable({
	banners,
	onAddBanner,
	onEditBanner,
	onDeleteBanner,
	onUpdateStatus,
	// onViewBanner,
}: BannerTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const filteredBanners = banners.filter((banner) => {
		const matchesSearch =
			banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			banner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			banner.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			banner.type.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || banner.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || banner.category === categoryFilter;

		const matchesType = typeFilter === "all" || banner.type === typeFilter;

		return matchesSearch && matchesStatus && matchesCategory && matchesType;
	});

	// Unique categories/types for filters
	const uniqueCategories = Array.from(new Set(banners.map((b) => b.category)));
	const uniqueTypes = Array.from(new Set(banners.map((b) => b.type)));

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Input
							type="search"
							placeholder="Search banners..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<span className="absolute left-2.5 top-2.5 text-gray-500">
							<ImageIcon className="h-4 w-4" />
						</span>
					</div>
					{/* Add Banner Button */}
					{onAddBanner && (
						<Button onClick={onAddBanner} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Banner
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* Category Filter */}
					<div className="w-40">
						<select
							className="h-8 border rounded px-2 w-full"
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
						>
							<option value="all">All Categories</option>
							{uniqueCategories.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>
					{/* Type Filter */}
					<div className="w-36">
						<select
							className="h-8 border rounded px-2 w-full"
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
						>
							<option value="all">All Types</option>
							{uniqueTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
					{/* Status Filter */}
					<div className="w-32">
						<select
							className="h-8 border rounded px-2 w-full"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="all">All Status</option>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredBanners.length} banner
					{filteredBanners.length !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Preview</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredBanners.length > 0 ? (
							filteredBanners.map((banner) => (
								<TableRow key={banner.id}>
									<TableCell>
										{banner.imageUrl ? (
											<Image
												src={banner.imageUrl}
												alt={banner.title}
												width={60}
												height={40}
												className="rounded object-cover"
											/>
										) : (
											<ImageIcon className="h-8 w-8 text-gray-400" />
										)}
									</TableCell>
									<TableCell className="font-medium">{banner.title}</TableCell>
									<TableCell>
										{banner.date
											? new Date(banner.date).toLocaleDateString("en-IN", {
													day: "2-digit",
													month: "short",
													year: "numeric",
											  })
											: ""}
									</TableCell>
									<TableCell className="max-w-xs truncate">
										{banner.description}
									</TableCell>
									<TableCell>{banner.category}</TableCell>
									<TableCell>{banner.type}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												banner.status
											)}`}
										>
											{banner.status}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/banner/${banner.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</Link>
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
												<DropdownMenuLabel>Manage Banner</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(banner.id, "Active")
															}
															className={
																banner.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(banner.id, "Inactive")
															}
															className={
																banner.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditBanner(banner)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteBanner(banner.id, banner.title);
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
								<TableCell colSpan={9} className="text-center py-6">
									No banners found. Try a different search or add a new banner.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
