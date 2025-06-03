import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

		try {
			// First try with minimal fields to see if the user exists at all
			const userExists = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true },
			});

			if (!userExists) {
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

			return NextResponse.json(user);
		} catch (prismaError) {
			console.error("Prisma error during findUnique:", prismaError);
			if (prismaError instanceof Error) {
				console.error("Prisma error message:", prismaError.message);

				// Check if the error is related to unknown fields
				if (prismaError.message.includes("Unknown field")) {
					// Try again with basic fields only
					try {
						// Create a select object with only basic fields
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
		// More detailed error logging
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

		// Only validate required fields if they are being updated
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

			const updateData: Prisma.UserUpdateInput = {
				...(data.name !== undefined && { name: data.name }),
				...(data.email !== undefined && { email: data.email }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.userType !== undefined && { userType: data.userType }),
				...(data.typeVendor !== undefined && { typeVendor: data.typeVendor }),
				...(data.category !== undefined && { category: data.category }),
				...(data.profileImageUrl !== undefined && {
					profileImageUrl: data.profileImageUrl,
				}),
				...(data.coverImageUrl !== undefined && {
					coverImageUrl: data.coverImageUrl,
				}),
				...(data.bio !== undefined && { bio: data.bio }),
				// Explicitly include rank field
				rank: data.rank || "",
				...(data.kycApproved !== undefined && {
					kycApproved:
						typeof data.kycApproved === "boolean"
							? data.kycApproved
								? 1
								: 0
							: data.kycApproved,
				}),
				...(data.isApproved !== undefined && {
					kycApproved: data.isApproved ? 1 : 0,
				}),
				...(data.status !== undefined && { status: data.status }),
				...(data.social !== undefined && { social: data.social }),
				...(data.active !== undefined && { active: data.active }),
				...(data.availability !== undefined && {
					availability: data.availability,
				}),
			};

			console.log("Final update data:", JSON.stringify(updateData, null, 2));

			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: updateData,
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

			// Handle address updates if provided
			if (data.addresses && Array.isArray(data.addresses)) {
				// Process each address in the array
				for (const addressData of data.addresses) {
					if (
						!addressData.type ||
						!["home", "work", "other"].includes(addressData.type)
					) {
						console.warn(
							`Skipping address with invalid type: ${addressData.type}`
						);
						continue;
					}

					// For 'other' type, a label is required
					if (addressData.type === "other" && !addressData.label) {
						console.warn('Skipping "other" address with missing label');
						continue;
					}

					// Required fields validation
					if (!addressData.line1 || !addressData.city || !addressData.country) {
						console.warn("Skipping address with missing required fields");
						continue;
					}

					if (addressData.id) {
						// Update existing address
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
						// Create new address
						await prisma.address.create({
							data: {
								userId: userId,
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

				// Delete addresses that were removed (if any IDs were provided)
				if (data.addressesToDelete && Array.isArray(data.addressesToDelete)) {
					for (const addressId of data.addressesToDelete) {
						await prisma.address.delete({
							where: {
								id: addressId,
								userId: userId, // Ensure we only delete addresses belonging to this user
							},
						});
					}
				}

				// Fetch the updated user with the latest addresses
				const userWithUpdatedAddresses = await prisma.user.findUnique({
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

				// Return the complete updated user data
				if (userWithUpdatedAddresses) {
					return NextResponse.json(userWithUpdatedAddresses);
				}
			}

			return NextResponse.json(updatedUser);
		} catch (prismaError) {
			console.error("Prisma error during update:", prismaError);
			if (prismaError instanceof Error) {
				console.error("Prisma error message:", prismaError.message);

				// Try a simpler update if there's a field issue
				if (prismaError.message.includes("Unknown field")) {
					try {
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
		// More detailed error logging
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

		// Check if user exists
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});

		if (!userExists) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Delete user's addresses first to avoid foreign key constraints
		await prisma.address.deleteMany({
			where: { userId: userId },
		});

		// Delete the user
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
