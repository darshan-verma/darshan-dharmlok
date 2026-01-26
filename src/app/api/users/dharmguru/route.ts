import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { Address } from "@/types/user";

interface DharmguruCreateData {
	name: string;
	email: string;
	phone: string;
	category: string;
	rank?: string;
	bio?: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	password?: string;
	status?: string;
	kycApproved?: number | boolean;
	isApproved?: boolean;
	active?: number;
	addresses?: Address[];
}

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
					description: true,
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
					serviceOfferings: {
						select: {
							id: true,
							serviceType: true,
							price: true,
							details: true,
							status: true,
						},
						where: {
							status: "Active",
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
		// Handle both JSON and FormData for backward compatibility
		const contentType = request.headers.get("content-type") || "";
		let data: Record<string, unknown>;

		if (contentType.includes("application/json")) {
			data = await request.json();
		} else if (
			contentType.includes("multipart/form-data") ||
			contentType.includes("application/x-www-form-urlencoded")
		) {
			// Fallback for FormData (though we prefer JSON)
			const formData = await request.formData();
			data = Object.fromEntries(formData.entries());
			// Convert string values to appropriate types
			if (typeof data.isApproved === "string")
				data.isApproved = data.isApproved === "true";
			if (typeof data.kycApproved === "string")
				data.kycApproved = data.kycApproved === "true";
			if (typeof data.active === "string")
				data.active = parseInt(data.active) || 1;
		} else {
			// Default to JSON
			try {
				data = await request.json();
			} catch {
				return NextResponse.json(
					{ error: "Invalid request format. Please send JSON data." },
					{ status: 400 }
				);
			}
		}

		console.log("Received dharmguru data:", data);

		// Validate required fields for dharmguru
		const requiredFields = ["name", "email", "phone", "category"];
		const missingFields = requiredFields.filter((field) => !data[field]);

		if (missingFields.length > 0) {
			return NextResponse.json(
				{ error: `Missing required fields: ${missingFields.join(", ")}` },
				{ status: 400 }
			);
		}

		// Type assertion after validation
		const validatedData = data as unknown as DharmguruCreateData;

		// Check for existing email
		const existingUser = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email already exists" },
				{ status: 400 }
			);
		}

		// Hash password if provided
		let hashedPassword = "";
		if (validatedData.password) {
			hashedPassword = await bcrypt.hash(validatedData.password, 12);
		}

		// Create dharmguru with optimized data structure
		const dharmguru = await prisma.user.create({
			data: {
				name: validatedData.name,
				email: validatedData.email,
				phone: validatedData.phone,
				userType: "Dharmguru", // Always set as Dharmguru
				category: validatedData.category,
				rank: validatedData.rank || "",
				bio: validatedData.bio || null,
				profileImageUrl: validatedData.profileImageUrl || null,
				bannerImageUrl: validatedData.bannerImageUrl || null,
				password: hashedPassword,
				status: validatedData.status || "Active",
				kycApproved:
					typeof validatedData.kycApproved === "number"
						? validatedData.kycApproved
						: 0,
				// Add addresses if provided
				...(validatedData.addresses && {
					addresses: {
						create: validatedData.addresses.map((addr: Address) => ({
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
