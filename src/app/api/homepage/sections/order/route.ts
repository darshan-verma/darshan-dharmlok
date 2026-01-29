import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HOMEPAGE_SECTION_KEYS } from "@/lib/homepage-sections";

// PUT /api/homepage/sections/order - body: { sectionKeys: string[] }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectionKeys } = body as { sectionKeys: string[] };
    if (!Array.isArray(sectionKeys) || sectionKeys.length === 0) {
      return NextResponse.json(
        { error: "sectionKeys must be a non-empty array" },
        { status: 400 }
      );
    }

    const validKeys = new Set(HOMEPAGE_SECTION_KEYS);
    for (const key of sectionKeys) {
      if (!validKeys.has(key as (typeof HOMEPAGE_SECTION_KEYS)[number])) {
        return NextResponse.json(
          { error: `Invalid section key: ${key}` },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(
      sectionKeys.map((sectionKey, index) =>
        prisma.homepageSection.updateMany({
          where: { sectionKey },
          data: { sortOrder: index },
        })
      )
    );

    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({
      sections: sections.map((s) => ({
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
      })),
    });
  } catch (error) {
    console.error("Error updating section order:", error);
    return NextResponse.json(
      { error: "Failed to update section order" },
      { status: 500 }
    );
  }
}
