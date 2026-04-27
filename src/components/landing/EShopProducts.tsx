"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { ProductRevealCard } from "@/components/ui/product-reveal-card";

interface EshopProduct {
  id: string;
  name: string;
  pricePerUnit: number;
  images: string[];
  category: string[];
  status: string;
  availableQty: number;
  description?: string;
  impressions?: number;
  impressionCount?: number;
  viewCount?: number;
  views?: number;
}

const FALLBACK_PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1612198525423-8c0f652c7f2d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1603272745224-1d3c8bcbf8f3?w=800&h=600&fit=crop",
];

export interface EShopProductsSectionProps {
  title?: string;
  description?: string;
}

export default function EShopProducts({
  title = "E-Shop Products",
  description = "Discover authentic spiritual products, pooja items, and sacred artifacts from our curated e-shop to enhance your spiritual practice.",
}: EShopProductsSectionProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<EshopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const MAX_TOP_PRODUCTS = 8;

  const getImpressionCount = (product: EshopProduct) =>
    Number(
      product.impressions ??
      product.impressionCount ??
      product.viewCount ??
      product.views ??
      0
    );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/e-shop");
        if (response.ok) {
          const data = await response.json();
          // Keep active products and prioritize those with the highest impressions.
          const activeProducts = data.filter((p: EshopProduct) => p.status === "Active");
          const topProducts = [...activeProducts]
            .sort((a, b) => getImpressionCount(b) - getImpressionCount(a))
            .slice(0, MAX_TOP_PRODUCTS);
          setProducts(topProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const productsPerPage = 4;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const displayedProducts = products.slice(
    currentIndex * productsPerPage,
    (currentIndex + 1) * productsPerPage
  );

  const formatPrice = (price: number) => `₹${Math.round(price)}`;

  const nextSlide = () => {
    if (totalPages > 0) {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }
  };

  const prevSlide = () => {
    if (totalPages > 0) {
      setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
    }
  };

  return (
    <>
      <style>{`
        .frosted-glass-card {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
        }
        .frosted-glass-card .product-image {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        /* Fix square background on circular navigation buttons */
        .navigation-button-wrapper {
          border-radius: 9999px !important;
          overflow: hidden !important;
        }
        .navigation-button-wrapper[data-slot="button"] {
          border-radius: 9999px !important;
          overflow: hidden !important;
        }
        /* Target all absolute positioned divs inside the button */
        .navigation-button-wrapper[data-slot="button"] > div.absolute {
          border-radius: 9999px !important;
        }
        /* Specifically target the rounded-md div that creates the square background */
        .navigation-button-wrapper[data-slot="button"] > div.absolute.rounded-md {
          border-radius: 9999px !important;
        }
        /* Ensure the backdrop filter div is also circular */
        .navigation-button-wrapper[data-slot="button"] > div.absolute.isolate {
          border-radius: 9999px !important;
        }
      `}</style>
      <section id="products" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 border border-orange-500 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-orange-500 rounded-full" />
        </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <div className="flex justify-center mb-6">
            <Image
              src="/landing-page/1.png"
              alt="Decorative Divider"
              width={200}
              height={20}
              className="object-contain"
            />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Products Carousel */}
        <div className="relative max-w-7xl mx-auto px-20">
          {/* Navigation Arrows */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full overflow-hidden">
            <LiquidButton
              onClick={prevSlide}
              variant="default"
              size="icon"
              className="navigation-button-wrapper w-full h-full text-orange-500 hover:text-orange-600 rounded-full"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </LiquidButton>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full overflow-hidden">
            <LiquidButton
              onClick={nextSlide}
              variant="default"
              size="icon"
              className="navigation-button-wrapper w-full h-full text-orange-500 hover:text-orange-600 rounded-full"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </LiquidButton>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="frosted-glass-card rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-64 bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductRevealCard
                  key={product.id}
                  className="w-full max-w-sm mx-auto"
                  name={product.name}
                  productHref={`/e-shop/${product.id}`}
                  price={formatPrice(product.pricePerUnit)}
                  originalPrice={formatPrice(product.pricePerUnit * 1.25)}
                  image={
                    product.images?.[0] ||
                    FALLBACK_PRODUCT_IMAGES[
                      Math.abs(Number(product.id) || 0) % FALLBACK_PRODUCT_IMAGES.length
                    ]
                  }
                  description={
                    product.description ||
                    "Authentic spiritual product curated for your daily devotion and rituals."
                  }
                  rating={4.2 + ((product.availableQty % 8) / 10)}
                  reviewCount={Math.max(getImpressionCount(product), 12)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-orange-500 w-8"
                  : "bg-gray-300 hover:bg-orange-300"
              }`}
            />
            ))}
          </div>
        )}
      </div>

      {/* Wavy Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
          <path
            d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="#f5f5f0"
          />
        </svg>
      </div>
    </section>
    </>
  );
}
