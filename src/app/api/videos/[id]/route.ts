import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	_: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;

		const video = await prisma.video.findUnique({
			where: { id },
		});

		if (!video) {
			return NextResponse.json({ error: "Video not found" }, { status: 404 });
		}

		return NextResponse.json(video);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;
		const data = await request.json();

		// Validate if video exists
		const videoExists = await prisma.video.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!videoExists) {
			return NextResponse.json({ error: "Video not found" }, { status: 404 });
		}

		// Update video
		const updatedVideo = await prisma.video.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description,
				videoUrl: data.videoUrl || undefined,
				thumbnailUrl: data.thumbnailUrl || undefined,
				category: data.category || undefined,
				type: data.type || undefined,
				status: data.status || undefined,
			},
		});

		return NextResponse.json(updatedVideo);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to update video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;

		// Validate if video exists
		const videoExists = await prisma.video.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!videoExists) {
			return NextResponse.json({ error: "Video not found" }, { status: 404 });
		}

		// Delete video
		await prisma.video.delete({
			where: { id },
		});

		return NextResponse.json({ message: "Video deleted successfully" });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
