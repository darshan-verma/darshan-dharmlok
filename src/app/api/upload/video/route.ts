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
		const source = formData.get("source") as string | null;

		console.log("[POST /api/upload/video] Upload params - userId:", userId, "source:", source);

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
		// Only create database record for actual user videos, not for yoga or other content
		if (
			userId &&
			userId !== "unknown" &&
			typeof userId === "string" &&
			!userId.includes("yoga") &&
			!userId.includes("temple") &&
			!userId.includes("dharamshala")
		) {
			try {
				// If source is comma-separated, use the first value for storage
				// The query will handle multiple sources by splitting
				const sourceToSave = source?.split(",")[0] || source;
				console.log("[POST /api/upload/video] Saving video with source:", sourceToSave);
				
				videoRecord = await prisma.video.create({
					data: {
						title: file.name,
						videoFile: videoUrl,
						description: "",
						userId: userId as string,
						status: "active",
						category: "general",
						type: "video",
						...(sourceToSave && { source: sourceToSave }),
					},
				});
				console.log("[POST /api/upload/video] Created video record:", {
					id: videoRecord.id,
					title: videoRecord.title,
					userId: videoRecord.userId,
					source: videoRecord.source,
					videoFile: videoRecord.videoFile,
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
			console.warn("Skipping DB record creation for non-user video upload.");
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

export const config = {
	api: {
		bodyParser: {
			sizeLimit: "500mb",
		},
	},
};
