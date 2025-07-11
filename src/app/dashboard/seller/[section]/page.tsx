"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import RouteProtection from "../../components/route-protection";
import Sidebar from "../../components/sidebar";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ProductTable from "../../components/product-table";
import SellerDashboard from "../../components/seller-dashboard";
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

export default function SellerSectionPage() {
	const { data: session, status: sessionStatus } = useSession();
	const params = useParams();
	const section = Array.isArray(params.section)
		? params.section[0]
		: params.section;
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!session?.user?.id) return;
		if (section === "products") {
			const fetchProducts = async () => {
				setLoading(true);
				try {
					const res = await fetch("/api/e-shop?mine=true", {
						credentials: "include",
					});
					const data = await res.json();
					setProducts(data);
				} catch {
					setProducts([]);
				}
				setLoading(false);
			};
			fetchProducts();
		}
	}, [session?.user?.id, section]);

	if (sessionStatus === "loading") {
		return <LoadingState message="Loading session..." />;
	}

	if (!session?.user?.id) {
		return <LoadingState message="User not found." />;
	}

	let content = null;
	if (section === "dashboard") {
		content = <SellerDashboard />;
	} else if (section === "products") {
		content = <ProductTable products={products} setProducts={setProducts} />;
	} else {
		content = (
			<div className="text-center mt-8">
				Select a valid section from the sidebar.
			</div>
		);
	}

	return (
		<RouteProtection requiredRole="seller">
			<div className="flex bg-muted/40 w-full min-h-screen">
				<Sidebar userType={session?.user?.role?.toLowerCase() || "seller"} />
				<SidebarInset className="p-4 sm:p-6 lg:p-8">
					{loading && section === "products" ? (
						<LoadingState message="Loading products..." />
					) : (
						content
					)}
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
