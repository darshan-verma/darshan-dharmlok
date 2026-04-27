import prisma from "@/lib/prisma";
import {
  HOMEPAGE_SECTION_DEFAULTS,
  HOMEPAGE_SECTION_KEYS,
  type HomepageSectionKey,
} from "@/lib/homepage-sections";

export interface HomepageHeroSlide {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string;
  sortOrder: number;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  sortOrder: number;
  extraData: unknown | null;
}

export interface HomepageDataPayload {
  heroSlides: HomepageHeroSlide[];
  sections: HomepageSection[];
}

export async function getHomepageData(): Promise<HomepageDataPayload> {
  const [heroSlides, existingSections] = await Promise.all([
    prisma.homepageHeroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const existingKeys = new Set(existingSections.map((section) => section.sectionKey));
  const missingSectionKeys = HOMEPAGE_SECTION_KEYS.filter((key) => !existingKeys.has(key));

  if (missingSectionKeys.length > 0) {
    await prisma.$transaction(
      missingSectionKeys.map((key) => {
        const def = HOMEPAGE_SECTION_DEFAULTS[key as HomepageSectionKey];
        return prisma.homepageSection.create({
          data: {
            sectionKey: key,
            title: def.title,
            description: def.description,
            sortOrder: def.sortOrder,
            extraData: def.extraData ?? undefined,
          },
        });
      })
    );
  }

  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return {
    heroSlides: heroSlides.map((slide) => ({
      id: slide.id,
      heading: slide.heading,
      subheading: slide.subheading ?? null,
      description: slide.description ?? null,
      mediaUrl: slide.mediaUrl ?? null,
      mediaType: slide.mediaType ?? "image",
      sortOrder: slide.sortOrder,
    })),
    sections: sections.map((section) => ({
      id: section.id,
      sectionKey: section.sectionKey,
      title: section.title,
      description: section.description ?? null,
      mediaUrl: section.mediaUrl ?? null,
      mediaType: section.mediaType ?? null,
      sortOrder: section.sortOrder,
      extraData: section.extraData ?? null,
    })),
  };
}
