import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";

// Helper to delete S3 objects
async function deleteS3Media(mediaUrls: string[]) {
	if (!mediaUrls.length) return;
	const bucket = process.env.AWS_S3_BUCKET;
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

/**
 * GET /api/users/dharmguru/[id]
 * Retrieves a single dharmguru by ID with optimized fields
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json(
				{ error: "Invalid dharmguru ID format" },
				{ status: 400 }
			);
		}

		const dharmguru = await prisma.user.findUnique({
			where: {
				id: id,
				userType: "Dharmguru", // Ensure it's a dharmguru
			},
			select: {
				// Dharmguru-specific fields
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
				coverImageUrl: true,
				status: true,
				kycApproved: true,
				isLoggedIn: true,
				lastLoginAt: true,
				createdAt: true,
				// Include addresses with full details
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
						createdAt: true,
					},
				},
				// Include media for dharmguru posts/content
				images: {
					select: {
						id: true,
						url: true,
						title: true,
						description: true,
						createdAt: true,
					},
				},
				videos: {
					select: {
						id: true,
						title: true,
						description: true,
						thumbnailUrl: true,
						videoFile: true,
						status: true,
						createdAt: true,
					},
				},
				// Include posts for dharmguru content
				posts: {
					select: {
						id: true,
						caption: true,
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
			},
		});

		if (!dharmguru) {
			return NextResponse.json(
				{ error: "Dharmguru not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(dharmguru);
	} catch (error) {
		console.error("Error fetching dharmguru:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dharmguru details" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/users/dharmguru/[id]
 * Updates dharmguru information with optimized validation
 */
export async function PUT(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const data = await request.json();

		// Validate ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json(
				{ error: "Invalid dharmguru ID format" },
				{ status: 400 }
			);
		}

		// Check if dharmguru exists
		const existingDharmguru = await prisma.user.findUnique({
			where: { id, userType: "Dharmguru" },
			select: { id: true },
		});

		if (!existingDharmguru) {
			return NextResponse.json(
				{ error: "Dharmguru not found" },
				{ status: 404 }
			);
		}

		// Prepare dharmguru-specific update data
		const updateData: Prisma.UserUpdateInput = {
			...(data.name !== undefined && { name: data.name }),
			...(data.email !== undefined && { email: data.email }),
			...(data.phone !== undefined && { phone: data.phone }),
			...(data.category !== undefined && { category: data.category }),
			...(data.rank !== undefined && { rank: data.rank }),
			...(data.bio !== undefined && { bio: data.bio }),
			...(data.profileImageUrl !== undefined && {
				profileImageUrl: data.profileImageUrl,
			}),
			...(data.bannerImageUrl !== undefined && {
				bannerImageUrl: data.bannerImageUrl,
			}),
			...(data.coverImageUrl !== undefined && {
				coverImageUrl: data.coverImageUrl,
			}),
			...(data.status !== undefined && { status: data.status }),
			...(data.kycApproved !== undefined && {
				kycApproved:
					typeof data.kycApproved === "boolean"
						? data.kycApproved
							? 1
							: 0
						: data.kycApproved,
			}),
		};

		// Handle address updates efficiently
		if (data.addresses && Array.isArray(data.addresses)) {
			// Delete addresses marked for deletion
			if (data.addressesToDelete && data.addressesToDelete.length > 0) {
				await prisma.address.deleteMany({
					where: {
						id: { in: data.addressesToDelete },
						userId: id,
					},
				});
			}

			// Process address updates/creates
			for (const addressData of data.addresses) {
				if (addressData.id) {
					// Update existing address
					await prisma.address.update({
						where: { id: addressData.id },
						data: {
							type: addressData.type,
							label: addressData.label,
							line1: addressData.line1,
							line2: addressData.line2,
							city: addressData.city,
							state: addressData.state,
							country: addressData.country,
							pincode: addressData.pincode,
						},
					});
				} else {
					// Create new address
					await prisma.address.create({
						data: {
							userId: id,
							type: addressData.type,
							label: addressData.label,
							line1: addressData.line1,
							line2: addressData.line2,
							city: addressData.city,
							state: addressData.state,
							country: addressData.country,
							pincode: addressData.pincode,
						},
					});
				}
			}
		}

		// Update dharmguru
		const updatedDharmguru = await prisma.user.update({
			where: { id },
			data: updateData,
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
				coverImageUrl: true,
				status: true,
				kycApproved: true,
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
			},
		});

		return NextResponse.json(updatedDharmguru);
	} catch (error) {
		console.error("Error updating dharmguru:", error);

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				return NextResponse.json(
					{ error: "Email already exists" },
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to update dharmguru" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/users/dharmguru/[id]
 * Deletes a dharmguru and all associated data
 */
export async function DELETE(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json(
				{ error: "Invalid dharmguru ID format" },
				{ status: 400 }
			);
		}

		// Find dharmguru with associated media
		const dharmguru = await prisma.user.findUnique({
			where: { id, userType: "Dharmguru" },
			include: {
				images: { select: { url: true } },
				videos: { select: { videoFile: true, thumbnailUrl: true } },
			},
		});

		if (!dharmguru) {
			return NextResponse.json(
				{ error: "Dharmguru not found" },
				{ status: 404 }
			);
		}

		// Collect media URLs for S3 deletion
		const mediaUrls: string[] = [];

		// Add image URLs
		dharmguru.images.forEach((img) => {
			if (img.url) mediaUrls.push(img.url);
		});

		// Add video URLs
		dharmguru.videos.forEach((vid) => {
			if (vid.videoFile) mediaUrls.push(vid.videoFile);
			if (vid.thumbnailUrl) mediaUrls.push(vid.thumbnailUrl);
		});

		// Delete all related data in transaction
		await prisma.$transaction([
			// Delete comments first (foreign key constraints)
			prisma.comment.deleteMany({ where: { userId: id } }),
			// Delete posts and their media
			prisma.media.deleteMany({
				where: { post: { userId: id } },
			}),
			prisma.post.deleteMany({ where: { userId: id } }),
			// Delete images and videos
			prisma.image.deleteMany({ where: { userId: id } }),
			prisma.video.deleteMany({ where: { userId: id } }),
			// Delete addresses
			prisma.address.deleteMany({ where: { userId: id } }),
			// Finally delete the dharmguru
			prisma.user.delete({ where: { id } }),
		]);

		// Async S3 cleanup (fire and forget)
		if (mediaUrls.length > 0) {
			setTimeout(() => {
				deleteS3Media(mediaUrls);
			}, 0);
		}

		return NextResponse.json(
			{ message: "Dharmguru deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting dharmguru:", error);
		return NextResponse.json(
			{ error: "Failed to delete dharmguru" },
			{ status: 500 }
		);
	}
}
