"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import RouteProtection from "../components/route-protection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ImpersonationRestoreButton from "../components/ImpersonationRestoreButton";
import ProductTable from "../components/product-table";
import Sidebar from "../components/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

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
				<div className="flex bg-muted/40 min-h-screen w-full">
					<Sidebar userType={session?.user?.role?.toLowerCase() || "seller"} />
					<SidebarInset className="p-4 sm:p-6 lg:p-8">
						<div className="mt-8">
							<h1 className="text-2xl font-bold mb-6">My Products</h1>
							<ProductTable products={products} setProducts={setProducts} />
						</div>
					</SidebarInset>
				</div>
			)}
		</RouteProtection>
	);
}
