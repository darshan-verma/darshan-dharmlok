import { NextRequest, NextResponse } from "next/server";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import { join, extname } from "path";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const uploadsDir = join(process.cwd(), "public", "uploads", "videos");
		if (!existsSync(uploadsDir)) {
			mkdirSync(uploadsDir, { recursive: true });
		}

		const ext = extname(file.name) || ".mp4";
		const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
		const filepath = join(uploadsDir, filename);

		await new Promise((resolve, reject) => {
			const stream = createWriteStream(filepath);
			stream.write(buffer);
			stream.end();
			stream.on("finish", () => resolve(undefined));
			stream.on("error", () => reject());
		});

		const fileUrl = `/uploads/videos/${filename}`;
		return NextResponse.json({ fileUrl });
	} catch (error) {
		console.error("File upload error:", error);
		return NextResponse.json({ error: "File upload failed" }, { status: 500 });
	}
}
