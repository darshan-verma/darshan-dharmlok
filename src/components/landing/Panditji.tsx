"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";

interface ServiceOffering {
  id: string;
  serviceType: string;
  targetType?: string;
  price: number;
  details?: string;
  status: string;
  createdAt?: string;
}

interface Panditji {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  serviceOfferings?: ServiceOffering[];
}

export interface PanditjiSectionProps {
  title?: string;
  description?: string;
}

export default function Panditji({
  title = "Panditji",
  description = "Meet our verified and experienced Panditji dedicated to supporting your spiritual journey with authentic rituals and guidance.",
}: PanditjiSectionProps = {}) {
  const [panditjis, setPanditjis] = useState<Panditji[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanditjis = async () => {
      try {
        const response = await fetch("/api/users/panditji?limit=9&page=1");
        if (!response.ok) {
          throw new Error("Failed to fetch panditjis");
        }
        const data = await response.json();
        // API returns { success: true, data: [...] }
        if (data.data && Array.isArray(data.data)) {
          setPanditjis(data.data);
        } else if (data.panditjis && Array.isArray(data.panditjis)) {
          setPanditjis(data.panditjis);
        }
      } catch (error) {
        console.error("Error fetching panditjis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanditjis();
  }, []);

  // Get panditjis with images, or fallback to placeholder data
  const getPanditjisWithImages = (): Panditji[] => {
    const panditjisWithImages = panditjis.filter(
      (p) => p.profileImageUrl || p.bannerImageUrl
    );

    if (panditjisWithImages.length > 0) {
      return panditjisWithImages.slice(0, 9);
    }

    // Return empty array if no images - fallback will be handled in ImageAutoSlider
    return [];
  };

  const panditjisToDisplay = getPanditjisWithImages();

  return (
    <section id="panditji" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 border-2 border-orange-500 rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-orange-500 rounded-full" />
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

        {/* Image Auto Slider */}
        {loading ? (
          <div className="flex gap-6 justify-center">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="relative -mx-4 rounded-2xl overflow-hidden">
            <ImageAutoSlider 
              panditjis={panditjisToDisplay}
              className="min-h-[400px]"
              backgroundColor="transparent"
              minHeight="400px"
            />
          </div>
        )}

        {/* See All Button */}
        <div className="text-center mt-12">
          <Link
            href="/panditji"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            SEE ALL
          </Link>
        </div>
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
  );
}
