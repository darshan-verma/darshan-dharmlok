import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
	const session = await getServerSession(authOptions);
	const role = session?.user?.role?.toLowerCase();
	if (!session?.user?.id || role !== "admin") {
		return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
	}
	return { session, error: null };
}
