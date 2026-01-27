"use client";

import Image from "next/image";

interface DharmguruCardProps {
  dharmguru: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  description: string;
  isLast?: boolean;
}

export default function DharmguruCard({ dharmguru, description, isLast = false }: DharmguruCardProps) {
  // Truncate description to a reasonable length
  const truncatedDescription = description.length > 120 
    ? description.substring(0, 120) + "..." 
    : description;

  return (
    <>
      {/* Separator line above card */}
      <div className="h-px bg-gray-300" />
      
      {/* Card with frosted glass effect */}
      <div className="rounded-lg flex flex-col md:flex-row overflow-hidden backdrop-blur-xl bg-white/80 border border-white/30 shadow-xl relative">
        {/* Frosted glass overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-lg" />
        
        {/* Left Section - Image with 3:4 aspect ratio */}
        <div className="w-full md:w-64 relative flex-shrink-0 m-3 md:m-4 z-10">
          <div className="w-full aspect-[3/4] relative">
            {dharmguru.profileImageUrl ? (
              <Image
                src={dharmguru.profileImageUrl}
                alt={dharmguru.name}
                fill
                className="object-cover rounded-lg shadow-md"
                sizes="(max-width: 768px) 100vw, 256px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center rounded-lg shadow-md">
                <span className="text-5xl text-white font-bold">
                  {dharmguru.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Text Content with frosted glass */}
        <div className="flex-1 p-4 md:p-6 flex flex-col justify-center backdrop-blur-md bg-white/70 rounded-r-lg z-10 relative">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-[#1a1a1a] mb-2 md:mb-3">
            {dharmguru.name}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {truncatedDescription}
          </p>
        </div>
      </div>

      {/* Separator line below card (only if not last) */}
      {!isLast && <div className="h-px bg-gray-300" />}
    </>
  );
}
