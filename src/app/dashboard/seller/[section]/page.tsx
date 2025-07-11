"use client";
import { useEffect, useState } from "react";
import ProductTable from "../../components/product-table";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
	const router = useRouter();
	const [products, setProducts] = useState<Product[]>([]);

	// Redirect to /dashboard/seller/products if accessed /dashboard/seller or /dashboard/seller/
	useEffect(() => {
		// If this page is loaded at /dashboard/seller/[section], but [section] is undefined or 'products', redirect to /dashboard/seller/products
		const path = window.location.pathname;
		if (path === "/dashboard/seller" || path === "/dashboard/seller/products") {
			// Already at correct path, do nothing
			return;
		}
		// If this is the default section page, redirect to products
		if (path === "/dashboard/seller" || path === "/dashboard/seller/") {
			router.replace("/dashboard/seller/products");
		}
	}, [router]);

	// Fetch seller's products on mount
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const res = await fetch("/api/e-shop?mine=true", {
					credentials: "include",
				});
				const data = await res.json();
				setProducts(data);
			} catch {
				setProducts([]);
			}
		};
		fetchProducts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session]);

	return (
		<main className="min-h-screen w-full overflow-x-auto p-4 sm:p-6 lg:p-8">
			<div className="mt-8 w-full">
				<h1 className="text-2xl font-bold mb-6">My Products</h1>
				<ProductTable products={products} setProducts={setProducts} />
			</div>
		</main>
	);
}
