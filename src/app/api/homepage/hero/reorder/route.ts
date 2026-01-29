import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/homepage/hero/reorder - body: { order: string[] } (slide ids in desired order)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { order } = body as { order: string[] };
    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: "order must be a non-empty array of slide ids" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      order.map((id, index) =>
        prisma.homepageHeroSlide.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const slides = await prisma.homepageHeroSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({
      slides: slides.map((s) => ({
        id: s.id,
        heading: s.heading,
        subheading: s.subheading ?? null,
        description: s.description ?? null,
        mediaUrl: s.mediaUrl ?? null,
        mediaType: s.mediaType ?? "image",
        sortOrder: s.sortOrder,
        createdAt: s.createdAt?.toISOString?.() ?? "",
        updatedAt: s.updatedAt?.toISOString?.() ?? "",
      })),
    });
  } catch (error) {
    console.error("Error reordering hero slides:", error);
    return NextResponse.json(
      { error: "Failed to reorder hero slides" },
      { status: 500 }
    );
  }
}
