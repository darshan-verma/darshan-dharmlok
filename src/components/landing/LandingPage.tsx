"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import HeroSection, { type HeroSlideData } from "./HeroSection";
import AboutDharmlok from "./AboutDharmlok";
import Kathavachak from "./Kathavachak";
import OurServices from "./OurServices";
import Dharmgurus from "./Dharmgurus";
import Panditji from "./Panditji";
import ExploreDharmlok from "./ExploreDharmlok";
import EShopProducts from "./EShopProducts";
import TravelPortal from "./TravelPortal";
import Footer from "./Footer";
import { BackgroundShader } from "@/components/ui/background-paper-shaders";
import type { HomepageSectionKey } from "@/lib/homepage-sections";

export interface HomepageSectionData {
  id: string;
  sectionKey: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  sortOrder: number;
  extraData: {
    cards?: Array<{ title: string; description: string; image: string; className?: string }>;
  } | null;
}

const SECTION_COMPONENTS: Record<
  HomepageSectionKey,
  React.ComponentType<Record<string, unknown>>
> = {
  about: AboutDharmlok as React.ComponentType<Record<string, unknown>>,
  kathavachak: Kathavachak as React.ComponentType<Record<string, unknown>>,
  "our-services": OurServices as React.ComponentType<Record<string, unknown>>,
  dharmguru: Dharmgurus as React.ComponentType<Record<string, unknown>>,
  panditji: Panditji as React.ComponentType<Record<string, unknown>>,
  "explore-dharmlok": ExploreDharmlok as React.ComponentType<Record<string, unknown>>,
  eshop: EShopProducts as React.ComponentType<Record<string, unknown>>,
};

export default function LandingPage() {
  const [heroSlides, setHeroSlides] = useState<HeroSlideData[] | null>(null);
  const [sections, setSections] = useState<HomepageSectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/homepage")
      .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => {
        if (cancelled || !data) return;
        setHeroSlides(data.heroSlides ?? null);
        setSections(data.sections ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setHeroSlides(null);
          setSections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sectionProps = (section: HomepageSectionData) => {
    const base = {
      title: section.title,
      description: section.description ?? undefined,
    };
    if (section.sectionKey === "about") {
      return {
        ...base,
        mediaUrl: section.mediaUrl,
        mediaType: section.mediaType,
      };
    }
    if (section.sectionKey === "explore-dharmlok") {
      const extra = section.extraData as { cards?: Array<{ title: string; description: string; image: string; className?: string }> } | null;
      return {
        ...base,
        cards: extra?.cards,
      };
    }
    return base;
  };

  return (
    <div className="min-h-screen bg-white/90 relative">
      <BackgroundShader className="opacity-70" color1="#ff8c42" color2="#ffb366" speed={0.3} />

      <div className="relative z-10">
        <Header />
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <HeroSection slides={heroSlides ?? undefined} />
            {sections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => {
                const Component = SECTION_COMPONENTS[section.sectionKey as HomepageSectionKey];
                if (!Component) return null;
                return (
                  <Component
                    key={section.id}
                    {...sectionProps(section)}
                  />
                );
              })}
            <TravelPortal />
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
