import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/users/[id]
 * Retrieves a single user by ID with all associated data including addresses
 *
 * @param _request - Request object (unused)
 * @param context - Contains route parameters including user ID
 * @returns JSON response with user data or error message
 */
export async function GET(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_request: Request,
	context: { params: { id: string } }
) {
	try {
		const userId = context.params.id;

		// Validate userId format for MongoDB ObjectId (24 character hex string)
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

		try {
			// First check if user exists with minimal query to avoid field issues
			const userExists = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true },
			});

			if (!userExists) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Fetch complete user data with all fields and related addresses
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					// Basic user information
					id: true,
					name: true,
					email: true,
					phone: true,
					userType: true, // e.g., "Kathavachak", "Dharmguru"
					typeVendor: true,

					// Profile and media
					profileImageUrl: true,
					bio: true,
					coverImageUrl: true,

					// Classification and status
					category: true,
					rank: true,
					status: true, // Active/Inactive

					// Related addresses with complete information
					addresses: {
						select: {
							id: true,
							type: true, // home, work, other
							label: true, // custom label for "other" type
							line1: true,
							line2: true,
							city: true,
							state: true,
							country: true,
							pincode: true,
							createdAt: true,
							updatedAt: true,
						},
					},

					// Numerical fields
					social: true,
					active: true,
					availability: true,
					kycApproved: true, // 0 or 1 for boolean

					// Login and activity tracking
					isLoggedIn: true,
					lastLoginAt: true,
					lastLogoutAt: true,
					lastActiveAt: true,
					createdAt: true,
				},
			});

			return NextResponse.json(user);
		} catch (prismaError) {
			console.error("Prisma error during findUnique:", prismaError);

			if (prismaError instanceof Error) {
				console.error("Prisma error message:", prismaError.message);

				// Handle unknown field errors by falling back to basic fields
				if (prismaError.message.includes("Unknown field")) {
					try {
						// Fallback query with only essential fields
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

		// Detailed error logging for debugging
		if (error instanceof Error) {
			console.error("Error message:", error.message);
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

/**
 * PUT /api/users/[id]
 * Updates user information including addresses
 * Handles creation, updating, and deletion of addresses
 *
 * @param request - Request object containing updated user data
 * @param context - Contains route parameters including user ID
 * @returns JSON response with updated user data or error message
 */
export async function PUT(
	request: Request,
	context: { params: { id: string } }
) {
	try {
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

		// Parse request body
		let data;
		try {
			data = await request.json();
		} catch (parseError) {
			console.error("Error parsing request body:", parseError);
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		// Validate required fields if they are being updated
		if (
			(data.name !== undefined && !data.name) ||
			(data.email !== undefined && !data.email) ||
			(data.phone !== undefined && !data.phone)
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Update user data
		try {
			console.log("Updating user with data:", JSON.stringify(data, null, 2));
			console.log("Rank value before update:", data.rank);

			// Prepare update data with conditional field inclusion
			const updateData: Prisma.UserUpdateInput = {
				// Basic information updates (only if provided)
				...(data.name !== undefined && { name: data.name }),
				...(data.email !== undefined && { email: data.email }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.userType !== undefined && { userType: data.userType }),
				...(data.typeVendor !== undefined && { typeVendor: data.typeVendor }),

				// Profile and classification
				...(data.category !== undefined && { category: data.category }),
				...(data.profileImageUrl !== undefined && {
					profileImageUrl: data.profileImageUrl,
				}),
				...(data.coverImageUrl !== undefined && {
					coverImageUrl: data.coverImageUrl,
				}),
				...(data.bio !== undefined && { bio: data.bio }),

				// Explicitly include rank field (important for kathavachak/dharmguru)
				rank: data.rank || "",

				// Handle KYC approval (convert boolean to number for database)
				...(data.kycApproved !== undefined && {
					kycApproved:
						typeof data.kycApproved === "boolean"
							? data.kycApproved
								? 1
								: 0
							: data.kycApproved,
				}),
				// Alternative field name for approval status
				...(data.isApproved !== undefined && {
					kycApproved: data.isApproved ? 1 : 0,
				}),

				// Status and activity fields
				...(data.status !== undefined && { status: data.status }),
				...(data.social !== undefined && { social: data.social }),
				...(data.active !== undefined && { active: data.active }),
				...(data.availability !== undefined && {
					availability: data.availability,
				}),
			};

			console.log("Final update data:", JSON.stringify(updateData, null, 2));

			// Execute user update
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: updateData,
				select: {
					// Return all important fields after update
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
					social: true,
					active: true,
					rank: true,
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

			console.log("User updated with rank:", updatedUser.rank);

			// Handle address updates if addresses are provided
			if (data.addresses && Array.isArray(data.addresses)) {
				// Process each address in the array
				for (const addressData of data.addresses) {
					// Validate address type
					if (
						!addressData.type ||
						!["home", "work", "other"].includes(addressData.type)
					) {
						console.warn(
							`Skipping address with invalid type: ${addressData.type}`
						);
						continue;
					}

					// For 'other' type addresses, a label is required
					if (addressData.type === "other" && !addressData.label) {
						console.warn('Skipping "other" address with missing label');
						continue;
					}

					// Validate required address fields
					if (!addressData.line1 || !addressData.city || !addressData.country) {
						console.warn("Skipping address with missing required fields");
						continue;
					}

					if (addressData.id) {
						// Update existing address by ID
						await prisma.address.update({
							where: { id: addressData.id },
							data: {
								type: addressData.type,
								label: addressData.label,
								line1: addressData.line1,
								line2: addressData.line2 || null,
								city: addressData.city,
								state: addressData.state || null,
								country: addressData.country,
								pincode: addressData.pincode || null,
							},
						});
					} else {
						// Create new address (no ID means it's new)
						await prisma.address.create({
							data: {
								userId: userId, // Link to the user
								type: addressData.type,
								label: addressData.label,
								line1: addressData.line1,
								line2: addressData.line2 || null,
								city: addressData.city,
								state: addressData.state || null,
								country: addressData.country,
								pincode: addressData.pincode || null,
							},
						});
					}
				}

				// Delete addresses that were marked for deletion
				if (
					data.addressesToDelete &&
					Array.isArray(data.addressesToDelete) &&
					data.addressesToDelete.length > 0
				) {
					console.log("Deleting addresses:", data.addressesToDelete);

					await prisma.address.deleteMany({
						where: {
							id: { in: data.addressesToDelete }, // Delete by IDs
							userId: userId, // Ensure addresses belong to this user
						},
					});
				}

				// Fetch the updated user with the latest addresses after all operations
				const userWithUpdatedAddresses = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						// Complete user data with addresses
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
								updatedAt: true,
							},
						},
						social: true,
						active: true,
						rank: true,
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

				// Return the complete updated user data with addresses
				if (userWithUpdatedAddresses) {
					return NextResponse.json(userWithUpdatedAddresses);
				}
			}

			// Return updated user if no address operations were performed
			return NextResponse.json(updatedUser);
		} catch (prismaError) {
			console.error("Prisma error during update:", prismaError);

			if (prismaError instanceof Error) {
				console.error("Prisma error message:", prismaError.message);

				// Try a simpler update if there's a field issue
				if (prismaError.message.includes("Unknown field")) {
					try {
						// Fallback to basic field update only
						const basicUpdate = await prisma.user.update({
							where: { id: userId },
							data: {
								name: data.name,
								email: data.email,
								phone: data.phone,
								bio: data.bio || null,
							},
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
								bio: true,
							},
						});

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

		// Detailed error logging for debugging
		if (error instanceof Error) {
			console.error("Error message:", error.message);
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

/**
 * DELETE /api/users/[id]
 * Deletes a user and all associated data (addresses, etc.)
 * Uses cascade deletion to maintain data integrity
 *
 * @param _request - Request object (unused)
 * @param context - Contains route parameters including user ID
 * @returns JSON response with success message or error
 */
export async function DELETE(
	_request: Request,
	context: { params: { id: string } }
) {
	try {
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

		// Check if user exists before attempting deletion
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});

		if (!userExists) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Delete user's addresses first to avoid foreign key constraints
		// This ensures clean deletion without referential integrity issues
		await prisma.address.deleteMany({
			where: { userId: userId },
		});

		// Delete the user record
		await prisma.user.delete({
			where: { id: userId },
		});

		return NextResponse.json(
			{ message: "User deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting user:", error);

		return NextResponse.json(
			{
				error: "Failed to delete user",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
