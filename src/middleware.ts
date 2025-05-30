import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	console.log(`[Middleware] ${request.method} ${pathname}`);

	const token = await getToken({ req: request });
	console.log(token);
	if (!token) {
		console.log("No token found");
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}

	// For now, let all requests through
	return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
	matcher: ["/admin/:path*"],
};
