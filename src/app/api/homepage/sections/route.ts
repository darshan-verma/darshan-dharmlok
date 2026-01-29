import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_DEFAULTS,
  type HomepageSectionKey,
} from "@/lib/homepage-sections";

export interface HomepageSectionResponse {
  id: string;
  sectionKey: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  sortOrder: number;
  extraData: unknown;
  createdAt?: string;
  updatedAt?: string;
}

function mapSection(s: {
  id: string;
  sectionKey: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  sortOrder: number;
  extraData: unknown;
  createdAt: Date;
  updatedAt: Date;
}): HomepageSectionResponse {
  return {
    id: s.id,
    sectionKey: s.sectionKey,
    title: s.title,
    description: s.description ?? null,
    mediaUrl: s.mediaUrl ?? null,
    mediaType: s.mediaType ?? null,
    sortOrder: s.sortOrder,
    extraData: s.extraData ?? null,
    createdAt: s.createdAt?.toISOString?.() ?? "",
    updatedAt: s.updatedAt?.toISOString?.() ?? "",
  };
}

// GET /api/homepage/sections - list all sections (ensure defaults exist)
export async function GET() {
  try {
    const existing = await prisma.homepageSection.findMany();
    const existingKeys = new Set(existing.map((s) => s.sectionKey));

    // Create any missing sections with defaults
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
      sections: sections.map(mapSection),
    });
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage sections" },
      { status: 500 }
    );
  }
}
