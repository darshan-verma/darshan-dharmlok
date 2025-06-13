import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdirSync, existsSync } from "fs";

// Define the upload directory path
const UPLOAD_DIR_GENERIC = path.join(
	process.cwd(),
	"public",
	"uploads",
	"images"
);

// Ensure the upload directory exists
try {
	if (!existsSync(UPLOAD_DIR_GENERIC)) {
		mkdirSync(UPLOAD_DIR_GENERIC, { recursive: true });
		console.log(`Created directory: ${UPLOAD_DIR_GENERIC}`);
	}
} catch (error) {
	console.error("Failed to create generic upload directory:", error);
	// Depending on your error handling strategy, you might want to throw or handle this
}

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// Validate file type (optional, but recommended)
		const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Invalid file type." },
				{ status: 400 }
			);
		}

		// Validate file size (optional, but recommended)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 5MB." },
				{ status: 400 }
			);
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Generate a unique filename to prevent overwrites and sanitize
		const originalFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"); // Sanitize filename
		const filename = `${Date.now()}-${originalFilename}`;
		const filePath = path.join(UPLOAD_DIR_GENERIC, filename);

		await writeFile(filePath, buffer);

		const imageUrl = `/uploads/images/${filename}`; // URL path relative to public directory

		return NextResponse.json({ success: true, imageUrl: imageUrl });
	} catch (error) {
		console.error("Error uploading generic image:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Internal server error";
		return NextResponse.json(
			{ error: "Failed to upload image", details: errorMessage },
			{ status: 500 }
		);
	}
}
