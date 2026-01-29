"use client";

import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import Image from "next/image";

const DEFAULT_EXPLORE_ITEMS = [
  { title: "Temple", description: "Discover sacred temples and plan your spiritual journey to holy places across India.", image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop", className: "col-span-2 row-span-2 flex flex-col justify-between" },
  { title: "Dharmshala", description: "Find comfortable and affordable accommodations near temples for your pilgrimage.", image: "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&h=600&fit=crop", className: "" },
  { title: "Bal-vidhya", description: "Educational programs and spiritual learning for children to connect with our rich heritage.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop", className: "" },
  { title: "Audio Library", description: "Access a vast collection of spiritual chants, mantras, and devotional music.", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop", className: "row-span-2" },
  { title: "Events", description: "Stay updated with upcoming religious festivals, ceremonies, and spiritual gatherings.", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop", className: "col-span-2" },
  { title: "Motivational Speakers", description: "Connect with inspiring spiritual leaders and motivational speakers for guidance.", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop", className: "" },
];

export interface ExploreDharmlokSectionProps {
  title?: string;
  description?: string;
  cards?: Array<{ title: string; description: string; image: string; className?: string }>;
}

export default function ExploreDharmlok({
  title = "Explore Dharmlok",
  description = "Discover the diverse spiritual services and resources available on Dharmlok. From temples to educational programs, explore everything that makes your spiritual journey meaningful.",
  cards,
}: ExploreDharmlokSectionProps = {}) {
  const exploreItems = cards && cards.length > 0 ? cards : DEFAULT_EXPLORE_ITEMS;

  return (
    <section id="explore-dharmlok" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
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

        {/* Bento Grid */}
        <div className="max-w-7xl mx-auto">
          <CyberneticBentoGrid items={exploreItems} title="" />
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
