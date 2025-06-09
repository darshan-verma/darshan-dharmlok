import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";

/**
 * POST /api/upload/profile-image
 * Handles profile image upload for users
 * Saves file to public/uploads/profile-images directory
 * Updates user's profileImageUrl in database
 */
export async function POST(request: NextRequest) {
	try {
		// Parse the multipart form data
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const userId = formData.get("userId") as string;

		// Validate required fields
		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Validate user ID format
		if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 }
			);
		}

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Validate file type
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error:
						"Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
				},
				{ status: 400 }
			);
		}

		// Validate file size (5MB limit)
		const maxSize = 5 * 1024 * 1024; // 5MB in bytes
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size too large. Maximum size is 5MB." },
				{ status: 400 }
			);
		}

		// Create upload directory if it doesn't exist
		const uploadDir = join(process.cwd(), "public/uploads/profile-images");
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const fileExtension = file.name.split(".").pop() || "jpg";
		const fileName = `${userId}-${timestamp}.${fileExtension}`;
		const filePath = join(uploadDir, fileName);

		// Convert file to buffer and save
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filePath, buffer);

		// Generate public URL for the image
		const imageUrl = `/uploads/profile-images/${fileName}`;

		// Update user's profile image URL in database
		await prisma.user.update({
			where: { id: userId },
			data: { profileImageUrl: imageUrl },
		});

		console.log(`Profile image uploaded for user ${userId}: ${imageUrl}`);

		return NextResponse.json({
			message: "Image uploaded successfully",
			imageUrl,
			fileName,
		});
	} catch (error) {
		console.error("Error uploading profile image:", error);

		return NextResponse.json(
			{
				error: "Failed to upload image",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/upload/profile-image
 * Removes profile image for a user
 * Clears profileImageUrl from database
 */
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Validate user ID format
		if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 }
			);
		}

		// Update user to remove profile image URL
		await prisma.user.update({
			where: { id: userId },
			data: { profileImageUrl: null },
		});

		console.log(`Profile image removed for user ${userId}`);

		return NextResponse.json({
			message: "Profile image removed successfully",
		});
	} catch (error) {
		console.error("Error removing profile image:", error);

		return NextResponse.json(
			{
				error: "Failed to remove image",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
