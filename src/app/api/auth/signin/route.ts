// /app/api/auth/signin/route.ts

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	console.log("[SignIn] Received request");

	try {
		// Log request headers for debugging
		console.log("[SignIn] Headers:", Object.fromEntries(req.headers.entries()));

		// Parse request body
		let body;
		try {
			body = await req.json();
			console.log("[SignIn] Request body:", {
				...body,
				password: body?.password ? "[REDACTED]" : "undefined",
			});
		} catch (parseError) {
			console.error("[SignIn] Error parsing JSON:", parseError);
			return NextResponse.json(
				{ error: "Invalid JSON payload" },
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const { email, password } = body;

		// 1) Validate input
		if (!email || !password) {
			console.error("[SignIn] Missing required fields:", {
				email: !!email,
				password: !!password,
			});
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// 2) Lookup user
		console.log("[SignIn] Looking up user:", email);
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (!user) {
			console.error("[SignIn] User not found:", email);
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		// 3) Verify password
		console.log("[SignIn] Verifying password for user:", user.id);
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			console.error("[SignIn] Invalid password for user:", user.id);
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		// 4) Prepare response
		const { password: _, ...safeUser } = user;
		console.log("[SignIn] Authentication successful for user:", user.id);

		return NextResponse.json(
			{
				message: "Sign in successful",
				user: safeUser,
			},
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			}
		);
	} catch (error) {
		console.error("[SignIn] Unexpected error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
