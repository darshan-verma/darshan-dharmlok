import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

		// Validate required fields
		if (!data.name || !data.email || !data.phone) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Update user data - userType and status are not included as they're not editable by users
		try {
			// First, update the user's basic information
			const updatedUser = await prisma.user.update({
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
