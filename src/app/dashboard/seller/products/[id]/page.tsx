"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { ProductDetailCard } from "@/app/admin/components/e-shop/ProductDetailCard";
import { ProductInfoCard } from "@/app/admin/components/e-shop/ProductInfoCard";
import { Product } from "@/app/admin/components/e-shop/types";
import RouteProtection from "../../../components/route-protection";
import Sidebar from "../../../components/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export default function ProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const productId = params?.id as string;

	const [product, setProduct] = useState<Product | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedProduct, setEditedProduct] = useState<Product | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const response = await fetch(`/api/e-shop/${productId}`);
				if (!response.ok) throw new Error("Failed to fetch product");
				const data = await response.json();
				setProduct(data);
				setEditedProduct(data);
			} catch {
				router.push("/dashboard/seller/products");
			}
		};
		if (productId) fetchProduct();
	}, [productId, router]);

	useEffect(() => {
		// Fetch all categories for dropdown
		const fetchCategories = async () => {
			try {
				const response = await fetch("/api/categories");
				if (!response.ok) return;
				const data: string[] = await response.json();
				// Remove duplicates just in case
				const uniqueCategories = Array.from(new Set(data));
				setCategoryOptions(uniqueCategories);
			} catch {}
		};
		fetchCategories();
	}, []);

	const validateForm = (data: Product) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Product name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.category) errors.category = "Category is required";
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

	const handleSave = async () => {
		if (!editedProduct) return;
		const validation = validateForm(editedProduct);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const response = await fetch(`/api/e-shop/${productId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editedProduct),
			});
			if (!response.ok) throw new Error("Failed to update product");
			const updated = await response.json();
			setProduct(updated);
			setEditedProduct(updated);
			setIsEditing(false);
			toast.success("Product updated successfully!");
		} catch {
			toast.error("Failed to update product");
		} finally {
			setIsSaving(false);
		}
	};

	if (!product || !editedProduct) {
		return (
			<RouteProtection requiredRole="seller">
				<div className="flex bg-muted/40 w-full min-h-screen">
					<Sidebar userType={session?.user?.role?.toLowerCase() || "seller"} />
					<SidebarInset className="p-4 sm:p-6 lg:p-8">
						<div className="flex justify-center items-center h-40">
							Loading...
						</div>
					</SidebarInset>
				</div>
			</RouteProtection>
		);
	}

	return (
		<RouteProtection requiredRole="seller">
			<div className="flex bg-muted/40 w-full min-h-screen">
				<Sidebar userType={session?.user?.role?.toLowerCase() || "seller"} />
				<SidebarInset className="p-4 sm:p-6 lg:p-8">
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								size="icon"
								onClick={() => router.push("/dashboard/seller/products")}
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<h1 className="text-2xl font-bold">Product Details</h1>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<ProductDetailCard
								product={product}
								isEditing={isEditing}
								onEdit={() => setIsEditing(!isEditing)}
							/>
							<div className="md:col-span-2">
								<ProductInfoCard
									product={product}
									editedProduct={editedProduct}
									setEditedProduct={setEditedProduct}
									isEditing={isEditing}
									isSaving={isSaving}
									errors={errors}
									categoryOptions={categoryOptions}
									setCategoryOptions={setCategoryOptions}
									isUploadingImage={isUploadingImage}
									setIsUploadingImage={setIsUploadingImage}
									isUploadingVideo={isUploadingVideo}
									setIsUploadingVideo={setIsUploadingVideo}
									onSave={handleSave}
								/>
							</div>
						</div>
					</div>
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
