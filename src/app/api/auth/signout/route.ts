import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
	try {
		// Clear the authentication token or session
		// If you're using HTTP-only cookies:
		const cookieStore = await cookies();
		cookieStore.delete("auth-token");

		// If you're using NextAuth.js, you would typically use signOut()
		// But since we're handling our own auth, we'll just clear the token

		return NextResponse.json(
			{ message: "Successfully logged out" },
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json(
			{
				error: "Failed to log out",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500, headers: { "Content-Type": "application/json" } }
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
