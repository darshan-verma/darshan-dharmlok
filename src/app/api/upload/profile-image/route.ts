import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/uploadToS3";

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
	}

	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	if (!allowedTypes.includes(file.type)) {
		return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
	}

	const maxSizeMB = 5;
	if (file.size > maxSizeMB * 1024 * 1024) {
		return NextResponse.json({ error: "File too large." }, { status: 400 });
	}

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const fileName = `profile-images/${Date.now()}_${file.name.replace(
		/\s+/g,
		"_"
	)}`;
	const imageUrl = await uploadToS3(buffer, fileName, file.type);

	return NextResponse.json({ imageUrl });
}
