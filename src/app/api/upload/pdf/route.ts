import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/uploadToS3";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File | null;
	const userId =
		formData.get("userId") ||
		formData.get("kathavachakId") ||
		formData.get("templeId") ||
		formData.get("dharamshalaId") ||
		"unknown";

	if (!file || !(file instanceof File)) {
		return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
	}
	if (file.type !== "application/pdf") {
		return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
	}

	const ext = file.name.split(".").pop() || "pdf";
	const fileName = `pdf/${userId}/${Date.now()}.${ext}`;
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const pdfUrl = await uploadToS3(buffer, fileName, file.type);
	return NextResponse.json({ pdfUrl });
}
