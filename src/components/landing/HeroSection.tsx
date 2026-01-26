"use client";

import { useEffect, useRef } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export default function HeroSection() {
  const sparkleRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Set video playback speed to 0.5x (half speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <>
      <style>{`
        /* Fix square background on LiquidButton components */
        .hero-button-wrapper[data-slot="button"] {
          overflow: hidden !important;
        }
        .hero-button-wrapper[data-slot="button"] > div.absolute.rounded-md {
          border-radius: 0.375rem !important;
        }
        .hero-button-wrapper[data-slot="button"] > div.absolute.isolate {
          border-radius: 0.375rem !important;
        }
      `}</style>
      <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={(e) => {
            // Set playback rate when video metadata is loaded
            const video = e.currentTarget;
            video.playbackRate = 0.5;
          }}
        >
          <source src="/landing-page/13656424_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-6 animate-fade-in-up" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
            <div className="space-y-2" ref={sparkleRef}>
              <h2 className="text-2xl font-light tracking-wide" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
                Your Spiritual Journey Begins Here
              </h2>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
                Discover Divine
                <br />
              </h1>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed max-w-lg" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
              Connect with spiritual guides, book pooja services, explore sacred temples, and plan your pilgrimage journey with Dharmlok - your trusted companion for spiritual growth.
            </p>
            <div className="flex gap-4">
              <div className="overflow-hidden rounded-md">
                <LiquidButton 
                  variant="default" 
                  size="xxl"
                  className="hero-button-wrapper text-white font-semibold text-lg !text-white hover:!text-white"
                  style={{ fontFamily: 'var(--font-jost), sans-serif' }}
                >
                  Explore Services
                </LiquidButton>
              </div>
              <div className="overflow-hidden rounded-md">
                <LiquidButton 
                  variant="default" 
                  size="xxl"
                  className="hero-button-wrapper text-white font-semibold text-lg !text-white hover:!text-white"
                  style={{ fontFamily: 'var(--font-jost), sans-serif' }}
                >
                  Book Travel
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </div>

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
