import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToS3 } from "@/lib/uploadToS3";
import bcrypt from "bcrypt";
import s3Client from "@/lib/s3Client";
import { UserUpdateData } from "@/types/user";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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

// GET - Get individual kathavachak user by ID
export async function GET(
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

		// Get kathavachak user with comprehensive data
		const user = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "kathavachak",
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
				category: true,
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
				{ error: "Kathavachak user not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error fetching kathavachak user:", error);
		return NextResponse.json(
			{ error: "Failed to fetch kathavachak user" },
			{ status: 500 }
		);
	}
}

// PUT - Update kathavachak user
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

		// Check if kathavachak user exists
		const existingUser = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "kathavachak",
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
				{ error: "Kathavachak user not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();

		// Extract update data
		const updateData: UserUpdateData = {
			name: formData.get("name") as string,
			category: (formData.get("category") as string) || "",
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

		// Handle profile image upload or URL
		const profileImageFile = formData.get("profileImage") as File;
		const profileImageUrl = formData.get("profileImageUrl") as string;

		console.log("Profile image processing:", {
			hasFile: profileImageFile && profileImageFile.size > 0,
			receivedUrl: profileImageUrl,
			existingUrl: existingUser.profileImageUrl,
		});

		if (profileImageFile && profileImageFile.size > 0) {
			// Handle file upload
			try {
				const fileBuffer = Buffer.from(await profileImageFile.arrayBuffer());
				const fileName = `kathavachak-profiles/${Date.now()}-${
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
		} else if (
			profileImageUrl !== undefined &&
			profileImageUrl !== existingUser.profileImageUrl
		) {
			// Handle URL update (when image was uploaded separately) or clearing (empty string)
			updateData.profileImageUrl = profileImageUrl || undefined;
		}

		// Handle banner image upload or URL
		const bannerImageFile = formData.get("bannerImage") as File;
		const bannerImageUrl = formData.get("bannerImageUrl") as string;

		console.log("Banner image processing:", {
			hasFile: bannerImageFile && bannerImageFile.size > 0,
			receivedUrl: bannerImageUrl,
			existingUrl: existingUser.bannerImageUrl,
		});

		if (bannerImageFile && bannerImageFile.size > 0) {
			// Handle file upload
			try {
				const fileBuffer = Buffer.from(await bannerImageFile.arrayBuffer());
				const fileName = `kathavachak-banners/${Date.now()}-${
					bannerImageFile.name
				}`;
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
		} else if (
			bannerImageUrl !== undefined &&
			bannerImageUrl !== existingUser.bannerImageUrl
		) {
			// Handle URL update (when image was uploaded separately) or clearing (empty string)
			updateData.bannerImageUrl = bannerImageUrl || undefined;
		}

		// Update kathavachak user
		const updatedUser = await prisma.user.update({
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
				if (address.line1 && address.city && address.state && address.country) {
					// Delete existing addresses and create new ones
					await prisma.address.deleteMany({
						where: { userId: userId },
					});

					await prisma.address.create({
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
				// Don't fail the entire operation for address issues
			}
		}

		return NextResponse.json({
			success: true,
			message: "Kathavachak user updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error("Error updating kathavachak user:", error);
		return NextResponse.json(
			{ error: "Failed to update kathavachak user" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete kathavachak user
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

		// Get kathavachak user with media URLs for cleanup
		const userToDelete = await prisma.user.findFirst({
			where: {
				id: userId,
				userType: "kathavachak",
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
				{ error: "Kathavachak user not found" },
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
			message: "Kathavachak user deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting kathavachak user:", error);

		if (
			error instanceof Error &&
			error.message.includes("Record to delete does not exist")
		) {
			return NextResponse.json(
				{ error: "Kathavachak user not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to delete kathavachak user" },
			{ status: 500 }
		);
	}
}
