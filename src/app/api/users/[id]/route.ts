import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deleteUserWithRelations } from "@/lib/deleteUserWithRelations";
import { parseLangParam } from "@/lib/content-lang";
import {
	formatPanditjiResponse,
	prepareTranslationsForSave,
} from "@/lib/content-api";

/**
 * GET /api/users/[id]
 * Retrieves a single user by ID with all associated data including addresses
 *
 * @param _request - Request object (unused)
 * @param context - Contains route parameters including user ID
 * @returns JSON response with user data or error message
 */
export async function GET(
	// @typescript-eslint/no-unused-vars
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate userId format for MongoDB ObjectId (24 character hex string)
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			console.error("Invalid user ID format:", id);
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
				where: { id: id },
				select: { id: true },
			});

			if (!userExists) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Fetch complete user data with all fields and related addresses
			const user = await prisma.user.findUnique({
				where: { id: id },
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
					bannerImageUrl: true,

					// Classification and status
					category: true,
					description: true,
					translations: true,
					translationStatus: true,
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

					// Add fields for images and videos
					images: true,
					videos: true,
				},
			});

			if (user?.userType === "panditji") {
				const locale =
					parseLangParam(new URL(_request.url).searchParams.get("lang")) ?? "en";
				const formatted = formatPanditjiResponse(
					user as unknown as Record<string, unknown>,
					locale
				);
				return NextResponse.json({ ...user, ...formatted });
			}

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
							bannerImageUrl: true,
							bio: true,
							status: true,
							isLoggedIn: true,
							createdAt: true,
						};
						const basicUser = await prisma.user.findUnique({
							where: { id: id },
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
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate userId format for MongoDB ObjectId
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			console.error("Invalid user ID format:", id);
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
		// --- Handle images update ---
		// (Removed unused updatedImages logic)

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

			const existingUser = await prisma.user.findUnique({
				where: { id },
				select: {
					userType: true,
					translations: true,
					name: true,
					bio: true,
					description: true,
					category: true,
				},
			});

			// Prepare update data with conditional field inclusion
			const userUpdateData: Prisma.UserUpdateInput = {
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
				...(data.bannerImageUrl !== undefined && {
					bannerImageUrl: data.bannerImageUrl,
				}),
				...(data.coverImageUrl !== undefined && {
					coverImageUrl: data.coverImageUrl,
				}),
				...(data.bio !== undefined && { bio: data.bio }),
				...(data.description !== undefined && {
					description: data.description,
				}),

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

			// Add this to handle profileImageUrl removal
			if ("profileImageUrl" in data) {
				userUpdateData.profileImageUrl = data.profileImageUrl ?? null;
			}

			if (
				existingUser?.userType === "panditji" &&
				(data.translations !== undefined ||
					data.name !== undefined ||
					data.bio !== undefined ||
					data.description !== undefined ||
					data.category !== undefined)
			) {
				const { translations, translationStatus } = prepareTranslationsForSave(
					"panditji",
					data,
					existingUser
				);
				const enSlice = (translations.en ?? {}) as Record<string, unknown>;
				userUpdateData.translations = translations as object;
				userUpdateData.translationStatus = translationStatus;
				if (enSlice.name) userUpdateData.name = String(enSlice.name);
				if (enSlice.bio !== undefined) userUpdateData.bio = String(enSlice.bio);
				if (enSlice.description !== undefined) {
					userUpdateData.description = String(enSlice.description);
				}
				if (enSlice.category !== undefined) {
					userUpdateData.category = String(enSlice.category);
				}
			}

			console.log(
				"Final update data:",
				JSON.stringify(userUpdateData, null, 2)
			);

			// Execute user update
			const updatedUserMain = await prisma.user.update({
				where: { id: id },
				data: userUpdateData,
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

			console.log("User updated with rank:", updatedUserMain.rank);

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
								userId: id, // Link to the user
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
							userId: id, // Ensure addresses belong to this user
						},
					});
				}

				// Fetch the updated user with the latest addresses after all operations
				const userWithUpdatedAddresses = await prisma.user.findUnique({
					where: { id: id },
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

			// --- Add this block to support saving posts (images/videos) ---
			const updateData: Prisma.UserUpdateInput = {};
			if (data.name !== undefined) updateData.name = data.name;
			if (data.email !== undefined) updateData.email = data.email;
			if (data.phone !== undefined) updateData.phone = data.phone;
			if (data.bio !== undefined) updateData.bio = data.bio;
			if (data.profileImageUrl !== undefined)
				updateData.profileImageUrl = data.profileImageUrl;
			if (data.addresses !== undefined) updateData.addresses = data.addresses;

			// Remove any update to images or videos relation in user update
			// if (data.images !== undefined) updateData.images = data.images;
			// if (updatedImages !== undefined) updateData.images = updatedImages;

			// Execute user update
			const updatedUser = await prisma.user.update({
				where: { id: id },
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
							where: { id: id },
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
 * PATCH /api/users/[id]
 * Partially updates user fields (e.g., bio)
 *
 * @param request - Request object containing fields to update
 * @param context - Contains route parameters including user ID
 * @returns JSON response with updated user data or error message
 */
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate userId format for MongoDB ObjectId (24 character hex string)
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 }
			);
		}

		if (!prisma) {
			return NextResponse.json(
				{ error: "Database connection error" },
				{ status: 500 }
			);
		}

		let data;
		try {
			data = await request.json();
		} catch (_parseError) {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		// Only allow updating the bio field for PATCH
		if (typeof data.bio !== "string") {
			return NextResponse.json(
				{ error: "Missing or invalid 'bio' field" },
				{ status: 400 }
			);
		}

		const updatedUser = await prisma.user.update({
			where: { id },
			data: { bio: data.bio },
			select: {
				id: true,
				name: true,
				category: true,
				profileImageUrl: true,
				bio: true,
			},
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to update user bio",
				details: error instanceof Error ? error.message : error,
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
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		// Validate userId format for MongoDB ObjectId
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			console.error("Invalid user ID format:", id);
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
			where: { id: id },
			select: { id: true },
		});

		if (!userExists) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		await deleteUserWithRelations(id);

		return NextResponse.json(
			{ message: "User deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		// Log error and all nested Prisma errors for easier debugging
		console.error("Error deleting user:", error);
		if (error instanceof Error) {
			console.error("Error message:", error.message);
			if (error.stack) {
				console.error("Stack trace:", error.stack);
			}
			// Prisma errors may have a 'code' property
			if (isPrismaError(error)) {
				console.error("Prisma error code:", error.code);
				if (error.meta) {
					console.error("Prisma error meta:", error.meta);
				}
			}
		}
		return NextResponse.json(
			{
				error: "Failed to delete user",
				details: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				prismaCode: isPrismaError(error) ? error.code : undefined,
				prismaMeta: isPrismaError(error) ? error.meta : undefined,
			},
			{ status: 500 }
		);
	}

	// Helper type guard for Prisma errors
	function isPrismaError(
		error: unknown
	): error is Prisma.PrismaClientKnownRequestError {
		return (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			typeof (error as { code?: unknown }).code === "string"
		);
	}
}
