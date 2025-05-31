import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
	try {
		const { userId, status } = await req.json();

		if (!userId || !status) {
			return NextResponse.json(
				{ error: "User ID and status are required" },
				{ status: 400 }
			);
		}

		// Validate status value
		if (!["Active", "Inactive"].includes(status)) {
			return NextResponse.json(
				{ error: "Status must be either 'Active' or 'Inactive'" },
				{ status: 400 }
			);
		}

		// Update user status in database
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { status },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				status: true,
			},
		});

		return NextResponse.json(updatedUser, { status: 200 });
	} catch (error) {
		console.error("Error updating user status:", error);

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: "Failed to update user status", details: error.message },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to update user status" },
			{ status: 500 }
		);
	}
}
