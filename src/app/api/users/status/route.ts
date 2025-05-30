import prisma from "../../../../lib/prisma";
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

		// Get current user data
		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { isLoggedIn: true },
		});

		if (!currentUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// If setting to Inactive and user is logged in, force logout
		const updateData: {
			status: string;
			isLoggedIn?: boolean;
			lastLogoutAt?: Date;
		} = { status };

		if (status === "Inactive" && currentUser.isLoggedIn) {
			updateData.isLoggedIn = false;
			updateData.lastLogoutAt = new Date();
		}

		// Update user status in database
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				status: true,
				isLoggedIn: true,
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
