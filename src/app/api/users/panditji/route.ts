import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { UserWhereConditions } from "@/types/user";
import { parseLangParam } from "@/lib/content-lang";
import {
	formatPanditjiResponse,
	prepareTranslationsForSave,
} from "@/lib/content-api";

// GET - List all panditji users with optimized queries
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const search = searchParams.get("search") || "";
		const state = searchParams.get("state") || "";
		const status = searchParams.get("status") || "";
		const kycApproved = searchParams.get("kycApproved");
		const availability = searchParams.get("availability");

		const locale = parseLangParam(searchParams.get("lang")) ?? "en";
		const skip = (page - 1) * limit;

		// Build filter conditions for panditji users
		const whereConditions: UserWhereConditions = {
			userType: "panditji",
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

		if (kycApproved !== null) {
			whereConditions.kycApproved = parseInt(kycApproved as string);
		}

		if (availability !== null) {
			whereConditions.availability = parseInt(availability as string);
		}

		// Get panditji users with selective fields and service offerings
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
					category: true,
					translations: true,
					translationStatus: true,
					userType: true,
					status: true,
					active: true,
					kycApproved: true,
					availability: true,
					rank: true,
					social: true,
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
							targetType: true,
							price: true,
							details: true,
							status: true,
							createdAt: true,
						},
						where: {
							status: "Active",
						},
						orderBy: {
							createdAt: "desc",
						},
					},
					_count: {
						select: {
							posts: true,
							comments: true,
							serviceOfferings: true,
							images: true,
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

		// Get service offering statistics
		const serviceStats = await prisma.serviceOffering.groupBy({
			by: ["serviceType"],
			where: {
				provider: {
					userType: "panditji",
				},
				status: "Active",
			},
			_count: {
				serviceType: true,
			},
		});

		return NextResponse.json({
			success: true,
			data: users.map((u) =>
				formatPanditjiResponse(u as unknown as Record<string, unknown>, locale)
			),
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNext,
				hasPrev,
				limit,
			},
			stats: {
				serviceTypes: serviceStats,
			},
		});
	} catch (error) {
		console.error("Error fetching panditji users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch panditji users" },
			{ status: 500 }
		);
	}
}

// POST - Create new panditji user
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Extract panditji-specific data
		const userData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
			password: formData.get("password") as string,
			userType: "panditji" as const,
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			category: (formData.get("category") as string) || "",
			status: (formData.get("status") as string) || "Active",
			active: parseInt(formData.get("active") as string) || 1,
			availability: parseInt(formData.get("availability") as string) || 0,
			kycApproved: parseInt(formData.get("kycApproved") as string) || 0,
			rank: (formData.get("rank") as string) || "",
			social: parseInt(formData.get("social") as string) || 0,
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
				const fileName = `panditji-profiles/${Date.now()}-${
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
				const fileName = `panditji-banners/${Date.now()}-${
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

		const translationsField = formData.get("translations");
		const translationBody: Record<string, unknown> = translationsField
			? { translations: JSON.parse(translationsField as string) }
			: {
					locale: "en",
					name: userData.name,
					bio: userData.bio,
					description: userData.description,
					category: userData.category,
				};
		const { translations, translationStatus } =
			prepareTranslationsForSave("panditji", translationBody);
		const enSlice = (translations.en ?? {}) as Record<string, unknown>;

		// Create panditji user with transaction for consistency
		const result = await prisma.$transaction(async (tx) => {
			// Create the user
			const newUser = await tx.user.create({
				data: {
					...userData,
					name: String(enSlice.name ?? userData.name),
					bio: String(enSlice.bio ?? userData.bio ?? ""),
					description: String(
						enSlice.description ?? userData.description ?? ""
					),
					category: String(enSlice.category ?? userData.category ?? ""),
					translations: translations as object,
					translationStatus,
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
					kycApproved: true,
					createdAt: true,
				},
			});

			// Handle address creation if provided
			const addressData = formData.get("address");
			if (addressData) {
				try {
					const address = JSON.parse(addressData as string);
					if (
						address.line1 &&
						address.city &&
						address.state &&
						address.country
					) {
						await tx.address.create({
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
					// Continue without failing the transaction
				}
			}

			// Handle service offerings creation if provided
			const servicesData = formData.get("services");
			if (servicesData) {
				try {
					const services = JSON.parse(servicesData as string);
					if (Array.isArray(services)) {
						const servicePromises = services
							.map((service) => {
								if (service.serviceType && service.price) {
									return tx.serviceOffering.create({
										data: {
											providerId: newUser.id,
											serviceType: service.serviceType,
											targetType: service.targetType || "general",
											targetId: service.targetId || "",
											price: parseFloat(service.price),
											details: service.details || "",
											metadata: service.metadata || {},
											status: "Active",
										},
									});
								}
							})
							.filter(Boolean);

						await Promise.all(servicePromises);
					}
				} catch (servicesError) {
					console.error("Services creation failed:", servicesError);
					// Continue without failing the transaction
				}
			}

			return newUser;
		});

		return NextResponse.json(
			{
				success: true,
				message: "Panditji user created successfully",
				data: result,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating panditji user:", error);

		if (error instanceof Error) {
			if (error.message.includes("Unique constraint")) {
				return NextResponse.json(
					{ error: "User with this email or phone already exists" },
					{ status: 409 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create panditji user" },
			{ status: 500 }
		);
	}
}
