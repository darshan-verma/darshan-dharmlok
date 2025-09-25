import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";
import bcrypt from "bcrypt";
// Helper to delete S3 objects
async function deleteS3Media(mediaUrls: string[]) {
	if (!mediaUrls.length) return;
	const bucket = process.env.AWS_S3_BUCKET;
	if (!bucket) return;
	await Promise.all(
		mediaUrls.map(async (url) => {
			// Extract key from URL
			const key = url.split(`${bucket}/`)[1] || url.split("/").pop();
			if (!key) return;
			try {
				await s3Client.send(
					new DeleteObjectCommand({ Bucket: bucket, Key: key })
				);
			} catch (err) {
				// Log error, but don't block
				console.error("S3 delete error:", err);
			}
		})
	);
}
export async function DELETE(request: Request) {
	try {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Find user and related media
		const user = await prisma.user.findUnique({
			where: { id },
			include: {
				images: true,
				videos: true,
			},
		});
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Gather media URLs
		const imageUrls = (user.images || []).map((img) => img.url).filter(Boolean);
		// For videos, collect both videoFile and thumbnailUrl
		const videoFileUrls = (user.videos || [])
			.map((vid) => vid.videoFile)
			.filter(Boolean);
		const videoThumbUrls = (user.videos || [])
			.map((vid) => vid.thumbnailUrl)
			.filter(Boolean);
		const videoUrls = [...videoFileUrls, ...videoThumbUrls];
		const hasMedia = imageUrls.length > 0 || videoUrls.length > 0;

		// Delete media records from DB
		await prisma.image.deleteMany({ where: { userId: id } });
		await prisma.video.deleteMany({ where: { userId: id } });

		// Delete all addresses related to the user
		await prisma.address.deleteMany({ where: { userId: id } });

		// Delete user
		await prisma.user.delete({ where: { id } });

		// Async S3 deletion (fire and forget)
		setTimeout(() => {
			// Ensure only strings are passed (filter out nulls)
			const allMediaUrls = [...imageUrls, ...videoUrls].filter(
				(url): url is string => typeof url === "string"
			);
			deleteS3Media(allMediaUrls);
		}, 0);

		return NextResponse.json({
			message: "User and associated media deleted successfully",
			hasMedia,
			imageCount: imageUrls.length,
			videoCount: videoFileUrls.length,
			videoThumbnailCount: videoThumbUrls.length,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete user",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// Helper function to validate user data
const validateUserData = (
	data: Prisma.UserCreateInput,
	isUpdate: boolean = false
) => {
	const errors: Record<string, string> = {};

	if (!isUpdate || "name" in data) {
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}
	}

	if (!isUpdate || "email" in data) {
		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}
	}

	if (!isUpdate || "phone" in data) {
		if (!data.phone) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit Indian phone number";
		}
	}

	if (Object.keys(errors).length > 0) {
		throw new Error(JSON.stringify(errors));
	}
};

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		const mediaInfo = url.searchParams.get("mediaInfo");
		if (id && mediaInfo === "true") {
			// Return media info for a single user
			const user = await prisma.user.findUnique({
				where: { id },
				include: {
					images: true,
					videos: true,
				},
			});
			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}
			const imageUrls = (user.images || [])
				.map((img) => img.url)
				.filter(Boolean);
			const videoFileUrls = (user.videos || [])
				.map((vid) => vid.videoFile)
				.filter(Boolean);
			const videoThumbUrls = (user.videos || [])
				.map((vid) => vid.thumbnailUrl)
				.filter(Boolean);
			const videoUrls = [...videoFileUrls, ...videoThumbUrls];
			const hasMedia = imageUrls.length > 0 || videoUrls.length > 0;
			return NextResponse.json({
				hasMedia,
				imageCount: imageUrls.length,
				videoCount: videoFileUrls.length,
				videoThumbnailCount: videoThumbUrls.length,
			});
		}

		// ...existing code for user list and pagination...
		const userType = url.searchParams.get("userType");
		const status = url.searchParams.get("status");
		const limit = url.searchParams.get("limit")
			? parseInt(url.searchParams.get("limit") || "50")
			: 50;
		const page = url.searchParams.get("page")
			? parseInt(url.searchParams.get("page") || "1")
			: 1;
		const skip = (page - 1) * limit;

		const whereConditions: Prisma.UserWhereInput = {};
		if (userType) {
			whereConditions.userType = {
				equals: userType,
				mode: "insensitive",
			};
		}
		if (status) {
			whereConditions.status = status;
		}
		const totalCount = await prisma.user.count({
			where: whereConditions,
		});
		const users = await prisma.user.findMany({
			where: whereConditions,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				typeVendor: true,
				profileImageUrl: true,
				bio: true,
				category: true,
				social: true,
				active: true,
				rank: true,
				kycApproved: true,
				status: true,
				isLoggedIn: true,
				lastLoginAt: true,
				lastLogoutAt: true,
				createdAt: true,
				serviceOfferings: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		});
		return NextResponse.json({
			users,
			pagination: {
				total: totalCount,
				page,
				limit,
				totalPages: Math.ceil(totalCount / limit),
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch users",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const data = await request.json();

		// Validate required fields
		validateUserData(data, false);

		// Check if user with email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 }
			);
		}

		// Hash password before saving
		let hashedPassword = "";
		if (data.password) {
			hashedPassword = await bcrypt.hash(data.password, 7);
		}

		// Create new user
		const userData = {
			name: data.name,
			email: data.email,
			phone: data.phone,
			userType: data.userType,
			typeVendor: data.typeVendor,
			category: data.category,
			bio: data.bio,
			rank: data.rank || "",
			kycApproved: data.isApproved ? 1 : 0,
			status: data.status || "Active",
			active: 1,
			social: 0,
			password: hashedPassword,
		};

		const user = await prisma.user.create({
			data: userData,
		});

		return NextResponse.json(
			{
				message: "User created successfully",
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					status: user.status,
					rank: user.rank,
					isApproved: user.kycApproved === 1,
				},
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		const err = error as { message?: string };

		if (err.message?.startsWith('{"')) {
			return NextResponse.json(
				{ error: "Validation failed", details: JSON.parse(err.message) },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to create user",
				details: err.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { id, ...data } = await request.json();

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required for update" },
				{ status: 400 }
			);
		}

		// Validate user data
		validateUserData(data, true);

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update user - explicitly handle rank field
		const updateData: Prisma.UserUpdateInput = {
			...(data.name !== undefined && { name: data.name }),
			...(data.email !== undefined && { email: data.email }),
			...(data.phone !== undefined && { phone: data.phone }),
			...(data.userType !== undefined && { userType: data.userType }),
			...(data.typeVendor !== undefined && { typeVendor: data.typeVendor }),
			...(data.category !== undefined && { category: data.category }),
			...(data.bio !== undefined && { bio: data.bio }),
			// Explicitly set rank, ensuring it's included even if empty string
			rank: data.rank || "",
			...(data.isApproved !== undefined && {
				kycApproved: data.isApproved ? 1 : 0,
			}),
			...(data.status !== undefined && { status: data.status }),
		};

		const updatedUser = await prisma.user.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json({
			message: "User updated successfully",
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			phone: updatedUser.phone,
			userType: updatedUser.userType,
			typeVendor: updatedUser.typeVendor,
			profileImageUrl: updatedUser.profileImageUrl,
			bio: updatedUser.bio,
			category: updatedUser.category,
			social: updatedUser.social,
			active: updatedUser.active,
			rank: updatedUser.rank,
			kycApproved: updatedUser.kycApproved,
			status: updatedUser.status,
			isLoggedIn: updatedUser.isLoggedIn,
			lastLoginAt: updatedUser.lastLoginAt,
			lastLogoutAt: updatedUser.lastLogoutAt,
			createdAt: updatedUser.createdAt,
		});
	} catch (error: unknown) {
		const err = error as { message?: string };

		if (err.message?.startsWith('{"')) {
			return NextResponse.json(
				{ error: "Validation failed", details: JSON.parse(err.message) },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to update user",
				details: err.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}
