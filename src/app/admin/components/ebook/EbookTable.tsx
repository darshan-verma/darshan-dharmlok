"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
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
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import {
	matchesReligiousFilter,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

// Ebook interface
export interface Ebook {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	religiousCategories?: ReligiousCategory[];
	detail: string;
	status: string;
}

interface EbookTableProps {
	ebooks: Ebook[];
	setEbooks: React.Dispatch<React.SetStateAction<Ebook[]>>;
	onAddEbook?: () => void;
	onEditEbook: (ebook: Ebook) => void;
	onDeleteEbook: (id: string, title: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewEbook: (ebook: Ebook) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export default function EbookTable({
	ebooks,
	// setEbooks,
	onAddEbook,
	onEditEbook,
	onDeleteEbook,
	onUpdateStatus,
	onViewEbook,
}: EbookTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const filteredEbooks = ebooks.filter((ebook) => {
		const matchesSearch =
			ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ebook.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ebook.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ebook.type.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || ebook.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || ebook.category === categoryFilter;

		const matchesReligious = matchesReligiousFilter(
			resolveReligiousCategories(ebook),
			religiousFilter === "all" ? null : religiousFilter
		);

		const matchesType = typeFilter === "all" || ebook.type === typeFilter;

		return (
			matchesSearch &&
			matchesStatus &&
			matchesCategory &&
			matchesReligious &&
			matchesType
		);
	});

	// Unique categories/types for filters
	const uniqueCategories = Array.from(new Set(ebooks.map((e) => e.category)));
	const uniqueTypes = Array.from(new Set(ebooks.map((e) => e.type)));

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search ebooks..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Ebook Button */}
					{onAddEbook && (
						<Button onClick={onAddEbook} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Ebook
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<ReligiousCategoryFilter
						value={religiousFilter}
						onChange={setReligiousFilter}
						page="admin-ebook"
						variant="select" hideLabel allLabel="All Traditions" className="w-44"
					/>
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
					{filteredEbooks.length} ebook
					{filteredEbooks.length !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Religion</TableHead>
							<TableHead>Detail</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredEbooks.length > 0 ? (
							filteredEbooks.map((ebook) => (
								<TableRow key={ebook.id}>
									<TableCell className="font-medium">{ebook.title}</TableCell>
									<TableCell>{ebook.date}</TableCell>
									<TableCell>{ebook.description}</TableCell>
									<TableCell>{ebook.type}</TableCell>
									<TableCell>{ebook.category}</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={ebook.religiousCategories}
										/>
									</TableCell>
									<TableCell>{ebook.detail}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												ebook.status
											)}`}
										>
											{ebook.status}
										</span>
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewEbook(ebook)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
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
												<DropdownMenuLabel>Manage Ebook</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(ebook.id, "Active")}
															className={
																ebook.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(ebook.id, "Inactive")
															}
															className={
																ebook.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditEbook(ebook)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteEbook(ebook.id, ebook.title);
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
									No ebooks found. Try a different search or add a new ebook.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
