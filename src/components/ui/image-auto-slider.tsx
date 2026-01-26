"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";

interface ServiceOffering {
  id: string;
  serviceType: string;
  targetType?: string;
  price: number;
  details?: string;
  status: string;
  createdAt?: string;
}

interface PanditjiData {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  serviceOfferings?: ServiceOffering[];
}

interface ImageAutoSliderProps {
  images?: string[];
  panditjis?: PanditjiData[];
  className?: string;
  backgroundColor?: string;
  minHeight?: string;
}

// Helper function to safely parse BlockNote content
function safeParseBlockNoteContent(
  content?: string
): PartialBlock[] | undefined {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

// Component to render bio using BlockNote
function BioViewer({ bio }: { bio: string }) {
  const [mounted, setMounted] = useState(false);
  const bioContent = useMemo(() => {
    return safeParseBlockNoteContent(bio);
  }, [bio]);

  const editor = useCreateBlockNote({
    initialContent: bioContent,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!bioContent) {
    return (
      <p className="text-sm text-gray-800">
        {bio || "Experienced Panditji offering spiritual guidance and rituals."}
      </p>
    );
  }

  return (
    <div className="text-sm text-gray-800 max-h-32 overflow-y-auto blocknote-tooltip-bio">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme="light"
        className="p-0"
      />
    </div>
  );
}

export const ImageAutoSlider = ({ 
  images,
  panditjis,
  className = "",
  backgroundColor = "black",
  minHeight = "400px"
}: ImageAutoSliderProps) => {
  // Fallback images if no panditjis provided
  const fallbackImages = [
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1673264933212-d78737f38e48?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=2030&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1675705721263-0bbeec261c49?q=80&w=1940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1524799526615-766a9833dec0?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  // Use panditjis if provided, otherwise use images
  const usePanditjis = panditjis && panditjis.length > 0;
  const imagesToUse = images || fallbackImages;
  
  // Duplicate for seamless loop
  const duplicatedPanditjis = usePanditjis ? [...panditjis, ...panditjis] : [];
  const duplicatedImages = usePanditjis ? [] : [...imagesToUse, ...imagesToUse];

  // Helper to get image URL from panditji
  const getPanditjiImage = (panditji: PanditjiData): string => {
    return panditji.profileImageUrl || panditji.bannerImageUrl || fallbackImages[0];
  };

  // Helper to check if bio is BlockNote JSON
  const isBlockNoteContent = (content?: string): boolean => {
    if (!content) return false;
    const trimmed = content.trim();
    return trimmed.startsWith('[') || trimmed.startsWith('{');
  };

  // Helper to get service offerings text
  const getServicesText = (panditji: PanditjiData): string => {
    if (!panditji.serviceOfferings || panditji.serviceOfferings.length === 0) {
      return "Various spiritual services";
    }
    return panditji.serviceOfferings
      .slice(0, 3)
      .map((service) => service.serviceType || service.details || "Service")
      .join(", ");
  };


  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        /* Frosted glass effect for tooltip */
        .frosted-glass-tooltip {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(24px) saturate(200%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset !important;
          position: relative;
        }

        .frosted-glass-tooltip::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          pointer-events: none;
          z-index: -1;
          border-radius: inherit;
        }

        /* Hide tooltip arrow for panditji cards */
        [data-slot="tooltip-content"].frosted-glass-tooltip svg {
          display: none !important;
        }

        /* Remove white background from BlockNote content in tooltip */
        .blocknote-tooltip-bio .bn-container,
        .blocknote-tooltip-bio .bn-editor,
        .blocknote-tooltip-bio .bn-block-content,
        .blocknote-tooltip-bio .bn-block,
        .blocknote-tooltip-bio .bn-block-content-wrapper,
        .blocknote-tooltip-bio > div,
        .blocknote-tooltip-bio > div > div {
          background: transparent !important;
          background-color: transparent !important;
        }

        /* Ensure text remains visible */
        .blocknote-tooltip-bio .bn-inline-content,
        .blocknote-tooltip-bio p,
        .blocknote-tooltip-bio span {
          color: rgb(31, 41, 55) !important;
        }
      `}</style>
      
      <div 
        className={`w-full relative overflow-hidden flex items-center justify-center ${className}`}
        style={{ 
          minHeight,
          backgroundColor: backgroundColor !== "transparent" && backgroundColor !== "none" ? backgroundColor : undefined
        }}
      >
        {/* Background gradient - only show if black background */}
        {backgroundColor === "black" && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-0" />
        )}
        
        {/* Scrolling images container */}
        <div className="relative z-10 w-full flex items-center justify-center py-8">
          <div className="scroll-container w-full max-w-6xl">
            <TooltipProvider delayDuration={300}>
              <div className="infinite-scroll flex gap-6 w-max">
                {usePanditjis
                  ? duplicatedPanditjis.map((panditji, index) => {
                      const imageUrl = getPanditjiImage(panditji);
                      const services = getServicesText(panditji);
                      const actualIndex = index % (panditjis?.length || 1);
                      const hasBlockNoteBio = panditji.bio && isBlockNoteContent(panditji.bio);

                      return (
                        <Tooltip key={`${panditji.id}-${index}`}>
                          <TooltipTrigger asChild>
                            <div className="image-item flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl overflow-visible shadow-2xl cursor-pointer relative group">
                              <Image
                                src={imageUrl}
                                alt={panditji.name || `Panditji ${actualIndex + 1}`}
                                width={320}
                                height={320}
                                className="w-full h-full object-cover rounded-xl"
                                loading="lazy"
                                unoptimized
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="frosted-glass-tooltip max-w-xs p-4 rounded-xl shadow-2xl border border-white/30 z-[100] pointer-events-none"
                            sideOffset={10}
                            align="center"
                            avoidCollisions={false}
                          >
                            <div className="space-y-2 relative z-10">
                              <h3 className="font-bold text-lg text-gray-900">
                                {panditji.name}
                              </h3>
                              {hasBlockNoteBio && panditji.bio ? (
                                <BioViewer bio={panditji.bio} />
                              ) : (
                                <p className="text-sm text-gray-800 line-clamp-2">
                                  {panditji.bio || panditji.description || "Experienced Panditji offering spiritual guidance and rituals."}
                                </p>
                              )}
                              <div className="pt-2 border-t border-gray-300/30">
                                <p className="text-xs font-semibold text-orange-600 mb-1">
                                  Services:
                                </p>
                                <p className="text-xs text-gray-700">
                                  {services}
                                </p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  : duplicatedImages.map((image, index) => (
                      <div
                        key={index}
                        className="image-item flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl"
                      >
                        <Image
                          src={image}
                          alt={`Gallery image ${(index % imagesToUse.length) + 1}`}
                          width={320}
                          height={320}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                    ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Bottom gradient overlay - only show if black background */}
        {backgroundColor === "black" && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-20" />
        )}
      </div>
    </>
  );
};
