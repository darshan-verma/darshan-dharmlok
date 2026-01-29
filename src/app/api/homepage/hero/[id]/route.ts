import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function mapSlide(s: {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    heading: s.heading,
    subheading: s.subheading ?? null,
    description: s.description ?? null,
    mediaUrl: s.mediaUrl ?? null,
    mediaType: s.mediaType ?? "image",
    sortOrder: s.sortOrder,
    createdAt: s.createdAt?.toISOString?.() ?? "",
    updatedAt: s.updatedAt?.toISOString?.() ?? "",
  };
}

function getId(pathname: string): string | null {
  const parts = pathname.split("/");
  const id = parts[parts.length - 1];
  return id && /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
}

// GET /api/homepage/hero/[id]
export async function GET(req: NextRequest) {
  try {
    const id = getId(req.nextUrl.pathname);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const slide = await prisma.homepageHeroSlide.findUnique({ where: { id } });
    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }
    return NextResponse.json(mapSlide(slide));
  } catch (error) {
    console.error("Error fetching hero slide:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero slide" },
      { status: 500 }
    );
  }
}

// PUT /api/homepage/hero/[id]
export async function PUT(req: NextRequest) {
  try {
    const id = getId(req.nextUrl.pathname);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const {
      heading,
      subheading,
      description,
      mediaUrl,
      mediaType,
      sortOrder,
    } = body as {
      heading?: string;
      subheading?: string | null;
      description?: string | null;
      mediaUrl?: string | null;
      mediaType?: string;
      sortOrder?: number;
    };

    const updateData: {
      heading?: string;
      subheading?: string | null;
      description?: string | null;
      mediaUrl?: string | null;
      mediaType?: string;
      sortOrder?: number;
    } = {};
    if (heading !== undefined) updateData.heading = heading.trim();
    if (subheading !== undefined) updateData.subheading = subheading?.trim() ?? null;
    if (description !== undefined) updateData.description = description?.trim() ?? null;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl?.trim() || null;
    if (mediaType !== undefined) updateData.mediaType = mediaType === "video" ? "video" : "image";
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;

    const slide = await prisma.homepageHeroSlide.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(mapSlide(slide));
  } catch (error) {
    console.error("Error updating hero slide:", error);
    return NextResponse.json(
      { error: "Failed to update hero slide" },
      { status: 500 }
    );
  }
}

// DELETE /api/homepage/hero/[id]
export async function DELETE(req: NextRequest) {
  try {
    const id = getId(req.nextUrl.pathname);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await prisma.homepageHeroSlide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    return NextResponse.json(
      { error: "Failed to delete hero slide" },
      { status: 500 }
    );
  }
}
