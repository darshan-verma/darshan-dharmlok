import prisma from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { email, password, name, phone, userType } = await req.json();
	if (!email || !password || !name || !phone) {
		return NextResponse.json(
			{ error: "Email, password, name, and phone are required" },
			{ status: 400 }
		);
	}

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		return NextResponse.json({ error: "User already exists" }, { status: 409 });
	}

	const hashed = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: {
			email,
			password: hashed,
			name,
			phone,
			userType: (userType || "user").toLowerCase(), // always store lowercase
		},
	});

	return NextResponse.json(
		{
			id: user.id,
			email: user.email,
		},
		{ status: 201 }
	);
}

export async function GET() {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				userType: true,
			},
		});
		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		if (error instanceof Error) {
			console.error("GET /register error:", error);
			return NextResponse.json(
				{ error: "Internal Server Error", details: error.message },
				{ status: 500 }
			);
		} else {
			return NextResponse.json(
				{ error: "Internal Server Error", details: "Unknown error" },
				{ status: 500 }
			);
		}
	}
}

export async function PUT(req: Request) {
	try {
		const { email, name, phone } = await req.json();
		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}
		const user = await prisma.user.update({
			where: { email },
			data: { name, phone },
		});
		return NextResponse.json(
			{ id: user.id, email: user.email, name: user.name, phone: user.phone },
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof Error) {
			console.error("PUT /register error:", error);
			return NextResponse.json(
				{ error: "Internal Server Error", details: error.message },
				{ status: 500 }
			);
		} else {
			return NextResponse.json(
				{ error: "Internal Server Error", details: "Unknown error" },
				{ status: 500 }
			);
		}
	}
}
export async function DELETE(req: Request) {
	try {
		const { email } = await req.json();
		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}
		await prisma.user.delete({ where: { email } });
		return NextResponse.json({ message: "User deleted" }, { status: 200 });
	} catch (error) {
		if (error instanceof Error) {
			console.error("DELETE /register error:", error);
			return NextResponse.json(
				{ error: "Internal Server Error", details: error.message },
				{ status: 500 }
			);
		} else {
			return NextResponse.json(
				{ error: "Internal Server Error", details: "Unknown error" },
				{ status: 500 }
			);
		}
	}
}
