import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}
		const buffer = Buffer.from(await file.arrayBuffer());
		const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
		const uploadDir = path.join(
			process.cwd(),
			"public",
			"uploads",
			"temple-videos"
		);
		await mkdir(uploadDir, { recursive: true });
		const filePath = path.join(uploadDir, fileName);
		await writeFile(filePath, buffer);
		const videoUrl = `/uploads/temple-videos/${fileName}`;
		return NextResponse.json({ videoUrl });
	} catch {
		return NextResponse.json(
			{ error: "Failed to upload video" },
			{ status: 500 }
		);
	}
}
