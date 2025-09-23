import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pooja-categories/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const pooja = await prisma.poojaCategory.findUnique({
			where: { id },
		});
		if (!pooja) {
			return Response.json(
				{ message: "Pooja Category not found" },
				{ status: 404 }
			);
		}
		return Response.json({
			id: pooja.id,
			name: pooja.name,
			description: pooja.description || "",
			date: pooja.date ? pooja.date.toISOString() : "",
			price: typeof pooja.price === "number" ? pooja.price : undefined,
			details: pooja.details || "",
			status: pooja.status || "Inactive",
			images:
				pooja.images && pooja.images.length > 0
					? pooja.images
					: ["https://via.placeholder.com/300x200?text=Pooja+Image"],
			videos: pooja.videos && pooja.videos.length > 0 ? pooja.videos : [],
		});
	} catch {
		return Response.json(
			{ message: "Failed to fetch Pooja Category" },
			{ status: 500 }
		);
	}
}

// PUT /api/pooja-categories/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const { name, description, date, price, details, status, images, videos } =
			body;

		// Allow status-only update
		if (
			typeof status === "string" &&
			name === undefined &&
			description === undefined &&
			date === undefined &&
			price === undefined &&
			details === undefined &&
			images === undefined &&
			videos === undefined
		) {
			const updated = await prisma.poojaCategory.update({
				where: { id },
				data: { status },
			});
			return Response.json({
				id: updated.id,
				name: updated.name,
				description: updated.description || "",
				date: updated.date ? updated.date.toISOString() : "",
				price: typeof updated.price === "number" ? updated.price : undefined,
				details: updated.details || "",
				status: updated.status || "Inactive",
				images:
					updated.images && updated.images.length > 0
						? updated.images
						: ["https://via.placeholder.com/300x200?text=Pooja+Image"],
				videos:
					updated.videos && updated.videos.length > 0 ? updated.videos : [],
			});
		}

		if (!name || typeof name !== "string" || name.trim().length < 2)
			return Response.json(
				{ message: "Name is required and must be at least 2 characters" },
				{ status: 400 }
			);

		const updated = await prisma.poojaCategory.update({
			where: { id },
			data: {
				name,
				description: description ?? "",
				date: date ? new Date(date) : undefined,
				price: price !== undefined && price !== "" ? Number(price) : undefined,
				details: details ?? "",
				images: images || [],
				videos: videos || [],
				...(status && { status }),
			},
		});

		return Response.json({
			id: updated.id,
			name: updated.name,
			description: updated.description || "",
			date: updated.date ? updated.date.toISOString() : "",
			price: typeof updated.price === "number" ? updated.price : undefined,
			details: updated.details || "",
			status: updated.status || "Inactive",
			images:
				updated.images && updated.images.length > 0
					? updated.images
					: ["https://via.placeholder.com/300x200?text=Pooja+Image"],
			videos: updated.videos && updated.videos.length > 0 ? updated.videos : [],
		});
	} catch {
		return Response.json(
			{ message: "Failed to update Pooja Category" },
			{ status: 500 }
		);
	}
}

// DELETE /api/pooja-categories/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.poojaCategory.delete({ where: { id } });
		return Response.json({ message: "Pooja Category deleted" });
	} catch {
		return Response.json(
			{ message: "Failed to delete Pooja Category" },
			{ status: 500 }
		);
	}
}
