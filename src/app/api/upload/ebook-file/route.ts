import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Utility to get the upload directory
function getUploadDir() {
	return path.join(process.cwd(), "public", "uploads", "ebooks");
}

// POST /api/upload/ebook-file
export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const ext = path.extname(file.name) || ".pdf";
		const filename = `${randomUUID()}${ext}`;
		const uploadDir = getUploadDir();

		// Ensure directory exists (create if not exists)
		await mkdir(uploadDir, { recursive: true });

		const filePath = path.join(uploadDir, filename);
		await writeFile(filePath, buffer);

		const fileUrl = `/uploads/ebooks/${filename}`;
		return NextResponse.json({ fileUrl });
	} catch (error) {
		console.error("Error uploading ebook file:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
