import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import { formatDharamshalaResponse } from "@/lib/content-api";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";
import { deleteUserWithRelations } from "@/lib/deleteUserWithRelations";
import { Dharamshala, UserUpdateData, RoomTypeCount } from "@/types/user";

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

// GET - Get individual hotel dharamshala vendor by ID with dharamshala integration
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: userId } = await params;
		const locale =
			parseLangParam(request.nextUrl.searchParams.get("lang")) ?? "en";

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get hotel dharamshala vendor user with comprehensive data
		const user = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "hotel_dharamshala_vendor",
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
				{ error: "Hotel Dharamshala Vendor user not found" },
				{ status: 404 }
			);
		}

		// Get related dharamshala information if vendor provides services for specific dharamshalas
		const dharamshalaServices = user.serviceOfferings.filter(
			(service) => service.targetType === "dharamshala" && service.targetId
		);

		let relatedDharamshalas: Dharamshala[] = [];
		if (dharamshalaServices.length > 0) {
			const dharamshalaIds = dharamshalaServices
				.map((service) => service.targetId)
				.filter(Boolean);
			if (dharamshalaIds.length > 0) {
				const rows = await prisma.dharamshala.findMany({
					where: {
						id: { in: dharamshalaIds },
						status: "active",
					},
				});
				relatedDharamshalas = rows.map((row) =>
					formatDharamshalaResponse(
						row as unknown as Record<string, unknown>,
						locale
					)
				) as unknown as Dharamshala[];
			}
		}

		// Get dharamshalas in the same city/state as the vendor for potential partnerships
		const vendorLocation = user.addresses[0];
		let nearbyDharamshalas: Dharamshala[] = [];
		if (vendorLocation) {
			const nearbyRows = await prisma.dharamshala.findMany({
				where: {
					OR: [
						{ city: vendorLocation.city },
						{ state: vendorLocation.state || "" },
					],
					status: "active",
				},
				take: 10,
			});
			nearbyDharamshalas = nearbyRows.map((row) =>
				formatDharamshalaResponse(
					row as unknown as Record<string, unknown>,
					locale
				)
			) as unknown as Dharamshala[];
		}

		// Calculate accommodation analytics
		const accommodationAnalytics = {
			totalServices: user.serviceOfferings.length,
			activeServices: user.serviceOfferings.filter((s) => s.status === "Active")
				.length,
			averagePrice:
				user.serviceOfferings.length > 0
					? user.serviceOfferings.reduce(
							(sum, service) => sum + service.price,
							0
					  ) / user.serviceOfferings.length
					: 0,
			serviceTypes: [
				...new Set(user.serviceOfferings.map((s) => s.targetType)),
			],
			dharamshalaConnections: dharamshalaServices.length,
			roomTypes: user.serviceOfferings
				.map((s) => {
					if (
						s.metadata &&
						typeof s.metadata === "object" &&
						!Array.isArray(s.metadata)
					) {
						const metadata = s.metadata as Record<string, unknown>;
						return metadata.roomType as string;
					}
					return null;
				})
				.filter((type): type is string => type !== null)
				.reduce((acc: RoomTypeCount, type) => {
					acc[type] = (acc[type] || 0) + 1;
					return acc;
				}, {}),
		};

		return NextResponse.json({
			success: true,
			data: {
				...user,
				relatedDharamshalas,
				nearbyDharamshalas,
				accommodationAnalytics,
			},
		});
	} catch (error) {
		console.error("Error fetching hotel dharamshala vendor user:", error);
		return NextResponse.json(
			{ error: "Failed to fetch hotel dharamshala vendor user" },
			{ status: 500 }
		);
	}
}

// PUT - Update hotel dharamshala vendor user with accommodation services
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: userId } = await params;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Check if hotel dharamshala vendor user exists
		const existingUser = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "hotel_dharamshala_vendor",
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
				{ error: "Hotel Dharamshala Vendor user not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();

		// Extract update data
		const updateData: UserUpdateData = {
			name: formData.get("name") as string,
			bio: (formData.get("bio") as string) || "",
			description: (formData.get("description") as string) || "",
			typeVendor: formData.get("typeVendor") as string,
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
				const fileName = `vendor-profiles/${Date.now()}-${
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
				const fileName = `vendor-banners/${Date.now()}-${bannerImageFile.name}`;
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
			// Update hotel dharamshala vendor user
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
					typeVendor: true,
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

			// Handle accommodation services update if provided
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
								if (service.price) {
									return tx.serviceOffering.create({
										data: {
											providerId: userId,
											serviceType: "accommodation",
											targetType: service.targetType || "dharamshala",
											targetId: service.targetId || service.dharamshalaId || "",
											price: parseFloat(service.price),
											details: service.details || "",
											metadata: {
												roomType: service.roomType || "standard",
												capacity: parseInt(service.capacity) || 2,
												amenities: Array.isArray(service.amenities)
													? service.amenities
													: [],
												checkInTime: service.checkInTime || "14:00",
												checkOutTime: service.checkOutTime || "11:00",
												cancellationPolicy:
													service.cancellationPolicy || "24 hours",
												...service.metadata,
											},
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
			message: "Hotel Dharamshala Vendor user updated successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error updating hotel dharamshala vendor user:", error);
		return NextResponse.json(
			{ error: "Failed to update hotel dharamshala vendor user" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete hotel dharamshala vendor user
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: userId } = await params;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get hotel dharamshala vendor user with media URLs for cleanup
		const userToDelete = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "hotel_dharamshala_vendor",
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
				{ error: "Hotel Dharamshala Vendor user not found" },
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

		await deleteUserWithRelations(userId);

		// Delete associated S3 media (async, don't wait)
		if (mediaUrls.length > 0) {
			deleteS3Media(mediaUrls).catch((err) => {
				console.error("Failed to delete S3 media:", err);
			});
		}

		return NextResponse.json({
			success: true,
			message: "Hotel Dharamshala Vendor user deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting hotel dharamshala vendor user:", error);

		if (
			error instanceof Error &&
			error.message.includes("Record to delete does not exist")
		) {
			return NextResponse.json(
				{ error: "Hotel Dharamshala Vendor user not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to delete hotel dharamshala vendor user" },
			{ status: 500 }
		);
	}
}
