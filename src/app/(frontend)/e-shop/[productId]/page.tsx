"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Minus, Plus, Play, Tag, IndianRupee } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  date: string;
  category: string[];
  pricePerUnit: number;
  availableQty: number;
  description: string;
  images: string[];
  videos: string[];
  status: string;
}

export default function EShopProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/e-shop/${productId}`);
        if (!response.ok) throw new Error("Product not found");
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const newQty = Math.max(1, Math.min(product.availableQty, quantity + delta));
    setQuantity(newQty);
  };

  const toggleVideoPlay = () => {
    const video = mainVideoRef.current;
    if (!video) return;
    if (isVideoPlaying) {
      video.pause();
      setIsVideoPlaying(false);
    } else {
      video.play();
      setIsVideoPlaying(true);
    }
  };

  // Unified media: images first, then videos (computed early so useEffect can use selectedMedia)
  const mediaItems: ({ type: "image"; url: string } | { type: "video"; url: string })[] = product
    ? [
        ...(product.images ?? []).map((url) => ({ type: "image" as const, url })),
        ...(product.videos ?? []).map((url) => ({ type: "video" as const, url })),
      ]
    : [];
  const selectedMedia = mediaItems[selectedImageIndex] ?? null;
  const hasMedia = mediaItems.length > 0;

  // When switching media, pause video and reset state
  useEffect(() => {
    if (selectedMedia?.type !== "video") {
      mainVideoRef.current?.pause();
      setIsVideoPlaying(false);
    }
  }, [selectedImageIndex, selectedMedia?.type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-24 px-4">
          <p className="text-lg text-muted-foreground mb-4">
            Product not found.
          </p>
          <Button variant="outline" onClick={() => router.push("/e-shop")}>
            Back to E-Shop
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Product media section - images and videos together */}
          <section className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f5f5f0] border border-border/20">
              {selectedMedia?.type === "image" ? (
                <Image
                  src={selectedMedia.url}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : selectedMedia?.type === "video" ? (
                <>
                  <video
                    ref={mainVideoRef}
                    src={selectedMedia.url}
                    preload="auto"
                    playsInline
                    controls={isVideoPlaying}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    onClick={toggleVideoPlay}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => setIsVideoPlaying(false)}
                  />
                  {!isVideoPlaying && (
                    <button
                      type="button"
                      onClick={toggleVideoPlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      aria-label="Play video"
                    >
                      <span className="rounded-full bg-white/90 p-4">
                        <Play className="h-12 w-12 text-foreground fill-foreground" />
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No media
                </div>
              )}
            </div>

            {/* Thumbnails - images and videos in same row */}
            {hasMedia && mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaItems.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === i
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.url}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <video
                        src={item.url}
                        preload="auto"
                        muted
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        aria-hidden
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Product info */}
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {product.name}
              </h1>
              {product.category?.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {product.category.map((cat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-foreground" />
              <span className="text-2xl font-bold">
                ₹{product.pricePerUnit.toLocaleString("en-IN")}
              </span>
              <span className="text-muted-foreground">per unit</span>
            </div>

            {/* Available quantity */}
            <p className="text-muted-foreground">
              Available:{" "}
              <span className="font-semibold text-foreground">
                {product.availableQty}
              </span>{" "}
              in stock
            </p>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.availableQty}
                  className="p-3 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Buy Now button */}
            <Button
              size="lg"
              className="w-full md:w-auto min-w-[200px]"
              disabled={product.availableQty === 0}
              onClick={() => {
                // Placeholder: could integrate with cart/checkout
                alert(
                  `Buy Now: ${product.name} x ${quantity} = ₹${(
                    product.pricePerUnit * quantity
                  ).toLocaleString("en-IN")}`
                );
              }}
            >
              {product.availableQty === 0
                ? "Out of stock"
                : `Buy Now — ₹${(
                    product.pricePerUnit * quantity
                  ).toLocaleString("en-IN")}`}
            </Button>

            {/* Product details section */}
            <div className="pt-6 border-t">
              <h2 className="text-lg font-semibold mb-2">Product details</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {product.description ? (
                  <p className="whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
