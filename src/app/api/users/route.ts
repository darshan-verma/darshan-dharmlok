import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper function to validate user data
const validateUserData = (
	data: Prisma.UserCreateInput,
	isUpdate: boolean = false
) => {
	const errors: Record<string, string> = {};

	if (!isUpdate || "name" in data) {
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}
	}

	if (!isUpdate || "email" in data) {
		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}
	}

	if (!isUpdate || "phone" in data) {
		if (!data.phone) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit Indian phone number";
		}
	}

	if (Object.keys(errors).length > 0) {
		throw new Error(JSON.stringify(errors));
	}
};

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
		const whereConditions: Prisma.UserWhereInput = {};

		if (userType) {
			whereConditions.userType = {
				equals: userType,
				mode: "insensitive", // Make the search case-insensitive
			};
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
		return NextResponse.json(
			{
				error: "Failed to fetch users",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const data = await request.json();

		// Validate required fields
		validateUserData(data, false);

		// Check if user with email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 }
			);
		}

		// Create new user
		const userData = {
			name: data.name,
			email: data.email,
			phone: data.phone,
			userType: data.userType, // Remove default "Kathavachak" to prevent overriding Panditji
			typeVendor: data.typeVendor,
			category: data.category,
			bio: data.bio,
			rank: data.rank || "",
			kycApproved: data.isApproved ? 1 : 0,
			status: data.status || "Active",
			active: 1,
			social: 0,
			password: "defaultPassword123", // In production, generate a secure default password and send reset email
		};

		const user = await prisma.user.create({
			data: userData,
		});

		return NextResponse.json(
			{
				message: "User created successfully",
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					status: user.status,
					rank: user.rank,
					isApproved: user.kycApproved === 1,
				},
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		const err = error as { message?: string };

		if (err.message?.startsWith('{"')) {
			return NextResponse.json(
				{ error: "Validation failed", details: JSON.parse(err.message) },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to create user",
				details: err.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { id, ...data } = await request.json();

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required for update" },
				{ status: 400 }
			);
		}

		// Validate user data
		validateUserData(data, true);

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update user - explicitly handle rank field
		const updateData: Prisma.UserUpdateInput = {
			...(data.name !== undefined && { name: data.name }),
			...(data.email !== undefined && { email: data.email }),
			...(data.phone !== undefined && { phone: data.phone }),
			...(data.userType !== undefined && { userType: data.userType }),
			...(data.typeVendor !== undefined && { typeVendor: data.typeVendor }),
			...(data.category !== undefined && { category: data.category }),
			...(data.bio !== undefined && { bio: data.bio }),
			// Explicitly set rank, ensuring it's included even if empty string
			rank: data.rank || "",
			...(data.isApproved !== undefined && {
				kycApproved: data.isApproved ? 1 : 0,
			}),
			...(data.status !== undefined && { status: data.status }),
		};

		const updatedUser = await prisma.user.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json({
			message: "User updated successfully",
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			phone: updatedUser.phone,
			userType: updatedUser.userType,
			typeVendor: updatedUser.typeVendor,
			profileImageUrl: updatedUser.profileImageUrl,
			bio: updatedUser.bio,
			category: updatedUser.category,
			social: updatedUser.social,
			active: updatedUser.active,
			rank: updatedUser.rank,
			kycApproved: updatedUser.kycApproved,
			status: updatedUser.status,
			isLoggedIn: updatedUser.isLoggedIn,
			lastLoginAt: updatedUser.lastLoginAt,
			lastLogoutAt: updatedUser.lastLogoutAt,
			createdAt: updatedUser.createdAt,
		});
	} catch (error: unknown) {
		const err = error as { message?: string };

		if (err.message?.startsWith('{"')) {
			return NextResponse.json(
				{ error: "Validation failed", details: JSON.parse(err.message) },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to update user",
				details: err.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}
