import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/uploadToS3"; // Assuming this utility exists

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ type: string }> }
) {
	const { type } = await context.params;
	const formData = await req.formData();
	const file = formData.get("file") as File | null;

	if (!file || !(file instanceof File)) {
		return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
	}

	// Get the ID for the associated entity (user, kathavachak, temple, etc.)
	const id =
		formData.get("userId") ||
		formData.get("kathavachakId") ||
		formData.get("templeId") ||
		formData.get("dharamshalaId") ||
		"unknown";

	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const typeParts = type.split("-");
		const mediaType = typeParts.pop(); // e.g., 'image', 'video', 'audio', 'pdf'
		let entity = typeParts.join("-"); // e.g., 'profile', 'kathavachak', 'temple'

		if (!entity) {
			entity = "general"; // Default entity if type is just 'video', 'audio', etc.
		}

		const ext = file.name.split(".").pop();
		if (!ext) {
			return NextResponse.json(
				{ error: "File has no extension" },
				{ status: 400 }
			);
		}

		let s3Path: string;
		let responseKey: string;
		let mimeTypePrefix: string;

		switch (mediaType) {
			case "image":
				s3Path = `${entity}/${id}/images/${Date.now()}.${ext}`;
				responseKey = "imageUrl";
				mimeTypePrefix = "image/";
				break;
			case "video":
				s3Path = `${entity}/${id}/videos/${Date.now()}.${ext}`;
				responseKey = "videoUrl";
				mimeTypePrefix = "video/";
				break;
			case "audio":
				s3Path = `${entity}/${id}/audios/${Date.now()}.${ext}`;
				responseKey = "audioUrl";
				mimeTypePrefix = "audio/";
				break;
			case "pdf":
				s3Path = `${entity}/${id}/pdfs/${Date.now()}.${ext}`;
				responseKey = "pdfUrl";
				mimeTypePrefix = "application/pdf";
				break;
			default:
				return NextResponse.json(
					{ error: "Unsupported media type specified in URL" },
					{ status: 400 }
				);
		}

		// Validate file type
		if (mediaType === "pdf") {
			if (file.type !== mimeTypePrefix) {
				return NextResponse.json(
					{ error: `Invalid file type. Expected ${mimeTypePrefix}` },
					{ status: 400 }
				);
			}
		} else {
			if (!file.type.startsWith(mimeTypePrefix)) {
				return NextResponse.json(
					{ error: `Invalid file type. Expected ${mimeTypePrefix}*` },
					{ status: 400 }
				);
			}
		}

		const url = await uploadToS3(buffer, s3Path, file.type);
		return NextResponse.json({ [responseKey]: url });
	} catch (error) {
		console.error(`[POST /api/upload/${type}] Error:`, error);
		return NextResponse.json(
			{
				error: "Failed to upload file",
				details: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}
