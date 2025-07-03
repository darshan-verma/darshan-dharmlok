import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/uploadToS3";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
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
		if (!file.type.startsWith("video/")) {
			return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
		}

		const ext = file.name.split(".").pop() || "mp4";
		const fileName = `video/${userId}/${Date.now()}.${ext}`;
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const videoUrl = await uploadToS3(buffer, fileName, file.type);

		let videoRecord = null;
		if (userId && userId !== "unknown") {
			try {
				videoRecord = await prisma.video.create({
					data: {
						title: file.name,
						videoUrl,
						description: "",
						userId: userId as string,
						status: "active",
						category: "general",
						type: "video",
					},
				});
			} catch (dbError) {
				console.error("Error creating video record:", dbError);
				return NextResponse.json(
					{
						error: "Failed to save video in database",
						details: dbError instanceof Error ? dbError.message : dbError,
					},
					{ status: 500 }
				);
			}
		} else {
			console.warn("No valid userId provided, skipping DB record.");
		}

		return NextResponse.json({ videoUrl, video: videoRecord });
	} catch (error) {
		console.error("Video upload error:", error);
		return NextResponse.json(
			{
				error: "Unexpected error during upload",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
