import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(_: NextRequest) {
	// Read the admin session token from the secure cookie
	const cookieStore = await cookies();
	const adminToken = cookieStore.get("admin-session-token")?.value;
	if (!adminToken) {
		return NextResponse.json(
			{ error: "No admin session token found" },
			{ status: 400 }
		);
	}
	// Prepare response and set cookies
	const response = NextResponse.json({ success: true });
	// Restore the session cookie to the admin token
	response.cookies.set("next-auth.session-token", adminToken, {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60,
	});
	// Remove the admin-session-token cookie
	response.cookies.set("admin-session-token", "", {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
	});
	return response;
}
