import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";
import { UserUpdateData } from "@/types/user";

// Helper function to delete S3 media
async function deleteS3Media(mediaUrls: string[]) {
	if (!mediaUrls.length) return;
	const bucket = process.env.MY_S3_BUCKET;
	if (!bucket) return;

	await Promise.all(
		mediaUrls.map(async (url) => {
			const key = url.split(`${bucket}/`)[1] || url.split("/").pop();
			if (!key) return;

			try {
				await s3Client.send(
					new DeleteObjectCommand({ Bucket: bucket, Key: key })
				);
			} catch (err) {
				console.error("S3 delete error:", err);
			}
		})
	);
}

// GET - Get individual seller user by ID with comprehensive product data
export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get seller user with comprehensive data including products
		const user = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "seller",
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
				kycApproved: true,
				availability: true,
				rank: true,
				social: true,
				createdAt: true,
				addresses: {
					select: {
						id: true,
						type: true,
						label: true,
						line1: true,
						line2: true,
						city: true,
						state: true,
						country: true,
						pincode: true,
					},
				},
				products: {
					select: {
						id: true,
						name: true,
						date: true,
						category: true,
						pricePerUnit: true,
						availableQty: true,
						description: true,
						images: true,
						videos: true,
						status: true,
						createdAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				images: {
					select: {
						id: true,
						url: true,
						title: true,
						description: true,
						createdAt: true,
					},
				},
				posts: {
					select: {
						id: true,
						caption: true,
						likes: true,
						createdAt: true,
						media: {
							select: {
								id: true,
								type: true,
								url: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
					take: 10, // Latest 10 posts
				},
				_count: {
					select: {
						posts: true,
						comments: true,
						products: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Seller user not found" },
				{ status: 404 }
			);
		}

		// Calculate product analytics
		const productAnalytics = {
			totalProducts: user.products.length,
			activeProducts: user.products.filter((p) => p.status === "active").length,
			inactiveProducts: user.products.filter((p) => p.status === "inactive")
				.length,
			totalInventoryValue: user.products.reduce(
				(sum, product) => sum + product.pricePerUnit * product.availableQty,
				0
			),
			totalInventoryItems: user.products.reduce(
				(sum, product) => sum + product.availableQty,
				0
			),
			categories: [...new Set(user.products.flatMap((p) => p.category))],
			averagePrice:
				user.products.length > 0
					? user.products.reduce(
							(sum, product) => sum + product.pricePerUnit,
							0
					  ) / user.products.length
					: 0,
			recentProducts: user.products.slice(0, 5),
			lowStockProducts: user.products.filter(
				(p) => p.availableQty <= 10 && p.status === "active"
			),
		};

		return NextResponse.json({
			success: true,
			data: {
				...user,
				productAnalytics,
			},
		});
	} catch (error) {
		console.error("Error fetching seller user:", error);
		return NextResponse.json(
			{ error: "Failed to fetch seller user" },
			{ status: 500 }
		);
	}
}

// PUT - Update seller user with product management
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Check if seller user exists
		const existingUser = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "seller",
			},
			select: {
				id: true,
				profileImageUrl: true,
				bannerImageUrl: true,
				email: true,
				phone: true,
			},
		});

		if (!existingUser) {
			return NextResponse.json(
				{ error: "Seller user not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();

		// Extract update data
		const updateData: UserUpdateData = {
			name: formData.get("name") as string,
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			status: formData.get("status") as string,
			active: formData.get("active")
				? parseInt(formData.get("active") as string)
				: undefined,
			availability: formData.get("availability")
				? parseInt(formData.get("availability") as string)
				: undefined,
			kycApproved: formData.get("kycApproved")
				? parseInt(formData.get("kycApproved") as string)
				: undefined,
			rank: formData.get("rank") as string,
			social: formData.get("social")
				? parseInt(formData.get("social") as string)
				: undefined,
		};

		// Remove undefined values
		Object.keys(updateData).forEach((key) => {
			if (
				updateData[key] === undefined ||
				updateData[key] === null ||
				updateData[key] === ""
			) {
				delete updateData[key];
			}
		});

		// Check for email/phone uniqueness if they are being updated
		const newEmail = formData.get("email") as string;
		const newPhone = formData.get("phone") as string;

		if (newEmail && newEmail !== existingUser.email) {
			const emailExists = await prisma.user.findFirst({
				where: {
					email: newEmail,
					id: { not: userId },
				},
			});
			if (emailExists) {
				return NextResponse.json(
					{ error: "Email already exists" },
					{ status: 409 }
				);
			}
			updateData.email = newEmail;
		}

		if (newPhone && newPhone !== existingUser.phone) {
			const phoneExists = await prisma.user.findFirst({
				where: {
					phone: newPhone,
					id: { not: userId },
				},
			});
			if (phoneExists) {
				return NextResponse.json(
					{ error: "Phone number already exists" },
					{ status: 409 }
				);
			}
			updateData.phone = newPhone;
		}

		// Handle password update
		const newPassword = formData.get("password") as string;
		if (newPassword) {
			updateData.password = await bcrypt.hash(newPassword, 10);
		}

		// Handle profile image upload
		const profileImageFile = formData.get("profileImage") as File;
		if (profileImageFile && profileImageFile.size > 0) {
			try {
				const fileBuffer = Buffer.from(await profileImageFile.arrayBuffer());
				const fileName = `seller-profiles/${Date.now()}-${
					profileImageFile.name
				}`;
				const newProfileImageUrl = await uploadToS3(
					fileBuffer,
					fileName,
					profileImageFile.type
				);

				// Delete old profile image if exists
				if (existingUser.profileImageUrl) {
					await deleteS3Media([existingUser.profileImageUrl]);
				}

				updateData.profileImageUrl = newProfileImageUrl;
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
		if (bannerImageFile && bannerImageFile.size > 0) {
			try {
				const fileBuffer = Buffer.from(await bannerImageFile.arrayBuffer());
				const fileName = `seller-banners/${Date.now()}-${bannerImageFile.name}`;
				const newBannerImageUrl = await uploadToS3(
					fileBuffer,
					fileName,
					bannerImageFile.type
				);

				// Delete old banner image if exists
				if (existingUser.bannerImageUrl) {
					await deleteS3Media([existingUser.bannerImageUrl]);
				}

				updateData.bannerImageUrl = newBannerImageUrl;
			} catch (uploadError) {
				console.error("Banner image upload failed:", uploadError);
				return NextResponse.json(
					{ error: "Failed to upload banner image" },
					{ status: 500 }
				);
			}
		}

		// Use transaction to update user and related data
		const result = await prisma.$transaction(async (tx) => {
			// Update seller user
			const updatedUser = await tx.user.update({
				where: { id: userId },
				data: updateData,
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
					rank: true,
					social: true,
				},
			});

			// Handle address updates if provided
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
						// Delete existing addresses and create new ones
						await tx.address.deleteMany({
							where: { userId: userId },
						});

						await tx.address.create({
							data: {
								userId: userId,
								type: address.type || "business",
								label: address.label || "",
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
					console.error("Address update failed:", addressError);
				}
			}

			// Handle product updates if provided (batch update for performance)
			const productsData = formData.get("products");
			if (productsData) {
				try {
					const products = JSON.parse(productsData as string);
					if (Array.isArray(products)) {
						// Update existing products or create new ones
						const updatePromises = products
							.map(async (product) => {
								if (product.id) {
									// Update existing product
									return tx.product.update({
										where: {
											id: product.id,
											sellerId: userId, // Ensure seller owns the product
										},
										data: {
											name: product.name,
											category: Array.isArray(product.category)
												? product.category
												: [product.category || "general"],
											pricePerUnit: parseFloat(product.pricePerUnit),
											availableQty: parseInt(product.availableQty),
											description: product.description || "",
											status: product.status || "active",
										},
									});
								} else if (
									product.name &&
									product.pricePerUnit &&
									product.availableQty
								) {
									// Create new product
									return tx.product.create({
										data: {
											sellerId: userId,
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

						await Promise.all(updatePromises);
					}
				} catch (productsError) {
					console.error("Products update failed:", productsError);
				}
			}

			return updatedUser;
		});

		return NextResponse.json({
			success: true,
			message: "Seller user updated successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error updating seller user:", error);
		return NextResponse.json(
			{ error: "Failed to update seller user" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete seller user and all associated products
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get seller user with all media URLs for cleanup
		const userToDelete = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "seller",
			},
			select: {
				id: true,
				name: true,
				profileImageUrl: true,
				bannerImageUrl: true,
				images: {
					select: {
						url: true,
					},
				},
				products: {
					select: {
						images: true,
						videos: true,
					},
				},
				posts: {
					select: {
						media: {
							select: {
								url: true,
							},
						},
					},
				},
			},
		});

		if (!userToDelete) {
			return NextResponse.json(
				{ error: "Seller user not found" },
				{ status: 404 }
			);
		}

		// Collect all media URLs for deletion
		const mediaUrls: string[] = [];

		if (userToDelete.profileImageUrl) {
			mediaUrls.push(userToDelete.profileImageUrl);
		}

		if (userToDelete.bannerImageUrl) {
			mediaUrls.push(userToDelete.bannerImageUrl);
		}

		userToDelete.images.forEach((image) => {
			mediaUrls.push(image.url);
		});

		// Add product images and videos
		userToDelete.products.forEach((product) => {
			if (Array.isArray(product.images)) {
				mediaUrls.push(...product.images);
			}
			if (Array.isArray(product.videos)) {
				mediaUrls.push(...product.videos);
			}
		});

		userToDelete.posts.forEach((post) => {
			post.media.forEach((media) => {
				mediaUrls.push(media.url);
			});
		});

		// Delete user and related data (Prisma handles cascade deletes)
		await prisma.user.delete({
			where: { id: userId },
		});

		// Delete associated S3 media (async, don't wait)
		if (mediaUrls.length > 0) {
			deleteS3Media(mediaUrls).catch((err) => {
				console.error("Failed to delete S3 media:", err);
			});
		}

		return NextResponse.json({
			success: true,
			message: "Seller user and all associated products deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting seller user:", error);

		if (
			error instanceof Error &&
			error.message.includes("Record to delete does not exist")
		) {
			return NextResponse.json(
				{ error: "Seller user not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to delete seller user" },
			{ status: 500 }
		);
	}
}
