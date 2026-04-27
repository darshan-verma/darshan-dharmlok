import { NextResponse } from "next/server";
import { getHomepageData } from "@/lib/homepage-data";

// GET /api/homepage - returns hero slides + sections for frontend (one request)
export async function GET() {
  try {
    const homepageData = await getHomepageData();
    return NextResponse.json(homepageData);
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage" },
      { status: 500 }
    );
  }
}
