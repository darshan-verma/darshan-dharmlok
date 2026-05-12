"use client";

import Image from "next/image";
import Featured_05 from "@/components/ui/globe-feature-section";

export default function TravelPortal() {
  return (
    <section id="travel-portal" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            Dharmlok Travels
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
            Plan your spiritual journey with ease. Book flights, hotels, and pilgrimage packages to sacred destinations across India.
          </p>
        </div>

        {/* Globe Feature Section */}
        <div className="max-w-7xl mx-auto">
          <Featured_05 />
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
