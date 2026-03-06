import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/chat/socket-token
 * Returns a short-lived JWT for the client to authenticate with the socket server.
 * Socket server verifies this with NEXTAUTH_SECRET.
 */
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	const secret = process.env.NEXTAUTH_SECRET;
	if (!secret) {
		return NextResponse.json(
			{ message: "Server misconfiguration" },
			{ status: 500 }
		);
	}
	const token = jwt.sign(
		{ sub: session.user.id, id: session.user.id },
		secret,
		{ expiresIn: "1h" }
	);
	return NextResponse.json({ token });
}
