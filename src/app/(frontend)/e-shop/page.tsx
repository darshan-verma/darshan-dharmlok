"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";

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

      {/* Banner */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/services/e-shop.jpg"
            alt="E-Shop Banner"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/landing-page/amritsar-6185143.jpg";
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl">
              E-Shop
            </h1>
            <p
              className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light"
              style={{ fontFamily: "var(--font-jost), sans-serif" }}
            >
              Discover authentic spiritual products, pooja items, and sacred
              artifacts
            </p>
          </div>
        </div>
      </section>

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
