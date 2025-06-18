"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import EshopTable, { Product } from "../components/e-shop/EShopTable";
import EshopForm from "../components/e-shop/EShopForm";

export default function EShopPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch products on mount
	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/e-shop");
				if (!response.ok) throw new Error("Failed to fetch products");
				const data = await response.json();
				setProducts(data);
			} catch {
				toast.error("Failed to load products");
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, []);

	const handleAddProduct = () => {
		setCurrentProduct(null);
		setIsFormOpen(true);
	};

	const handleEditProduct = (product: Product) => {
		setCurrentProduct(product);
		setIsFormOpen(true);
	};

	const handleDeleteProduct = (id: string, name: string) => {
		setProductToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!productToDelete) return;
		try {
			const response = await fetch(`/api/e-shop/${productToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error();
			setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
			toast.success(`${productToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete product");
		} finally {
			setIsDeleteDialogOpen(false);
			setProductToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/e-shop/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setProducts((prev) =>
				prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewProduct = (product: Product) => {
		window.location.href = `/admin/e-shop/${product.id}`;
	};

	const handleFormSubmit = async (data: Omit<Product, "id">) => {
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: Product;
			if (currentProduct && currentProduct.id) {
				response = await fetch(`/api/e-shop/${currentProduct.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setProducts((prev) =>
					prev.map((p) => (p.id === currentProduct.id ? saved : p))
				);
				toast.success("Product updated");
			} else {
				response = await fetch("/api/e-shop", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setProducts((prev) => [saved, ...prev]);
				toast.success("Product added");
			}
			setIsFormOpen(false);
			setCurrentProduct(null);
		} catch {
			toast.error("Failed to save product");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">E-Shop Product Management</h1>
			<EshopTable
				products={products}
				setProducts={setProducts}
				onAddProduct={handleAddProduct}
				onEditProduct={handleEditProduct}
				onDeleteProduct={handleDeleteProduct}
				onUpdateStatus={handleUpdateStatus}
				onViewProduct={handleViewProduct}
			/>
			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentProduct?.id ? "Edit Product" : "Add New Product"}
						</DialogTitle>
					</DialogHeader>
					<EshopForm
						initialData={currentProduct || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {productToDelete?.name}? This
							action cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<button
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							onClick={confirmDelete}
						>
							Delete
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
