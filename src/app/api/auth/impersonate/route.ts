import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const { userId } = await req.json();
		if (!userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}

		// Find the user to impersonate
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Create a JWT token for the impersonated user (compatible with NextAuth)
		const tokenPayload = {
			id: user.id,
			email: user.email,
			name: user.name,
			role: (user.userType || "user").toLowerCase(),
		};

		const jwt = await encode({
			token: tokenPayload,
			secret: process.env.NEXTAUTH_SECRET!,
		});

		// Set the session cookie
		(await cookies()).set("next-auth.session-token", jwt, {
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Impersonation error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
