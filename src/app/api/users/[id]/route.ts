import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_request: Request,
	context: { params: { id: string } }
) {
	try {
		console.log("GET request for user with ID:", context.params.id);
		const userId = context.params.id;

		// Validate userId format for MongoDB ObjectId
		if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
			console.error("Invalid user ID format:", userId);
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 }
			);
		}

		// Check if prisma client is available
		if (!prisma) {
			console.error("Prisma client is not initialized");
			return NextResponse.json(
				{ error: "Database connection error" },
				{ status: 500 }
			);
		}

		console.log("Attempting to find user in database with Prisma...");
		try {
			// Log the exact query we're about to execute
			console.log(
				`Executing Prisma query: prisma.user.findUnique({ where: { id: "${userId}" } })`
			);

			// First try with minimal fields to see if the user exists at all
			const userExists = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true },
			});

			if (!userExists) {
				console.log("User not found with ID:", userId);
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Now fetch the full user with all fields
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					userType: true,
					typeVendor: true,
					profileImageUrl: true,
					bio: true,
					coverImageUrl: true,
					category: true,
					address: true,
					city: true,
					state: true,
					country: true,
					social: true,
					active: true,
					rank: true,
					pincode: true,
					availability: true,
					kycApproved: true,
					status: true,
					isLoggedIn: true,
					lastLoginAt: true,
					lastLogoutAt: true,
					lastActiveAt: true,
					createdAt: true,
				},
			});

			// console.log("Prisma query completed");
			// console.log("User found successfully:", user.id);
			return NextResponse.json(user);
		} catch (prismaError) {
			console.error("Prisma error during findUnique:", prismaError);
			if (prismaError instanceof Error) {
				console.error("Prisma error name:", prismaError.name);
				console.error("Prisma error message:", prismaError.message);
				console.error("Prisma error stack:", prismaError.stack);

				// Check if the error is related to unknown fields
				if (prismaError.message.includes("Unknown field")) {
					// Extract the field name from the error message
					const fieldMatch = prismaError.message.match(
						/Unknown field `([^`]+)`/
					);
					const fieldName = fieldMatch ? fieldMatch[1] : "unknown";

					console.log(
						`Field '${fieldName}' not found in schema, trying without it`
					);

					// Try again without the problematic field
					try {
						// Create a dynamic select object excluding the problematic field
						const selectFields = {
							id: true,
							name: true,
							email: true,
							phone: true,
							userType: true,
							profileImageUrl: true,
							bio: true,
							status: true,
							isLoggedIn: true,
							createdAt: true,
						};

						const basicUser = await prisma.user.findUnique({
							where: { id: userId },
							select: selectFields,
						});

						if (basicUser) {
							console.log("Retrieved user with limited fields");
							return NextResponse.json(basicUser);
						}
					} catch (fallbackError) {
						console.error("Fallback query also failed:", fallbackError);
					}
				}
			}
			throw prismaError; // Re-throw to be caught by outer try-catch
		}
	} catch (error) {
		console.error("Error fetching user:", error);
		// More detailed error logging
		if (error instanceof Error) {
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);
		}
		return NextResponse.json(
			{
				error: "Failed to fetch user details",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	context: { params: { id: string } }
) {
	try {
		console.log("PUT request for user with ID:", context.params.id);
		const userId = context.params.id;

		// Validate userId format for MongoDB ObjectId
		if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
			console.error("Invalid user ID format:", userId);
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 }
			);
		}

		// Check if prisma client is available
		if (!prisma) {
			console.error("Prisma client is not initialized");
			return NextResponse.json(
				{ error: "Database connection error" },
				{ status: 500 }
			);
		}

		let data;
		try {
			data = await request.json();
			console.log("Update data received:", data);
		} catch (parseError) {
			console.error("Error parsing request body:", parseError);
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		// Validate required fields
		if (!data.name || !data.email || !data.phone || !data.address) {
			console.log("Missing required fields in update request");
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Update user data - userType and status are not included as they're not editable by users
		console.log("Attempting to update user in database...");
		try {
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: {
					name: data.name,
					email: data.email,
					phone: data.phone,
					address: data.address,
					bio: data.bio || null,
				},
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					userType: true,
					typeVendor: true,
					profileImageUrl: true,
					bio: true,
					coverImageUrl: true,
					category: true,
					address: true,
					city: true,
					state: true,
					country: true,
					social: true,
					active: true,
					rank: true,
					pincode: true,
					availability: true,
					kycApproved: true,
					status: true,
					isLoggedIn: true,
					lastLoginAt: true,
					lastLogoutAt: true,
					lastActiveAt: true,
					createdAt: true,
				},
			});

			console.log("User updated successfully:", updatedUser.id);
			return NextResponse.json(updatedUser);
		} catch (prismaError) {
			console.error("Prisma error during update:", prismaError);
			if (prismaError instanceof Error) {
				console.error("Prisma error name:", prismaError.name);
				console.error("Prisma error message:", prismaError.message);
				console.error("Prisma error stack:", prismaError.stack);

				// Try a simpler update if there's a field issue
				if (prismaError.message.includes("Unknown field")) {
					try {
						console.log("Attempting simplified update with basic fields only");
						const basicUpdate = await prisma.user.update({
							where: { id: userId },
							data: {
								name: data.name,
								email: data.email,
								phone: data.phone,
								address: data.address,
								bio: data.bio || null,
							},
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
								address: true,
								bio: true,
							},
						});

						console.log("Basic update successful");
						return NextResponse.json(basicUpdate);
					} catch (fallbackError) {
						console.error("Fallback update also failed:", fallbackError);
					}
				}
			}
			throw prismaError; // Re-throw to be caught by outer try-catch
		}
	} catch (error) {
		console.error("Error updating user:", error);
		// More detailed error logging
		if (error instanceof Error) {
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);
		}
		return NextResponse.json(
			{
				error: "Failed to update user",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
