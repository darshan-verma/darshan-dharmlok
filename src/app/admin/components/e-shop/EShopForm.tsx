"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Product } from "./EShopTable";

interface EshopFormProps {
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

export default function EshopForm({
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
}: EshopFormProps) {
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
	const [isAddingCategory, setIsAddingCategory] = useState(false);
	const [newCategory, setNewCategory] = useState("");
	const [isCategoryLoading, setIsCategoryLoading] = useState(false);

	// Fetch categories from API on mount
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
				setCategories([
					"Spiritual",
					"Books",
					"Accessories",
					"Clothing",
					"Food",
					"Other",
				]);
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
			errors.category = "At least one category is required";
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
				// Set the new category as the selected one
				handleInputChange("category", [trimmed]);
			}
		} catch {
			// handle error if needed
		}
		setNewCategory("");
		setIsAddingCategory(false);
	};

	const handleSelectCategory = (value: string) => {
		// Replace the category array with the single selected value
		handleInputChange("category", [value]);
	};

	const handleRemoveCategory = () => {
		// Clear the category selection
		handleInputChange("category", []);
	};

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
				{isAddingCategory ? (
					<div className="flex gap-2">
						<Input
							id="newCategory"
							value={newCategory}
							onChange={(e) => setNewCategory(e.target.value)}
							placeholder="Enter new category"
							autoFocus
							className={formErrors.category ? "border-red-500" : ""}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddCategory();
								}
								if (e.key === "Escape") {
									setIsAddingCategory(false);
									setNewCategory("");
								}
							}}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={handleAddCategory}
							disabled={!newCategory.trim()}
						>
							Add
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setIsAddingCategory(false);
								setNewCategory("");
							}}
						>
							Cancel
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Select
							value={productData.category[0] || ""}
							onValueChange={handleSelectCategory}
						>
							<SelectTrigger
								id="category"
								className={formErrors.category ? "border-red-500" : ""}
							>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsAddingCategory(true)}
						>
							Add New
						</Button>
					</div>
				)}
				<div className="flex flex-wrap gap-2 mt-2">
					{productData.category.length > 0 && (
						<div
							key={productData.category[0]}
							className="flex items-center bg-gray-100 rounded px-2 py-1"
						>
							<span>{productData.category[0]}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="ml-1"
								onClick={handleRemoveCategory}
								title="Remove from product"
							>
								×
							</Button>
						</div>
					)}
				</div>
				{formErrors.category && (
					<p className="text-sm text-red-500">{formErrors.category}</p>
				)}
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
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Product"}
				</Button>
			</div>
		</div>
	);
}
