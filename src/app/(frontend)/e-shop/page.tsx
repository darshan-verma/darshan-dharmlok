"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";

interface EShopProduct {
  id: string;
  name: string;
  description: string;
  pricePerUnit: number;
  availableQty: number;
  images: string[];
  category: string[];
  status: string;
}

export default function EShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<EShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/e-shop");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const activeProducts = (data as EShopProduct[]).filter(
          (p) => p.status === "Active"
        );
        setProducts(activeProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <PageBanner
        pageSlug="e-shop"
        title="E-Shop"
        description="Discover authentic spiritual products, pooja items, and sacred artifacts"
        alt="E-Shop Banner"
      />

      {/* Product cards - pooja-style with Buy Now */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-full max-w-[380px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 rounded-3xl"
                >
                  <ProfileCard
                    variant="e-shop"
                    name={product.name}
                    description={product.description || "Spiritual product"}
                    price={product.pricePerUnit}
                    image={
                      product.images?.length
                        ? product.images[0]
                        : undefined
                    }
                    category={product.category?.[0]}
                    isVerified={product.status === "Active"}
                    onBook={() => router.push(`/e-shop/${product.id}`)}
                    enableAnimations={true}
                    className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
