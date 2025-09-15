import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { UserWhereConditions } from "@/types/user";

// GET - List all seller users with optimized queries and product stats
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const search = searchParams.get("search") || "";
		const state = searchParams.get("state") || "";
		const status = searchParams.get("status") || "";
		const kycApproved = searchParams.get("kycApproved");
		const active = searchParams.get("active");

		const skip = (page - 1) * limit;

		// Build filter conditions for seller users
		const whereConditions: UserWhereConditions = {
			userType: "seller",
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

		if (active !== null) {
			whereConditions.active = parseInt(active as string);
		}

		// Get seller users with selective fields and product information
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
					products: {
						select: {
							id: true,
							name: true,
							category: true,
							pricePerUnit: true,
							availableQty: true,
							status: true,
							createdAt: true,
							images: true,
						},
						where: {
							status: "active",
						},
						orderBy: {
							createdAt: "desc",
						},
						take: 5, // Latest 5 products
					},
					_count: {
						select: {
							posts: true,
							comments: true,
							products: true,
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

		// Get product category statistics for sellers
		const productStats = await prisma.product.groupBy({
			by: ["category"],
			where: {
				seller: {
					userType: "seller",
				},
				status: "active",
			},
			_count: {
				category: true,
			},
			_sum: {
				availableQty: true,
			},
			_avg: {
				pricePerUnit: true,
			},
		});

		// Transform the data to include product metrics
		const enrichedUsers = users.map((user) => {
			const productValue = user.products.reduce((total, product) => {
				return total + product.pricePerUnit * product.availableQty;
			}, 0);

			return {
				...user,
				productMetrics: {
					totalProducts: user._count.products,
					activeProducts: user.products.length,
					totalInventoryValue: productValue,
					categories: [...new Set(user.products.flatMap((p) => p.category))],
				},
			};
		});

		return NextResponse.json({
			success: true,
			data: enrichedUsers,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNext,
				hasPrev,
				limit,
			},
			stats: {
				productCategories: productStats,
			},
		});
	} catch (error) {
		console.error("Error fetching seller users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch seller users" },
			{ status: 500 }
		);
	}
}

// POST - Create new seller user
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Extract seller-specific data
		const userData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
			password: formData.get("password") as string,
			userType: "seller" as const,
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			status: (formData.get("status") as string) || "Active",
			active: parseInt(formData.get("active") as string) || 1,
			availability: parseInt(formData.get("availability") as string) || 1, // Sellers are generally available
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
				const fileName = `seller-profiles/${Date.now()}-${
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
				const fileName = `seller-banners/${Date.now()}-${bannerImageFile.name}`;
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

		// Create seller user with transaction for consistency
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

			// Handle initial product creation if provided
			const productsData = formData.get("products");
			if (productsData) {
				try {
					const products = JSON.parse(productsData as string);
					if (Array.isArray(products)) {
						const productPromises = products
							.map((product) => {
								if (
									product.name &&
									product.pricePerUnit &&
									product.availableQty
								) {
									return tx.product.create({
										data: {
											sellerId: newUser.id,
											name: product.name,
											category: Array.isArray(product.category)
												? product.category
												: [product.category || "general"],
											pricePerUnit: parseFloat(product.pricePerUnit),
											availableQty: parseInt(product.availableQty),
											description: product.description || "",
											images: Array.isArray(product.images)
												? product.images
												: [],
											videos: Array.isArray(product.videos)
												? product.videos
												: [],
											status: product.status || "active",
											date: new Date(),
										},
									});
								}
							})
							.filter(Boolean);

						await Promise.all(productPromises);
					}
				} catch (productsError) {
					console.error("Products creation failed:", productsError);
					// Continue without failing the transaction
				}
			}

			return newUser;
		});

		return NextResponse.json(
			{
				success: true,
				message: "Seller user created successfully",
				data: result,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating seller user:", error);

		if (error instanceof Error) {
			if (error.message.includes("Unique constraint")) {
				return NextResponse.json(
					{ error: "User with this email or phone already exists" },
					{ status: 409 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create seller user" },
			{ status: 500 }
		);
	}
}
