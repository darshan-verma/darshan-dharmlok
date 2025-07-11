"use client";
import { useState } from "react";
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
	Search,
	Eye,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	PlusCircle,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "./product-form";

interface Product {
	id: string;
	name: string;
	date: string;
	category: string[];
	pricePerUnit: number;
	availableQty: number;
	detail?: string;
	status: string;
}

interface ProductTableProps {
	products: Product[];
	setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-red-800";

const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export default function ProductTable({
	products,
	setProducts,
}: ProductTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			(product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.category
				.join(", ")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(product.detail || "").toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || product.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || product.category.includes(categoryFilter);

		return matchesSearch && matchesStatus && matchesCategory;
	});

	const uniqueCategories = Array.from(
		new Set(products.flatMap((p) => p.category))
	);

	const handleAddProduct = () => {
		setEditingProduct(null);
		setShowForm(true);
	};

	const handleEditProduct = (product: Product) => {
		setEditingProduct(product);
		setShowForm(true);
	};

	const handleDeleteProduct = async (id: string, name: string) => {
		if (!confirm(`Delete product '${name}'?`)) return;
		await fetch(`/api/e-shop/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
		setProducts((prev) => prev.filter((p) => p.id !== id));
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		await fetch(`/api/e-shop/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ status: newStatus }),
		});
		setProducts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
		);
	};

	const handleFormSubmit = async (productData: Omit<Product, "id">) => {
		if (editingProduct) {
			// Edit
			await fetch(`/api/e-shop/${editingProduct.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(productData),
			});
			setProducts((prev) =>
				prev.map((p) =>
					p.id === editingProduct.id ? { ...p, ...productData } : p
				)
			);
		} else {
			// Add
			const res = await fetch("/api/e-shop", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(productData),
			});
			const newProduct = await res.json();
			setProducts((prev) => [newProduct, ...prev]);
		}
		setShowForm(false);
		setEditingProduct(null);
	};

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
					<Button onClick={handleAddProduct} className="w-full sm:w-auto">
						<PlusCircle className="h-4 w-4 mr-2" />
						Add Product
					</Button>
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
					{filteredProducts.length} product
					{filteredProducts.length !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Price per Unit</TableHead>
							<TableHead>Available Quantity</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredProducts.length > 0 ? (
							filteredProducts.map((product) => (
								<TableRow key={product.id || Math.random()}>
									<TableCell className="font-medium">
										{product.name || ""}
									</TableCell>
									<TableCell>{formatDate(product.date || "")}</TableCell>
									<TableCell>{(product.category || []).join(", ")}</TableCell>
									<TableCell>
										₹{(product.pricePerUnit ?? 0).toLocaleString("en-IN")}
									</TableCell>
									<TableCell>{product.availableQty ?? 0}</TableCell>
									<TableCell>
										<Button asChild variant="ghost" size="sm">
											<a href={`/dashboard/seller/products/${product.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												product.status || ""
											)}`}
										>
											{product.status || ""}
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
																handleUpdateStatus(product.id, "Active")
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
																handleUpdateStatus(product.id, "Inactive")
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
													onClick={() => handleEditProduct(product)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														handleDeleteProduct(product.id, product.name);
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
								<TableCell colSpan={8} className="text-center py-6">
									No products found. Try a different search or add a new
									product.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* Form Dialog for Add/Edit Product */}
			{showForm && (
				<Dialog open={showForm} onOpenChange={setShowForm}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>
								{editingProduct ? "Edit Product" : "Add New Product"}
							</DialogTitle>
						</DialogHeader>
						<ProductForm
							initialData={editingProduct || undefined}
							onSubmit={handleFormSubmit}
							onCancel={() => {
								setShowForm(false);
								setEditingProduct(null);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
