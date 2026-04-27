"use client";

import Header from "./Header";
import HeroSection, { type HeroSlideData } from "./HeroSection";
import AboutDharmlok from "./AboutDharmlok";
import Kathavachak from "./Kathavachak";
import OurServices from "./OurServices";
import Dharmgurus from "./Dharmgurus";
import Panditji from "./Panditji";
import ExploreDharmlok from "./ExploreDharmlok";
import HoroscopeSection from "./HoroscopeSection";
import EShopProducts from "./EShopProducts";
import TravelPortal from "./TravelPortal";
import Footer from "./Footer";
import { BackgroundShader } from "@/components/ui/background-paper-shaders";
import type { HomepageSectionKey } from "@/lib/homepage-sections";
import type { HomepageSection } from "@/lib/homepage-data";

export type HomepageSectionData = HomepageSection;

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
  horoscope: HoroscopeSection as React.ComponentType<Record<string, unknown>>,
  eshop: EShopProducts as React.ComponentType<Record<string, unknown>>,
};

interface LandingPageProps {
  heroSlides: HeroSlideData[] | null;
  sections: HomepageSectionData[];
}

export default function LandingPage({ heroSlides, sections }: LandingPageProps) {

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

  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const horoscopeIndex = sortedSections.findIndex((s) => s.sectionKey === "horoscope");
  const eShopIndex = sortedSections.findIndex((s) => s.sectionKey === "eshop");

  if (horoscopeIndex !== -1 && eShopIndex !== -1 && horoscopeIndex > eShopIndex) {
    const [horoscopeSection] = sortedSections.splice(horoscopeIndex, 1);
    sortedSections.splice(eShopIndex, 0, horoscopeSection);
  }

  return (
    <div className="min-h-screen bg-white/90 relative">
      <BackgroundShader className="opacity-70" color1="#ff8c42" color2="#ffb366" speed={0.3} />

      <div className="relative z-10">
        <Header />
        <>
          <HeroSection slides={heroSlides ?? undefined} />
          {sortedSections.map((section) => {
            const Component = SECTION_COMPONENTS[section.sectionKey as HomepageSectionKey];
            if (!Component) return null;
            return <Component key={section.id} {...sectionProps(section)} />;
          })}
          <TravelPortal />
          <Footer />
        </>
      </div>
    </div>
  );
}
