"use client";
import { useEffect, useState } from "react";
import ProductForm from "../../components/product-form";
import ProductTable from "../../components/product-table";
import { useSession } from "next-auth/react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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

export default function SellerSectionPage() {
	const { data: session } = useSession();
	const [products, setProducts] = useState<Product[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(false);

	// Fetch seller's products on mount
	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/e-shop?mine=true");
				const data = await res.json();
				setProducts(data);
			} catch {
				setProducts([]);
			}
			setLoading(false);
		};
		fetchProducts();
	}, []);

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
		await fetch(`/api/e-shop/${id}`, { method: "DELETE" });
		setProducts((prev) => prev.filter((p) => p.id !== id));
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		await fetch(`/api/e-shop/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: newStatus }),
		});
		setProducts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
		);
	};

	const handleViewProduct = (product: Product) => {
		alert(JSON.stringify(product, null, 2));
	};

	const handleFormSubmit = async (productData: Omit<Product, "id">) => {
		if (editingProduct) {
			// Edit
			await fetch(`/api/e-shop/${editingProduct.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
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
				body: JSON.stringify(productData),
			});
			const newProduct = await res.json();
			setProducts((prev) => [newProduct, ...prev]);
		}
		setShowForm(false);
		setEditingProduct(null);
	};

	// This page renders the product management UI for sellers in a given section
	// You can add logic to determine the section if needed, or pass it as a prop
	return (
		<main className="min-h-screen w-full overflow-x-auto p-4 sm:p-6 lg:p-8">
			<div className="mt-8 w-full">
				<h1 className="text-2xl font-bold mb-6">My Products</h1>
				<ProductTable
					products={products}
					setProducts={setProducts}
					onAddProduct={handleAddProduct}
					onEditProduct={handleEditProduct}
					onDeleteProduct={handleDeleteProduct}
					onUpdateStatus={handleUpdateStatus}
					onViewProduct={handleViewProduct}
				/>
				{/* Form Dialog for Add/Edit Product */}
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
			</div>
		</main>
	);
}
