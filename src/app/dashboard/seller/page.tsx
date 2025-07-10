"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import RouteProtection from "../components/route-protection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ImpersonationRestoreButton from "../components/ImpersonationRestoreButton";
import ProductForm from "../components/product-form";
import ProductTable from "../components/product-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Sidebar from "../components/sidebar";

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

const LoadingState = ({ message }: { message: string }) => (
	<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
		<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
		<p className="text-lg text-muted-foreground">{message}</p>
	</div>
);

export default function SellerDashboardPage() {
	const { data: session, status: sessionStatus } = useSession();
	const [products, setProducts] = useState<Product[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sessionStatus !== "authenticated" || !session?.user?.id) {
			if (sessionStatus !== "loading") {
				setLoading(false);
			}
			return;
		}
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/e-shop?mine=true");
				if (!res.ok) throw new Error("Failed to fetch products");
				const data = await res.json();
				setProducts(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error fetching products"
				);
				setProducts([]);
			}
			setLoading(false);
		};
		fetchProducts();
	}, [session, sessionStatus]);

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

	const isAdmin = session?.user?.role?.toLowerCase() === "admin";

	if (sessionStatus === "loading") {
		return <LoadingState message="Loading session..." />;
	}

	if (sessionStatus === "authenticated" && loading) {
		return <LoadingState message="Loading products..." />;
	}

	if (error && session?.user) {
		console.warn("Using fallback with session data due to error:", error);
	} else if (error && !session?.user) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)] p-4">
				<Alert variant="destructive" className="max-w-md">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Error Loading Data</AlertTitle>
					<AlertDescription>
						{error}
						<div className="mt-4">
							<Button onClick={() => window.location.reload()}>Retry</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<RouteProtection requiredRole="seller">
			{isAdmin ? (
				<div className="fixed inset-0 flex items-center justify-center bg-muted/40 z-50">
					<div className="flex flex-col items-center justify-center gap-4 p-6 border rounded-lg bg-background shadow-sm">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-6 w-6 text-yellow-500" />
							<span className="text-lg font-semibold text-primary">
								Admin View
							</span>
						</div>
						<p className="text-muted-foreground text-center max-w-md">
							You are viewing the Seller dashboard as an{" "}
							<span className="font-medium">admin</span>.<br />
							User-specific data may not be available.
						</p>
						<ImpersonationRestoreButton />
					</div>
				</div>
			) : (
				<div className="flex bg-muted/40 min-h-screen">
					<Sidebar userType={session?.user?.role?.toLowerCase() || "seller"} />
					<main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
						<div className="mt-8">
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
				</div>
			)}
		</RouteProtection>
	);
}
