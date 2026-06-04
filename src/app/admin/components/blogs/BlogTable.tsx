// NOTE: If you use <DialogContent> in this file, add aria-describedby={undefined} to it to resolve the warning.
// Example:
// <DialogContent aria-describedby={undefined}>...</DialogContent>
"use client";

import { useState } from "react";
import Pagination from "../Pagination/Pagination";
import {
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
import React from "react";
import { formatAdminDate } from "@/lib/utils";

// Blog interface
export interface Blog {
	id: string;
	title: string;
	content: string;
	coverImage?: string;
	bannerImage?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

interface BlogTableProps {
	blogs: Blog[];
	setBlogs: React.Dispatch<React.SetStateAction<Blog[]>>;
	onAddBlog?: () => void;
	onEditBlog: (blog: Blog) => void;
	onDeleteBlog: (id: string, title: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

// Helper function to extract plain text from BlockNote JSON
const extractPlainTextFromBlockNote = (content: string): string => {
	// Define proper types for BlockNote content
	interface BlockNoteTextItem {
		text: string;
		[key: string]: unknown;
	}

	interface BlockNoteBlock {
		type: string;
		content?: BlockNoteTextItem[];
		[key: string]: unknown;
	}

	try {
		const blocks: BlockNoteBlock[] = JSON.parse(content);
		if (!Array.isArray(blocks)) return "";

		return (
			blocks
				.map((block: BlockNoteBlock) => {
					if (block.type === "paragraph" && block.content) {
						return block.content
							.map((item: BlockNoteTextItem) => item.text || "")
							.join("");
					}
					return "";
				})
				.filter((text: string) => text.trim())
				.join(" ")
				.substring(0, 100) + "..."
		);
	} catch {
		return content.substring(0, 100) + "...";
	}
};

export default function BlogTable({
	blogs,
	onAddBlog,
	onEditBlog,
	onDeleteBlog,
	onUpdateStatus,
}: BlogTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredBlogs = blogs.filter((blog) => {
		const matchesSearch =
			blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			blog.content.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || blog.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Pagination logic
	const totalItems = filteredBlogs.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedBlogs = filteredBlogs.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to first page if filters/search change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, statusFilter]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Input
							type="search"
							placeholder="Search blogs..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<span className="absolute left-2.5 top-2.5 text-gray-500">
							<ImageIcon className="h-4 w-4" />
						</span>
					</div>
					{/* Add Blog Button */}
					{onAddBlog && (
						<Button onClick={onAddBlog} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Blog
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
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
					{filteredBlogs.length} blog
					{filteredBlogs.length !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Cover Image</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Content</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedBlogs.length > 0 ? (
							paginatedBlogs.map((blog) => (
								<TableRow key={blog.id}>
									<TableCell>
										{blog.coverImage ? (
											<Image
												src={blog.coverImage}
												alt={blog.title}
												width={60}
												height={40}
												className="rounded object-cover"
												style={{ width: "auto", height: "auto" }}
											/>
										) : (
											<ImageIcon className="h-8 w-8 text-gray-400" />
										)}
									</TableCell>
									<TableCell className="font-medium">{blog.title}</TableCell>
									<TableCell className="max-w-xs truncate">
										{extractPlainTextFromBlockNote(blog.content)}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												blog.status
											)}`}
										>
											{blog.status}
										</span>
									</TableCell>
									<TableCell>{formatAdminDate(blog.createdAt)}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Blog</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(blog.id, "Active")}
															className={
																blog.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(blog.id, "Inactive")
															}
															className={
																blog.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditBlog(blog)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteBlog(blog.id, blog.title);
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
								<TableCell colSpan={6} className="text-center py-6">
									No blogs found. Try a different search or add a new blog.
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
