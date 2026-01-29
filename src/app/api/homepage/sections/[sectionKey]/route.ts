import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_DEFAULTS,
  type HomepageSectionKey,
} from "@/lib/homepage-sections";

function getSectionKey(pathname: string): string | null {
  const match = pathname.match(/\/api\/homepage\/sections\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
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
}) {
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

// GET /api/homepage/sections/[sectionKey]
export async function GET(req: NextRequest) {
  try {
    const sectionKey = getSectionKey(req.nextUrl.pathname);
    if (!sectionKey || !HOMEPAGE_SECTION_KEYS.includes(sectionKey as HomepageSectionKey)) {
      return NextResponse.json({ error: "Invalid section key" }, { status: 400 });
    }

    let section = await prisma.homepageSection.findUnique({
      where: { sectionKey },
    });

    if (!section) {
      const def = HOMEPAGE_SECTION_DEFAULTS[sectionKey as HomepageSectionKey];
      section = await prisma.homepageSection.create({
        data: {
          sectionKey,
          title: def.title,
          description: def.description,
          sortOrder: def.sortOrder,
          extraData: (def as { extraData?: unknown }).extraData ?? undefined,
        },
      });
    }

    return NextResponse.json(mapSection(section));
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

// PUT /api/homepage/sections/[sectionKey]
export async function PUT(req: NextRequest) {
  try {
    const sectionKey = getSectionKey(req.nextUrl.pathname);
    if (!sectionKey || !HOMEPAGE_SECTION_KEYS.includes(sectionKey as HomepageSectionKey)) {
      return NextResponse.json({ error: "Invalid section key" }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      mediaUrl,
      mediaType,
      sortOrder,
      extraData,
    } = body as {
      title?: string;
      description?: string | null;
      mediaUrl?: string | null;
      mediaType?: string | null;
      sortOrder?: number;
      extraData?: unknown;
    };

    const updateData: Prisma.HomepageSectionUpdateInput = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() ?? null;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl?.trim() || null;
    if (mediaType !== undefined) updateData.mediaType = mediaType === "video" ? "video" : mediaType === "image" ? "image" : null;
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;
    if (extraData !== undefined) updateData.extraData = extraData as Prisma.InputJsonValue;

    let section = await prisma.homepageSection.findUnique({
      where: { sectionKey },
    });

    if (!section) {
      const def = HOMEPAGE_SECTION_DEFAULTS[sectionKey as HomepageSectionKey];
      section = await prisma.homepageSection.create({
        data: {
          sectionKey,
          title: def.title,
          description: def.description,
          sortOrder: def.sortOrder,
          extraData: (def as { extraData?: unknown }).extraData ?? undefined,
        },
      });
    }

    const updated = await prisma.homepageSection.update({
      where: { sectionKey },
      data: updateData,
    });
    return NextResponse.json(mapSection(updated));
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}
