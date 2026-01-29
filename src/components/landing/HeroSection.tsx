"use client";

import { useEffect, useRef, useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import Image from "next/image";
import Link from "next/link";

export interface HeroSlideData {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string;
  sortOrder: number;
}

const DEFAULT_SLIDE: HeroSlideData = {
  id: "default",
  heading: "Discover Divine",
  subheading: "Your Spiritual Journey Begins Here",
  description:
    "Connect with spiritual guides, book pooja services, explore sacred temples, and plan your pilgrimage journey with Dharmlok - your trusted companion for spiritual growth.",
  mediaUrl: "/landing-page/13656424_3840_2160_30fps.mp4",
  mediaType: "video",
  sortOrder: 0,
};

interface HeroSectionProps {
  slides?: HeroSlideData[] | null;
}

export default function HeroSection({ slides: slidesProp }: HeroSectionProps) {
  const sparkleRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides =
    slidesProp && slidesProp.length > 0 ? slidesProp : [DEFAULT_SLIDE];
  const isCarousel = slides.length > 1;

  useEffect(() => {
    if (!isCarousel) return;
    const t = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [isCarousel, slides.length]);

  return (
    <>
      <style>{`
        .hero-button-wrapper[data-slot="button"] {
          overflow: hidden !important;
        }
        .hero-button-wrapper[data-slot="button"] > div.absolute.rounded-full {
          border-radius: 9999px !important;
        }
        .hero-button-wrapper[data-slot="button"] > div.absolute.isolate {
          border-radius: 9999px !important;
        }
        .hero-slide-strip {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Media + content strip for smooth slide transition */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="hero-slide-strip flex h-full"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${(currentIndex * 100) / slides.length}%)`,
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="relative h-full flex-shrink-0"
                style={{ width: `${100 / slides.length}%` }}
              >
                {slide.mediaType === "video" && slide.mediaUrl ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = 0.5;
                    }}
                  >
                    <source src={slide.mediaUrl} type="video/mp4" />
                  </video>
                ) : slide.mediaUrl ? (
                  <div className="absolute inset-0">
                    <Image
                      src={slide.mediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = 0.5;
                    }}
                  >
                    <source src="/landing-page/13656424_3840_2160_30fps.mp4" type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              key={currentIndex}
              className="text-white space-y-6 animate-fade-in-up transition-opacity duration-500"
              style={{ fontFamily: "var(--font-jost), sans-serif" }}
              ref={sparkleRef}
            >
              <div className="space-y-2">
                {slides[currentIndex].subheading && (
                  <h2
                    className="text-2xl font-light tracking-wide"
                    style={{ fontFamily: "var(--font-jost), sans-serif" }}
                  >
                    {slides[currentIndex].subheading}
                  </h2>
                )}
                <h1
                  className="text-5xl md:text-7xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-jost), sans-serif" }}
                >
                  {slides[currentIndex].heading}
                </h1>
              </div>
              {slides[currentIndex].description && (
                <p
                  className="text-gray-300 text-lg leading-relaxed max-w-lg"
                  style={{ fontFamily: "var(--font-jost), sans-serif" }}
                >
                  {slides[currentIndex].description}
                </p>
              )}
              <div className="flex gap-4">
                <div className="overflow-hidden rounded-full">
                  <LiquidButton
                    variant="default"
                    size="xxl"
                    className="hero-button-wrapper text-white font-semibold text-lg !text-white hover:!text-white"
                    style={{ fontFamily: "var(--font-jost), sans-serif" }}
                    asChild
                  >
                    <Link href="/services">Explore Services</Link>
                  </LiquidButton>
                </div>
                <div className="overflow-hidden rounded-full">
                  <LiquidButton
                    variant="default"
                    size="xxl"
                    className="hero-button-wrapper text-white font-semibold text-lg !text-white hover:!text-white"
                    style={{ fontFamily: "var(--font-jost), sans-serif" }}
                    asChild
                  >
                    <Link href="/travel-portal">Book Travel</Link>
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel indicators - faint dots for number of slides */}
        {isCarousel && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "bg-white/90 w-6 h-2"
                    : "bg-white/25 w-2 h-2 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Wavy Divider */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
            <path
              d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="#f5f5f0"
              className="animate-wave"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
