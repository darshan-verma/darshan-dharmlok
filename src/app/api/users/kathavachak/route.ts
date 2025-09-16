import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { UserWhereConditions } from "@/types/user";

// GET - List all kathavachak users with optimized queries
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const search = searchParams.get("search") || "";
		const state = searchParams.get("state") || "";
		const status = searchParams.get("status") || "";

		const skip = (page - 1) * limit;

		// Build filter conditions for kathavachak users
		const whereConditions: UserWhereConditions = {
			userType: "kathavachak",
		};

		if (search) {
			whereConditions.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ phone: { contains: search, mode: "insensitive" } },
			];
		}

		if (state) {
			const addressCondition = {
				addresses: {
					some: {
						state: { contains: state, mode: "insensitive" },
					},
				},
			};
			whereConditions.AND = whereConditions.AND
				? [...whereConditions.AND, addressCondition]
				: [addressCondition];
		}

		if (status) {
			whereConditions.status = status;
		}

		// Get kathavachak users with selective fields and related data
		const [users, totalCount] = await Promise.all([
			prisma.user.findMany({
				where: whereConditions,
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					profileImageUrl: true,
					bannerImageUrl: true,
					bio: true,
					description: true,
					userType: true,
					category: true,
					status: true,
					active: true,
					kycApproved: true,
					availability: true,
					rank: true,
					createdAt: true,
					addresses: {
						select: {
							city: true,
							state: true,
							country: true,
							type: true,
						},
					},
					serviceOfferings: {
						select: {
							id: true,
							serviceType: true,
							price: true,
							status: true,
						},
						where: {
							status: "Active",
						},
					},
					_count: {
						select: {
							posts: true,
							comments: true,
							serviceOfferings: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.user.count({
				where: whereConditions,
			}),
		]);

		// Calculate pagination info
		const totalPages = Math.ceil(totalCount / limit);
		const hasNext = page < totalPages;
		const hasPrev = page > 1;

		return NextResponse.json({
			success: true,
			data: users,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNext,
				hasPrev,
				limit,
			},
		});
	} catch (error) {
		console.error("Error fetching kathavachak users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch kathavachak users" },
			{ status: 500 }
		);
	}
}

// POST - Create new kathavachak user
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Extract kathavachak-specific data
		const userData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
			password: formData.get("password") as string,
			userType: "kathavachak" as const,
			category: (formData.get("category") as string) || "",
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			status: (formData.get("status") as string) || "Active",
			active: parseInt(formData.get("active") as string) || 1,
			availability: parseInt(formData.get("availability") as string) || 0,
			kycApproved: parseInt(formData.get("kycApproved") as string) || 0,
		};

		// Validate required fields
		if (
			!userData.name ||
			!userData.email ||
			!userData.phone ||
			!userData.password
		) {
			return NextResponse.json(
				{ error: "Name, email, phone, and password are required" },
				{ status: 400 }
			);
		}

		// Check for existing user
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email: userData.email }, { phone: userData.phone }],
			},
			select: { id: true, email: true, phone: true },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email or phone already exists" },
				{ status: 409 }
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(userData.password, 10);

		// Handle profile image upload
		const profileImageFile = formData.get("profileImage") as File;
		let profileImageUrl = "";

		if (profileImageFile && profileImageFile.size > 0) {
			try {
				const fileBuffer = Buffer.from(await profileImageFile.arrayBuffer());
				const fileName = `kathavachak-profiles/${Date.now()}-${
					profileImageFile.name
				}`;
				profileImageUrl = await uploadToS3(
					fileBuffer,
					fileName,
					profileImageFile.type
				);
			} catch (uploadError) {
				console.error("Profile image upload failed:", uploadError);
				return NextResponse.json(
					{ error: "Failed to upload profile image" },
					{ status: 500 }
				);
			}
		}

		// Handle banner image upload
		const bannerImageFile = formData.get("bannerImage") as File;
		let bannerImageUrl = "";

		if (bannerImageFile && bannerImageFile.size > 0) {
			try {
				const fileBuffer = Buffer.from(await bannerImageFile.arrayBuffer());
				const fileName = `kathavachak-banners/${Date.now()}-${
					bannerImageFile.name
				}`;
				bannerImageUrl = await uploadToS3(
					fileBuffer,
					fileName,
					bannerImageFile.type
				);
			} catch (uploadError) {
				console.error("Banner image upload failed:", uploadError);
				return NextResponse.json(
					{ error: "Failed to upload banner image" },
					{ status: 500 }
				);
			}
		}

		// Create kathavachak user with transaction for consistency
		const newUser = await prisma.user.create({
			data: {
				...userData,
				password: hashedPassword,
				profileImageUrl: profileImageUrl || undefined,
				bannerImageUrl: bannerImageUrl || undefined,
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				profileImageUrl: true,
				bannerImageUrl: true,
				bio: true,
				description: true,
				userType: true,
				status: true,
				active: true,
				availability: true,
				createdAt: true,
			},
		});

		// Handle address creation if provided
		const addressData = formData.get("address");
		if (addressData) {
			try {
				const address = JSON.parse(addressData as string);
				if (address.line1 && address.city && address.state && address.country) {
					await prisma.address.create({
						data: {
							userId: newUser.id,
							type: address.type || "home",
							line1: address.line1,
							line2: address.line2 || "",
							city: address.city,
							state: address.state,
							country: address.country,
							pincode: address.pincode || "",
						},
					});
				}
			} catch (addressError) {
				console.error("Address creation failed:", addressError);
				// Don't fail the entire operation for address issues
			}
		}

		return NextResponse.json(
			{
				success: true,
				message: "Kathavachak user created successfully",
				data: newUser,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating kathavachak user:", error);

		if (error instanceof Error) {
			if (error.message.includes("Unique constraint")) {
				return NextResponse.json(
					{ error: "User with this email or phone already exists" },
					{ status: 409 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create kathavachak user" },
			{ status: 500 }
		);
	}
}
