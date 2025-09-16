import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";
import { PoojaCategory, UserUpdateData } from "@/types/user";

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

// GET - Get individual panditji user by ID with service offerings
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

		// Get panditji user with comprehensive data including service offerings
		const user = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "panditji",
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
				category: true,
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
						serviceOfferings: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Panditji user not found" },
				{ status: 404 }
			);
		}

		// Get related pooja categories if user offers pooja services
		const poojaServices = user.serviceOfferings.filter(
			(service) =>
				service.serviceType === "pooja" &&
				service.targetType === "PoojaCategory"
		);

		let poojaCategories: PoojaCategory[] = [];
		if (poojaServices.length > 0) {
			const categoryIds = poojaServices
				.map((service) => service.targetId)
				.filter(Boolean);
			if (categoryIds.length > 0) {
				poojaCategories = await prisma.poojaCategory.findMany({
					where: {
						id: {
							in: categoryIds,
						},
						status: "Active",
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						details: true,
					},
				});
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				...user,
				poojaCategories,
			},
		});
	} catch (error) {
		console.error("Error fetching panditji user:", error);
		return NextResponse.json(
			{ error: "Failed to fetch panditji user" },
			{ status: 500 }
		);
	}
}

// PUT - Update panditji user with service offerings
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

		// Check if panditji user exists
		const existingUser = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "panditji",
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
				{ error: "Panditji user not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();
		console.log(
			"PUT /api/users/panditji/[id] formData keys:",
			Array.from(formData.keys())
		);

		// Extract update data
		const updateData: UserUpdateData = {
			name: formData.get("name") as string,
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			category: (formData.get("category") as string) || "",
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

		// Handle profile image upload (only if file is provided in the formData)
		const profileImageUrl = formData.get("profileImageUrl") as string;
		if (profileImageUrl) {
			updateData.profileImageUrl = profileImageUrl;
		}

		// Handle banner image upload (only if file is provided in the formData)
		const bannerImageUrl = formData.get("bannerImageUrl") as string;
		if (bannerImageUrl) {
			updateData.bannerImageUrl = bannerImageUrl;
		}

		// Use transaction to update user and related data
		const result = await prisma.$transaction(async (tx) => {
			// Update panditji user
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
								type: address.type || "home",
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

			// Handle service offerings update if provided
			const servicesData = formData.get("services");
			if (servicesData) {
				try {
					const services = JSON.parse(servicesData as string);
					if (Array.isArray(services)) {
						// Delete existing service offerings
						await tx.serviceOffering.deleteMany({
							where: { providerId: userId },
						});

						// Create new service offerings
						const servicePromises = services
							.map((service) => {
								if (service.serviceType && service.price) {
									return tx.serviceOffering.create({
										data: {
											providerId: userId,
											serviceType: service.serviceType,
											targetType: service.targetType || "general",
											targetId: service.targetId || "",
											price: parseFloat(service.price.toString()),
											details: service.details || "",
											metadata: service.metadata || {},
											status: service.status || "Active",
										},
									});
								}
							})
							.filter(Boolean);

						await Promise.all(servicePromises);
					}
				} catch (servicesError) {
					console.error("Services update failed:", servicesError);
				}
			}

			return updatedUser;
		});

		return NextResponse.json({
			success: true,
			message: "Panditji user updated successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error updating panditji user:", error);
		return NextResponse.json(
			{ error: "Failed to update panditji user" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete panditji user
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

		// Get panditji user with media URLs for cleanup
		const userToDelete = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "panditji",
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
				{ error: "Panditji user not found" },
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
			message: "Panditji user deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting panditji user:", error);

		if (
			error instanceof Error &&
			error.message.includes("Record to delete does not exist")
		) {
			return NextResponse.json(
				{ error: "Panditji user not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to delete panditji user" },
			{ status: 500 }
		);
	}
}
