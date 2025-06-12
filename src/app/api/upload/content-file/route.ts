import { NextRequest, NextResponse } from "next/server";

// Increase body size limit for this route
export const config = {
	api: {
		bodyParser: {
			sizeLimit: "200mb",
		},
	},
};

// Minimal POST handler for file upload
export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		// const type = formData.get("type") as string | null;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// TODO: Save the file to disk, S3, etc.
		// For now, just return a fake URL for demonstration.
		const fileUrl = `/uploads/${Date.now()}-${file.name}`;

		// You should implement actual file saving logic here.

		return NextResponse.json({ fileUrl });
	} catch{
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
