import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { Address } from "@/types/user";

/**
 * GET /api/users/dharmguru
 * Retrieves paginated list of dharmguru users with optimized fields
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50 per page
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status");

		const skip = (page - 1) * limit;

		// Build where conditions for dharmgurus
		const whereConditions: Prisma.UserWhereInput = {
			userType: "Dharmguru", // Always filter for dharmgurus
			...(search && {
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{ email: { contains: search, mode: "insensitive" } },
					{ category: { contains: search, mode: "insensitive" } },
				],
			}),
			...(status && { status }),
		};

		// Optimized parallel queries
		const [dharmgurus, totalCount] = await Promise.all([
			prisma.user.findMany({
				where: whereConditions,
				select: {
					// Only dharmguru-relevant fields
					id: true,
					name: true,
					email: true,
					phone: true,
					profileImageUrl: true,
					bannerImageUrl: true,
					bio: true,
					category: true,
					rank: true,
					status: true,
					kycApproved: true,
					isLoggedIn: true,
					createdAt: true,
					// Include addresses if needed
					addresses: {
						select: {
							id: true,
							type: true,
							city: true,
							state: true,
						},
					},
				},
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.user.count({ where: whereConditions }),
		]);

		return NextResponse.json({
			dharmgurus,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit),
				hasNext: skip + limit < totalCount,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching dharmgurus:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dharmgurus" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/users/dharmguru
 * Creates a new dharmguru user with validation
 */
export async function POST(request: Request) {
	try {
		const data = await request.json();

		// Validate required fields for dharmguru
		const requiredFields = ["name", "email", "phone", "category"];
		const missingFields = requiredFields.filter((field) => !data[field]);

		if (missingFields.length > 0) {
			return NextResponse.json(
				{ error: `Missing required fields: ${missingFields.join(", ")}` },
				{ status: 400 }
			);
		}

		// Check for existing email
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email already exists" },
				{ status: 400 }
			);
		}

		// Hash password if provided
		let hashedPassword = "";
		if (data.password) {
			hashedPassword = await bcrypt.hash(data.password, 12);
		}

		// Create dharmguru with optimized data structure
		const dharmguru = await prisma.user.create({
			data: {
				name: data.name,
				email: data.email,
				phone: data.phone,
				userType: "Dharmguru", // Always set as Dharmguru
				category: data.category,
				rank: data.rank || "",
				bio: data.bio || null,
				profileImageUrl: data.profileImageUrl || null,
				bannerImageUrl: data.bannerImageUrl || null,
				password: hashedPassword,
				status: data.status || "Active",
				kycApproved: data.kycApproved || 0,
				// Add addresses if provided
				...(data.addresses && {
					addresses: {
						create: data.addresses.map((addr: Address) => ({
							type: addr.type,
							label: addr.label,
							line1: addr.line1,
							line2: addr.line2,
							city: addr.city,
							state: addr.state,
							country: addr.country,
							pincode: addr.pincode,
						})),
					},
				}),
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				category: true,
				rank: true,
				bio: true,
				profileImageUrl: true,
				bannerImageUrl: true,
				status: true,
				kycApproved: true,
				createdAt: true,
				addresses: true,
			},
		});

		return NextResponse.json(dharmguru, { status: 201 });
	} catch (error) {
		console.error("Error creating dharmguru:", error);

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				return NextResponse.json(
					{ error: "Email already exists" },
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create dharmguru" },
			{ status: 500 }
		);
	}
}
