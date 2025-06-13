import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdirSync } from "fs";

// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "banners");
try {
	mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (error) {
	console.error("Failed to create upload directory:", error);
	// Depending on your error handling strategy, you might want to throw or handle this
}

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const bannerId = formData.get("bannerId") as string | null;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}
		if (!bannerId) {
			return NextResponse.json(
				{ error: "Banner ID is missing" },
				{ status: 400 }
			);
		}

		// Validate bannerId format (optional, but good practice)
		if (!/^[0-9a-fA-F]{24}$/.test(bannerId)) {
			return NextResponse.json(
				{ error: "Invalid Banner ID format" },
				{ status: 400 }
			);
		}

		const bannerExists = await prisma.banner.findUnique({
			where: { id: bannerId },
		});

		if (!bannerExists) {
			return NextResponse.json({ error: "Banner not found" }, { status: 404 });
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Generate a unique filename to prevent overwrites
		const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
		const filePath = path.join(UPLOAD_DIR, filename);

		await writeFile(filePath, buffer);

		const imageUrl = `/uploads/banners/${filename}`; // URL path relative to public directory

		// Update the banner record with the new image URL
		await prisma.banner.update({
			where: { id: bannerId },
			data: { imageUrl: imageUrl },
		});

		return NextResponse.json({ success: true, imageUrl });
	} catch (error) {
		console.error("Error uploading banner image:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Internal server error";
		return NextResponse.json(
			{ error: "Failed to upload image", details: errorMessage },
			{ status: 500 }
		);
	}
}
