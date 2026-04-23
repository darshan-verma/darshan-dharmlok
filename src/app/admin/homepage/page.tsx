"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroSlidesManager } from "../components/homepage/HeroSlidesManager";
import { SectionEditor } from "../components/homepage/SectionEditor";
import { SectionOrderEditor } from "../components/homepage/SectionOrderEditor";
import type { HomepageSectionKey } from "@/lib/homepage-sections";
import type { HeroSlide } from "../components/homepage/HeroSlidesManager";
import type { HomepageSectionData } from "../components/homepage/SectionEditor";
import type { SectionForOrder } from "../components/homepage/SectionOrderEditor";
import { LayoutDashboard, GripVertical } from "lucide-react";

export default function AdminHomepagePage() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [sections, setSections] = useState<HomepageSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hero");

  const fetchHero = async () => {
    try {
      const res = await fetch("/api/homepage/hero");
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(data.slides ?? []);
      }
    } catch {
      setHeroSlides([]);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/homepage/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections ?? []);
      }
    } catch {
      setSections([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchHero(), fetchSections()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sectionByKey = (key: HomepageSectionKey) =>
    sections.find((s) => s.sectionKey === key) ?? null;

  const sectionsForOrder: SectionForOrder[] = sections.map((s) => ({
    sectionKey: s.sectionKey,
    title: s.title,
    sortOrder: s.sortOrder,
  }));

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[200px]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-2">Homepage Content</h1>
      <p className="text-muted-foreground mb-6">
        Edit hero carousel, section titles and descriptions, and section order for the homepage.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-3 h-auto p-1">
          <TabsTrigger value="hero" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="kathavachak">Kathavachak</TabsTrigger>
          <TabsTrigger value="our-services">Our Services</TabsTrigger>
          <TabsTrigger value="dharmguru">Dharmguru</TabsTrigger>
          <TabsTrigger value="panditji">Panditji</TabsTrigger>
          <TabsTrigger value="explore-dharmlok">Explore Dharmlok</TabsTrigger>
          <TabsTrigger value="horoscope">Horoscope</TabsTrigger>
          <TabsTrigger value="eshop">E-Shop</TabsTrigger>
          <TabsTrigger value="order" className="gap-2">
            <GripVertical className="h-4 w-4" />
            Section Order
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6">
          <HeroSlidesManager slides={heroSlides} onSlidesChange={setHeroSlides} />
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <SectionEditor
            sectionKey="about"
            section={sectionByKey("about")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="kathavachak" className="mt-6">
          <SectionEditor
            sectionKey="kathavachak"
            section={sectionByKey("kathavachak")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="our-services" className="mt-6">
          <SectionEditor
            sectionKey="our-services"
            section={sectionByKey("our-services")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="dharmguru" className="mt-6">
          <SectionEditor
            sectionKey="dharmguru"
            section={sectionByKey("dharmguru")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="panditji" className="mt-6">
          <SectionEditor
            sectionKey="panditji"
            section={sectionByKey("panditji")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="explore-dharmlok" className="mt-6">
          <SectionEditor
            sectionKey="explore-dharmlok"
            section={sectionByKey("explore-dharmlok")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="horoscope" className="mt-6">
          <SectionEditor
            sectionKey="horoscope"
            section={sectionByKey("horoscope")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="eshop" className="mt-6">
          <SectionEditor
            sectionKey="eshop"
            section={sectionByKey("eshop")}
            onSave={fetchSections}
          />
        </TabsContent>

        <TabsContent value="order" className="mt-6">
          <SectionOrderEditor
            sections={sectionsForOrder}
            onOrderChange={() => fetchSections()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
