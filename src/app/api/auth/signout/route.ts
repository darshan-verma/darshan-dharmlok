import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	console.log("[SignOut] Received request");

	try {
		// Parse request body
		let body;
		try {
			body = await req.json();
			console.log("[SignOut] Request body:", body);
		} catch (parseError) {
			console.error("[SignOut] Error parsing JSON:", parseError);
			// If there's no body or it can't be parsed, just return success
			// This makes the API more forgiving for client implementations
			return NextResponse.json(
				{ message: "Sign out successful" },
				{ status: 200, headers: { "Content-Type": "application/json" } }
			);
		}

		const { userId } = body;

		// If userId is provided, update the user's logout status
		if (userId) {
			try {
				await prisma.user.update({
					where: { id: userId },
					data: {
						lastLogoutAt: new Date(),
						isLoggedIn: false,
					},
				});
				console.log("[SignOut] User logged out successfully:", userId);
			} catch (dbError) {
				// If the user update fails (e.g., invalid ID), log the error but don't fail the request
				console.error("[SignOut] Error updating user:", dbError);
			}
		} else {
			console.log("[SignOut] No userId provided, skipping database update");
		}

		return NextResponse.json(
			{ message: "Sign out successful" },
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
		console.error("[SignOut] Unexpected error:", error);
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
