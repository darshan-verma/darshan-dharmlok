import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const { price, details, metadata, status } = body; // add status

		const updated = await prisma.serviceOffering.update({
			where: { id },
			data: {
				...(price !== undefined && { price }),
				...(details !== undefined && { details }),
				...(metadata !== undefined && { metadata }),
				...(status !== undefined && { status }), // allow status update
			},
		});

		return Response.json(updated);
	} catch {
		return Response.json(
			{ message: "Failed to update service offering" },
			{ status: 500 }
		);
	}
}

// DELETE /api/service-offerings/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.serviceOffering.delete({ where: { id } });
		return Response.json({ message: "Service offering deleted" });
	} catch {
		return Response.json(
			{ message: "Failed to delete service offering" },
			{ status: 500 }
		);
	}
}
