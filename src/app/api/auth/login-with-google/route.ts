import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken"; // For creating a custom JWT if needed

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
	try {
		const { token } = await req.json(); // Expect { token: "google_id_token" } from Flutter

		if (!token) {
			return NextResponse.json({ error: "Token required" }, { status: 400 });
		}

		// Verify the Google token
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		if (!payload) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		const { email, name, picture } = payload;

		if (!email) {
			return NextResponse.json({ error: "Email required" }, { status: 400 });
		}

		// Check if user exists
		let user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Create new user
			user = await prisma.user.create({
				data: {
					email,
					name: name || "Unknown",
					phone: "", // Default empty for OAuth users
					password: "", // Not used for OAuth
					userType: "user", // Default; adjust as needed
					profileImageUrl: picture || null,
					emailVerified: new Date(), // Since verified by Google
					// Add other defaults if needed
				},
			});
		} else {
			// Update existing user if needed (e.g., profile image)
			user = await prisma.user.update({
				where: { email },
				data: {
					name: name || user.name,
					profileImageUrl: picture || user.profileImageUrl,
					emailVerified: new Date(),
				},
			});
		}

		// Generate a custom JWT for the session (optional, if not using NextAuth sessions)
		const jwtSecret = process.env.NEXTAUTH_SECRET || "fallback-secret";
		const sessionToken = sign(
			{ userId: user.id, email: user.email },
			jwtSecret,
			{ expiresIn: "7d" }
		);

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				userType: user.userType,
			},
			token: sessionToken, // Send back for Flutter to store
		});
	} catch (error) {
		console.error("Google login error:", error);
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 500 }
		);
	}
}
