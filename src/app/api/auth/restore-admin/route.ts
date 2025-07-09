import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
	const { adminToken } = await req.json();
	if (!adminToken) {
		return NextResponse.json({ error: "Missing admin token" }, { status: 400 });
	}
	// Set the session cookie to the admin token
	(await cookies()).set("next-auth.session-token", adminToken, {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60,
	});
	return NextResponse.json({ success: true });
}
