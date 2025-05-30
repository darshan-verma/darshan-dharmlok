import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	console.log(`[Middleware] ${request.method} ${pathname}`);

	// For now, let all requests through
	return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
	matcher: ["/admin/:path*", "/auth/:path*", "/api/auth/:path*"],
};
