"use client";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";

interface Product {
	id?: string;
	name: string;
	date: string;
	category: string[];
	pricePerUnit: number;
	availableQty: number;
	detail?: string;
	status: string;
}

interface ProductFormProps {
	initialData?: Partial<Product>;
	onSubmit: (productData: Omit<Product, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

const defaultCategories = [
	"Spiritual",
	"Books",
	"Accessories",
	"Clothing",
	"Food",
	"Other",
];

const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export default function ProductForm({
	initialData = {
		name: "",
		date: "",
		category: [],
		pricePerUnit: 0,
		availableQty: 0,
		detail: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: ProductFormProps) {
	const [productData, setProductData] = useState<Omit<Product, "id">>({
		name: initialData.name || "",
		date: initialData.date || "",
		category: Array.isArray(initialData.category) ? initialData.category : [],
		pricePerUnit: initialData.pricePerUnit ?? 0,
		availableQty: initialData.availableQty ?? 0,
		detail: initialData.detail || "",
		status: initialData.status || "Active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [categories, setCategories] = useState<string[]>([]);
	const [newCategory, setNewCategory] = useState("");
	const [isCategoryLoading, setIsCategoryLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
	const selectTriggerRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		const fetchCategories = async () => {
			setIsCategoryLoading(true);
			try {
				const res = await fetch("/api/categories");
				const data = await res.json();
				if (Array.isArray(data)) {
					setCategories(data);
				}
			} catch {
				setCategories(defaultCategories);
			}
			setIsCategoryLoading(false);
		};
		fetchCategories();
	}, []);

	const validateForm = (data: typeof productData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Product name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (
			!data.category ||
			!Array.isArray(data.category) ||
			data.category.length === 0
		)
			errors.category = "Category is required";
		if (
			data.pricePerUnit === undefined ||
			isNaN(Number(data.pricePerUnit)) ||
			Number(data.pricePerUnit) < 0
		)
			errors.pricePerUnit = "Price per unit is required and must be >= 0";
		if (
			data.availableQty === undefined ||
			isNaN(Number(data.availableQty)) ||
			Number(data.availableQty) < 0
		)
			errors.availableQty = "Available quantity is required and must be >= 0";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(productData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(productData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof productData,
		value: string | number | string[]
	) => {
		setProductData({ ...productData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleAddCategory = async () => {
		const trimmed = newCategory.trim();
		if (!trimmed) return;
		try {
			const res = await fetch("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
			});
			if (res.ok) {
				const updated = await res.json();
				setCategories(updated);
				setNewCategory("");
			}
		} catch {
			// handle error if needed
		}
	};

	const handleDeleteCategory = async (categoryToDelete: string) => {
		setCategoryToDelete(categoryToDelete);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteCategory = async () => {
		if (!categoryToDelete) return;
		try {
			const res = await fetch("/api/categories", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: categoryToDelete }),
			});
			if (res.ok) {
				const updatedCategories = await res.json();
				setCategories(updatedCategories);
				if (productData.category[0] === categoryToDelete) {
					handleInputChange("category", []);
				}
			} else {
				const { error } = await res.json();
				alert(`Error: ${error}`);
			}
		} catch (error) {
			console.error("Failed to delete category:", error);
			alert("An unexpected error occurred while deleting the category.");
		}
		setDeleteDialogOpen(false);
		setCategoryToDelete(null);
	};

	const cancelDeleteCategory = () => {
		setDeleteDialogOpen(false);
		setCategoryToDelete(null);
	};

	const handleRemoveCategory = () => {
		handleInputChange("category", []);
	};

	const handleCategorySelect = (value: string) => {
		handleInputChange("category", [value]);
		setTimeout(() => {
			selectTriggerRef.current?.blur();
		}, 0);
	};

	const uniqueCategories = Array.from(new Set(categories));

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Product Name *</Label>
				<Input
					id="name"
					value={productData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter product name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={productData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="category">Category *</Label>
				<div className="flex flex-col gap-2">
					<div className="flex gap-2 items-center">
						<Select
							value={
								typeof productData.category[0] === "string"
									? productData.category[0]
									: ""
							}
							onValueChange={handleCategorySelect}
						>
							<SelectTrigger
								id="category"
								ref={selectTriggerRef}
								className={`min-w-[200px] ${
									formErrors.category ? "border-red-500" : ""
								}`}
							>
								<SelectValue
									placeholder="Select category"
									className={
										productData.category[0]
											? "text-xs"
											: "text-xs text-gray-400"
									}
								>
									{productData.category[0] || "Select category"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{uniqueCategories.length === 0 && (
									<div className="px-4 py-2 text-gray-400 text-xs">
										No categories
									</div>
								)}
								{uniqueCategories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							id="newCategory"
							value={newCategory}
							onChange={(e) => setNewCategory(e.target.value)}
							placeholder="Add new category"
							disabled={isCategoryLoading}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddCategory();
								}
							}}
							className="w-40"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={handleAddCategory}
							disabled={!newCategory.trim() || isCategoryLoading}
						>
							Add
						</Button>
					</div>
					{formErrors.category && (
						<p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
					)}
					{productData.category.length > 0 && (
						<div className="flex items-center mt-2">
							<span className="mr-2 font-semibold text-gray-600">
								Selected:
							</span>
							<span className="bg-blue-100 border border-blue-400 rounded px-2 py-1 mr-2 text-blue-800 text-xs">
								{productData.category[0]}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleRemoveCategory}
								title="Remove selected category"
								className="text-gray-500 hover:text-red-500"
							>
								×
							</Button>
						</div>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="pricePerUnit">Price per Unit (₹) *</Label>
				<Input
					id="pricePerUnit"
					type="number"
					min={0}
					step="any"
					value={productData.pricePerUnit}
					onChange={(e) =>
						handleInputChange("pricePerUnit", Number(e.target.value))
					}
					placeholder="Enter price per unit"
					className={formErrors.pricePerUnit ? "border-red-500" : ""}
				/>
				{formErrors.pricePerUnit && (
					<p className="text-sm text-red-500">{formErrors.pricePerUnit}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="availableQty">Available Quantity *</Label>
				<Input
					id="availableQty"
					type="number"
					min={0}
					step={1}
					value={productData.availableQty}
					onChange={(e) =>
						handleInputChange("availableQty", Number(e.target.value))
					}
					placeholder="Enter available quantity"
					className={formErrors.availableQty ? "border-red-500" : ""}
				/>
				{formErrors.availableQty && (
					<p className="text-sm text-red-500">{formErrors.availableQty}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={productData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger
						id="status"
						className={formErrors.status ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{statusOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.status && (
					<p className="text-sm text-red-500">{formErrors.status}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="detail">Details</Label>
				<Input
					id="detail"
					value={productData.detail}
					onChange={(e) => handleInputChange("detail", e.target.value)}
					placeholder="Enter product details (optional)"
				/>
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Product"}
				</Button>
			</div>

			{/* Confirmation Dialog for Delete */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Category</DialogTitle>
						<DialogDescription>
							Are you sure you want to permanently delete the category{" "}
							{categoryToDelete}?
							<br />
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={cancelDeleteCategory}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDeleteCategory}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
