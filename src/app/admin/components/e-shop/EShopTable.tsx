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
	type ReligiousCategory,
} from "@/lib/religious-categories";

// Product interface
export interface Product {
	id: string;
	name: string;
	date: string;
	category: string[]; // changed from string to string[]
	religiousCategories?: ReligiousCategory[];
	pricePerUnit: number;
	availableQty: number;
	detail?: string;
	images?: string[];
	videos?: string[];
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

interface EshopTableProps {
	products: Product[];
	setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
	onAddProduct?: () => void;
	onEditProduct: (product: Product) => void;
	onDeleteProduct: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewProduct: (product: Product) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

// Helper for formatting date
const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

import Pagination from "../Pagination/Pagination";

export default function EshopTable({
	products,
	onAddProduct,
	onEditProduct,
	onDeleteProduct,
	onUpdateStatus,
	onViewProduct,
}: EshopTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.category
				.join(", ")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(product.detail || "").toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || product.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || product.category.includes(categoryFilter);

		const matchesReligious = matchesReligiousFilter(
			product.religiousCategories,
			religiousFilter === "all" ? null : religiousFilter
		);

		return matchesSearch && matchesStatus && matchesCategory && matchesReligious;
	});

	const totalItems = filteredProducts.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedProducts = filteredProducts.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const uniqueCategories = Array.from(
		new Set(products.flatMap((p) => p.category))
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search products..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Product Button */}
					{onAddProduct && (
						<Button onClick={onAddProduct} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Product
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<ReligiousCategoryFilter
						value={religiousFilter}
						onChange={setReligiousFilter}
						page="admin-e-shop"
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
					{totalItems} product
					{totalItems !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Religion</TableHead>
							<TableHead>Price per Unit</TableHead>
							<TableHead>Available Quantity</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedProducts.length > 0 ? (
							paginatedProducts.map((product) => (
								<TableRow key={product.id}>
									<TableCell className="font-medium">{product.name}</TableCell>
									<TableCell>{formatDate(product.date)}</TableCell>
									<TableCell>{product.category.join(", ")}</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={product.religiousCategories}
										/>
									</TableCell>
									<TableCell>
										₹{product.pricePerUnit.toLocaleString("en-IN")}
									</TableCell>
									<TableCell>{product.availableQty}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewProduct(product)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												product.status
											)}`}
										>
											{product.status}
										</span>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Product</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(product.id, "Active")
															}
															className={
																product.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(product.id, "Inactive")
															}
															className={
																product.status === "Inactive"
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
													onClick={() => onEditProduct(product)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteProduct(product.id, product.name);
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
									No products found. Try a different search or add a new
									product.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
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
