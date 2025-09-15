import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { UserWhereConditions } from "@/types/user";

// GET - List all hotel dharamshala vendor users with optimized queries
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const search = searchParams.get("search") || "";
		const state = searchParams.get("state") || "";
		const city = searchParams.get("city") || "";
		const status = searchParams.get("status") || "";
		const kycApproved = searchParams.get("kycApproved");
		const availability = searchParams.get("availability");

		const skip = (page - 1) * limit;

		// Build filter conditions for hotel dharamshala vendor users
		const whereConditions: UserWhereConditions = {
			userType: "hotel_dharamshala_vendor",
		};

		if (search) {
			whereConditions.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ phone: { contains: search, mode: "insensitive" } },
			];
		}

		if (state || city) {
			const addressConditions: {
				state?: { contains: string; mode: "insensitive" };
				city?: { contains: string; mode: "insensitive" };
			} = {};
			if (state) {
				addressConditions.state = { contains: state, mode: "insensitive" };
			}
			if (city) {
				addressConditions.city = { contains: city, mode: "insensitive" };
			}

			const addressCondition = {
				addresses: {
					some: addressConditions,
				},
			};
			whereConditions.AND = whereConditions.AND
				? [...whereConditions.AND, addressCondition]
				: [addressCondition];
		}

		if (status) {
			whereConditions.status = status;
		}

		if (kycApproved !== null && kycApproved !== "") {
			whereConditions.kycApproved = parseInt(kycApproved as string);
		}

		if (availability !== null) {
			whereConditions.availability = parseInt(availability as string);
		}

		// Get hotel dharamshala vendor users with selective fields
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
					typeVendor: true,
					status: true,
					active: true,
					kycApproved: true,
					availability: true,
					rank: true,
					social: true,
					createdAt: true,
					addresses: {
						select: {
							id: true,
							type: true,
							line1: true,
							line2: true,
							city: true,
							state: true,
							country: true,
							pincode: true,
						},
					},
					serviceOfferings: {
						select: {
							id: true,
							serviceType: true,
							targetType: true,
							targetId: true,
							price: true,
							details: true,
							metadata: true,
							status: true,
							createdAt: true,
						},
						where: {
							status: "Active",
							serviceType: "accommodation",
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

		// Get dharamshala statistics for vendor context
		const dharamshalaStats = await prisma.dharamshala.groupBy({
			by: ["state", "city"],
			_count: {
				state: true,
			},
			orderBy: {
				_count: {
					state: "desc",
				},
			},
			take: 10,
		});

		// Get accommodation service statistics
		const serviceStats = await prisma.serviceOffering.groupBy({
			by: ["targetType"],
			where: {
				provider: {
					userType: "hotel_dharamshala_vendor",
				},
				serviceType: "accommodation",
				status: "Active",
			},
			_count: {
				targetType: true,
			},
			_avg: {
				price: true,
			},
		});

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
			stats: {
				dharamshalaLocations: dharamshalaStats,
				accommodationServices: serviceStats,
			},
		});
	} catch (error) {
		console.error("Error fetching hotel dharamshala vendor users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch hotel dharamshala vendor users" },
			{ status: 500 }
		);
	}
}

// POST - Create new hotel dharamshala vendor user
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Extract hotel dharamshala vendor-specific data
		const userData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
			password: formData.get("password") as string,
			userType: "hotel_dharamshala_vendor" as const,
			typeVendor: (formData.get("typeVendor") as string) || "accommodation",
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			status: (formData.get("status") as string) || "Active",
			active: parseInt(formData.get("active") as string) || 1,
			availability: parseInt(formData.get("availability") as string) || 1,
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
				const fileName = `vendor-profiles/${Date.now()}-${
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
				const fileName = `vendor-banners/${Date.now()}-${bannerImageFile.name}`;
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

		// Create hotel dharamshala vendor user with transaction for consistency
		const result = await prisma.$transaction(async (tx) => {
			// Create the user
			const newUser = await tx.user.create({
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
					typeVendor: true,
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
								type: address.type || "business",
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

			// Handle accommodation services creation if provided
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
											serviceType: "accommodation",
											targetType: service.targetType || "dharamshala",
											targetId: service.targetId || service.dharamshalaId || "",
											price: parseFloat(service.price),
											details: service.details || "",
											metadata: {
												roomType: service.roomType || "standard",
												capacity: service.capacity || 2,
												amenities: service.amenities || [],
												checkInTime: service.checkInTime || "14:00",
												checkOutTime: service.checkOutTime || "11:00",
												cancellationPolicy:
													service.cancellationPolicy || "24 hours",
												...service.metadata,
											},
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
				message: "Hotel Dharamshala Vendor user created successfully",
				data: result,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating hotel dharamshala vendor user:", error);

		if (error instanceof Error) {
			if (error.message.includes("Unique constraint")) {
				return NextResponse.json(
					{ error: "User with this email or phone already exists" },
					{ status: 409 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create hotel dharamshala vendor user" },
			{ status: 500 }
		);
	}
}
