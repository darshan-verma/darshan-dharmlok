import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadToS3 } from "@/lib/uploadToS3";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const formData = await req.formData();
	const file = formData.get("file") as File | null;
	const type = (formData.get("type") as string) || "image";
const prefixRaw = (formData.get("prefix") as string | null) ?? null;

	if (!file || !(file instanceof File)) {
		return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
	}

	const isImage = type === "image" || file.type.startsWith("image/");
	const isVideo = type === "video" || file.type.startsWith("video/");
	if (!isImage && !isVideo) {
		return NextResponse.json({ error: "Invalid type. Use image or video." }, { status: 400 });
	}

	const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
	if (isImage && !allowedImageTypes.includes(file.type)) {
		return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
	}
	if (isVideo && !allowedVideoTypes.includes(file.type)) {
		return NextResponse.json({ error: "Invalid video type." }, { status: 400 });
	}

	const maxSizeMB = isVideo ? 100 : 5;
	if (file.size > maxSizeMB * 1024 * 1024) {
		return NextResponse.json({ error: "File too large." }, { status: 400 });
	}

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
const safePrefix = (prefixRaw || `community/${session.user.id}`)
	.replace(/^\/+|\/+$/g, "")
	.replace(/\s+/g, "_");
if (safePrefix.includes("..")) {
	return NextResponse.json({ error: "Invalid prefix." }, { status: 400 });
}
const safeName = file.name
	.replace(/\s+/g, "_")
	.replace(/[^a-zA-Z0-9._-]/g, "");
const key = `${safePrefix}/${Date.now()}_${safeName}`;
	const url = await uploadToS3(buffer, key, file.type);

	return NextResponse.json({ url, type: isImage ? "image" : "video" });
}
