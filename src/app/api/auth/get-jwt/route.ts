import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const token = await getToken({ req, raw: true });
	if (!token) {
		return NextResponse.json({ error: "No token found" }, { status: 401 });
	}
	return NextResponse.json({ token });
}
