import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_DEFAULTS,
  type HomepageSectionKey,
} from "@/lib/homepage-sections";

// GET /api/homepage - returns hero slides + sections for frontend (one request)
export async function GET() {
  try {
    const [heroSlides, existingSections] = await Promise.all([
      prisma.homepageHeroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    const existingKeys = new Set(existingSections.map((s) => s.sectionKey));
    for (const key of HOMEPAGE_SECTION_KEYS) {
      if (!existingKeys.has(key)) {
        const def = HOMEPAGE_SECTION_DEFAULTS[key as HomepageSectionKey];
        await prisma.homepageSection.create({
          data: {
            sectionKey: key,
            title: def.title,
            description: def.description,
            sortOrder: def.sortOrder,
            extraData: def.extraData ?? undefined,
          },
        });
      }
    }

    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      heroSlides: heroSlides.map((s) => ({
        id: s.id,
        heading: s.heading,
        subheading: s.subheading ?? null,
        description: s.description ?? null,
        mediaUrl: s.mediaUrl ?? null,
        mediaType: s.mediaType ?? "image",
        sortOrder: s.sortOrder,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        sectionKey: s.sectionKey,
        title: s.title,
        description: s.description ?? null,
        mediaUrl: s.mediaUrl ?? null,
        mediaType: s.mediaType ?? null,
        sortOrder: s.sortOrder,
        extraData: s.extraData ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage" },
      { status: 500 }
    );
  }
}
