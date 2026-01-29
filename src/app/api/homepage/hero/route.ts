import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface HomepageHeroSlideResponse {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

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
}): HomepageHeroSlideResponse {
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

// GET /api/homepage/hero - list all slides (for frontend carousel and admin)
export async function GET() {
  try {
    const slides = await prisma.homepageHeroSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ slides: slides.map(mapSlide) });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero slides" },
      { status: 500 }
    );
  }
}

// POST /api/homepage/hero - create slide
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      heading,
      subheading,
      description,
      mediaUrl,
      mediaType = "image",
    } = body as {
      heading: string;
      subheading?: string | null;
      description?: string | null;
      mediaUrl?: string | null;
      mediaType?: string;
    };

    if (!heading?.trim()) {
      return NextResponse.json(
        { error: "Heading is required" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.homepageHeroSlide
      .aggregate({ _max: { sortOrder: true } })
      .then((r) => r._max.sortOrder ?? -1);

    const slide = await prisma.homepageHeroSlide.create({
      data: {
        heading: heading.trim(),
        subheading: subheading?.trim() ?? null,
        description: description?.trim() ?? null,
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType === "video" ? "video" : "image",
        sortOrder: maxOrder + 1,
      },
    });

    return NextResponse.json(mapSlide(slide));
  } catch (error) {
    console.error("Error creating hero slide:", error);
    return NextResponse.json(
      { error: "Failed to create hero slide" },
      { status: 500 }
    );
  }
}
