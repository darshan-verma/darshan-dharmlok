// NOTE: If you use <DialogContent> in this file, add aria-describedby={undefined} to it to resolve the warning.
// Example:
// <DialogContent aria-describedby={undefined}>...</DialogContent>
"use client";

import { useState } from "react";
import Pagination from "../Pagination/Pagination";
import {
	Eye,
	Edit,
	Trash2,
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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { BANNER_PAGE_SLUGS } from "@/lib/banner-pages";

// Banner interface
export interface Banner {
	id: string;
	title: string;
	date: string;
	description: string;
	imageUrl?: string;
	pageSlug?: string;
}

interface BannerTableProps {
	banners: Banner[];
	setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
	onAddBanner?: () => void;
	onEditBanner: (banner: Banner) => void;
	onDeleteBanner: (id: string, title: string) => void;
	onUpdateStatus?: (id: string, newStatus: string) => Promise<void>;
	onViewBanner: (banner: Banner) => void;
}

export default function BannerTable({
	banners,
	onAddBanner,
	onEditBanner,
	onDeleteBanner,
	onUpdateStatus: _onUpdateStatus,
}: // onViewBanner,
BannerTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSlugFilter, setPageSlugFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredBanners = banners.filter((banner) => {
		const matchesSearch =
			banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			banner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(banner.pageSlug ?? "").toLowerCase().includes(searchTerm.toLowerCase());

		const matchesPage =
			pageSlugFilter === "all" ||
			(banner.pageSlug ?? "") === pageSlugFilter;

		return matchesSearch && matchesPage;
	});

	// Pagination logic
	const totalItems = filteredBanners.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedBanners = filteredBanners.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to first page if filters/search change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, pageSlugFilter]);

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
				{/* Page Filter */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<div className="w-44">
						<select
							className="h-8 border rounded px-2 w-full"
							value={pageSlugFilter}
							onChange={(e) => setPageSlugFilter(e.target.value)}
						>
							<option value="all">All Pages</option>
							{BANNER_PAGE_SLUGS.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
							<option value="">No page</option>
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
							<TableHead>Page</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedBanners.length > 0 ? (
							paginatedBanners.map((banner) => (
								// ...existing code for TableRow...
								<TableRow key={banner.id}>
									{/* ...existing code for TableCell... */}
									<TableCell>
										{banner.imageUrl ? (
											<Image
												src={banner.imageUrl}
												alt={banner.title}
												width={60}
												height={40}
												className="rounded object-cover"
												style={{ width: "auto", height: "auto" }}
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
									<TableCell>
										{banner.pageSlug
											? BANNER_PAGE_SLUGS.find((p) => p.value === banner.pageSlug)
													?.label ?? banner.pageSlug
											: "—"}
									</TableCell>
									<TableCell className="max-w-xs truncate">
										{banner.description}
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
								<TableCell colSpan={7} className="text-center py-6">
									No banners found. Try a different search or add a new banner.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
}
