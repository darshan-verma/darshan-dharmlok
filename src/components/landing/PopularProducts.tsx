"use client";

import { useState } from "react";
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const products = [
  {
    id: 1,
    name: "Rudraksha Mala",
    price: 299,
    originalPrice: 499,
    rating: 5,
    image: "📿",
  },
  {
    id: 2,
    name: "Brass Pooja Set",
    price: 599,
    originalPrice: 899,
    rating: 4,
    image: "🪔",
  },
  {
    id: 3,
    name: "Spiritual Books",
    price: 199,
    originalPrice: 299,
    rating: 5,
    image: "📚",
  },
  {
    id: 4,
    name: "Incense Sticks Pack",
    price: 149,
    originalPrice: 249,
    rating: 4,
    image: "🕯️",
  },
];

export default function PopularProducts() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 4));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(products.length / 4)) % Math.ceil(products.length / 4));
  };

  const discount = (product: typeof products[0]) => {
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  return (
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
            Popular Products
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
            Discover authentic spiritual products, pooja items, and sacred artifacts from our curated e-shop to enhance your spiritual practice.
          </p>
        </div>

        {/* Products Carousel */}
        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Arrows */}
          <LiquidButton
            onClick={prevSlide}
            variant="default"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 text-white rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </LiquidButton>
          <LiquidButton
            onClick={nextSlide}
            variant="default"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 text-white rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </LiquidButton>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                {/* Product Image */}
                <div className="relative h-64 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-8xl">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {product.image}
                  </div>
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-6 space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < product.rating
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {product.rating}.00 out of 5
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-bold text-gray-900 text-lg">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ${product.originalPrice}
                    </span>
                    <span className="text-sm font-semibold text-orange-500">
                      ({discount(product)}% Off)
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-all transform hover:scale-105">
                    Add To Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
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
      </div>
    </section>
  );
}
