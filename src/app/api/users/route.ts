import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
	try {
		// Get query parameters for filtering
		const url = new URL(request.url);
		const userType = url.searchParams.get("userType");
		const status = url.searchParams.get("status");
		const limit = url.searchParams.get("limit")
			? parseInt(url.searchParams.get("limit") || "50")
			: 50;
		const page = url.searchParams.get("page")
			? parseInt(url.searchParams.get("page") || "1")
			: 1;
		const skip = (page - 1) * limit;

		// Build filter conditions
		const whereConditions: any = {};

		if (userType) {
			whereConditions.userType = userType;
		}

		if (status) {
			whereConditions.status = status;
		}

		// Get total count for pagination
		const totalCount = await prisma.user.count({
			where: whereConditions,
		});

		// Fetch users with filters
		const users = await prisma.user.findMany({
			where: whereConditions,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				typeVendor: true,
				profileImageUrl: true,
				bio: true,
				category: true,
				social: true,
				active: true,
				rank: true,
				kycApproved: true,
				status: true,
				isLoggedIn: true,
				lastLoginAt: true,
				lastLogoutAt: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		});

		return NextResponse.json({
			users,
			pagination: {
				total: totalCount,
				page,
				limit,
				totalPages: Math.ceil(totalCount / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching users:", error);

		return NextResponse.json(
			{
				error: "Failed to fetch users",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
