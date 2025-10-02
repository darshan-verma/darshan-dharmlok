import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper function to validate trainer data
const validateTrainerData = (
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
		const status = url.searchParams.get("status");
		const limit = url.searchParams.get("limit")
			? parseInt(url.searchParams.get("limit") || "50")
			: 50;
		const page = url.searchParams.get("page")
			? parseInt(url.searchParams.get("page") || "1")
			: 1;
		const skip = (page - 1) * limit;

		const whereConditions: Prisma.UserWhereInput = {
			userType: {
				equals: "trainer",
				mode: "insensitive",
			},
		};

		if (status) {
			whereConditions.status = status;
		}

		const totalCount = await prisma.user.count({
			where: whereConditions,
		});

		const trainers = await prisma.user.findMany({
			where: whereConditions,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				bio: true,
				category: true,
				coverImageUrl: true,
				status: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		});

		return NextResponse.json({
			users: trainers,
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
				error: "Failed to fetch trainers",
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
		validateTrainerData(data, false);

		// Check if trainer with email already exists
		const existingTrainer = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingTrainer) {
			return NextResponse.json(
				{ error: "Trainer with this email already exists" },
				{ status: 400 }
			);
		}

		// Create new trainer
		const trainerData = {
			name: data.name,
			email: data.email,
			phone: data.phone,
			userType: "trainer",
			bio: data.bio,
			category: data.category,
			coverImageUrl: data.coverImageUrl,
			status: data.status || "Active",
			active: 1,
			social: 0,
			password: "", // Trainers might not need passwords initially
		};

		const trainer = await prisma.user.create({
			data: trainerData,
		});

		return NextResponse.json(
			{
				message: "Trainer created successfully",
				user: {
					id: trainer.id,
					name: trainer.name,
					email: trainer.email,
					phone: trainer.phone,
					bio: trainer.bio,
					category: trainer.category,
					coverImageUrl: trainer.coverImageUrl,
					status: trainer.status,
					createdAt: trainer.createdAt,
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
				error: "Failed to create trainer",
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
				{ error: "Trainer ID is required for update" },
				{ status: 400 }
			);
		}

		// Validate trainer data
		validateTrainerData(data, true);

		// Check if trainer exists
		const existingTrainer = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingTrainer) {
			return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
		}

		// Update trainer
		const updateData: Prisma.UserUpdateInput = {
			...(data.name !== undefined && { name: data.name }),
			...(data.email !== undefined && { email: data.email }),
			...(data.phone !== undefined && { phone: data.phone }),
			...(data.bio !== undefined && { bio: data.bio }),
			...(data.category !== undefined && { category: data.category }),
			...(data.coverImageUrl !== undefined && {
				coverImageUrl: data.coverImageUrl,
			}),
			...(data.status !== undefined && { status: data.status }),
		};

		const updatedTrainer = await prisma.user.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json({
			message: "Trainer updated successfully",
			id: updatedTrainer.id,
			name: updatedTrainer.name,
			email: updatedTrainer.email,
			phone: updatedTrainer.phone,
			bio: updatedTrainer.bio,
			category: updatedTrainer.category,
			coverImageUrl: updatedTrainer.coverImageUrl,
			status: updatedTrainer.status,
			createdAt: updatedTrainer.createdAt,
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
				error: "Failed to update trainer",
				details: err.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Trainer ID is required" },
				{ status: 400 }
			);
		}

		// Check if trainer exists
		const trainer = await prisma.user.findUnique({
			where: { id },
		});

		if (!trainer) {
			return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
		}

		// Delete trainer
		await prisma.user.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Trainer deleted successfully",
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete trainer",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
