// import { NextRequest, NextResponse } from "next/server";
// import { encode } from "next-auth/jwt";
// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest) {
// 	try {
// 		const { userId } = await req.json();
// 		if (!userId) {
// 			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
// 		}

// 		// Get the current admin session token from cookies
// 		const cookieStore = await cookies();
// 		const adminToken =
// 			cookieStore.get("next-auth.session-token")?.value ||
// 			cookieStore.get("__Secure-next-auth.session-token")?.value;
// 		if (!adminToken) {
// 			return NextResponse.json(
// 				{ error: "No admin session found" },
// 				{ status: 401 }
// 			);
// 		}

// 		// Find the user to impersonate
// 		const user = await prisma.user.findUnique({ where: { id: userId } });
// 		if (!user) {
// 			return NextResponse.json({ error: "User not found" }, { status: 404 });
// 		}

// 		// Create a JWT token for the impersonated user (compatible with NextAuth)
// 		const tokenPayload = {
// 			sub: user.id,
// 			id: user.id,
// 			email: user.email,
// 			name: user.name,
// 			role: (user.userType || "user").toLowerCase(),
// 		};

// 		const jwt = await encode({
// 			token: tokenPayload,
// 			secret: process.env.NEXTAUTH_SECRET!,
// 		});

// 		// Prepare response and set cookies
// 		const response = NextResponse.json({ success: true });
// 		// Save the admin token in a secure, HttpOnly cookie for later restore
// 		response.cookies.set("admin-session-token", adminToken, {
// 			httpOnly: true,
// 			path: "/",
// 			sameSite: "lax",
// 			secure: process.env.NODE_ENV === "production",
// 			maxAge: 60 * 60,
// 		});
// 		// Set the session cookie to impersonated user
// 		response.cookies.set("next-auth.session-token", jwt, {
// 			httpOnly: true,
// 			path: "/",
// 			sameSite: "lax",
// 			secure: process.env.NODE_ENV === "production",
// 			maxAge: 60 * 60,
// 		});
// 		return response;
// 	} catch (err) {
// 		console.error("Impersonation error:", err);
// 		return NextResponse.json(
// 			{ error: "Internal server error" },
// 			{ status: 500 }
// 		);
// 	}
// }

import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const adminToken =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!adminToken) {
      return NextResponse.json(
        { error: "No admin session found" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create impersonated JWT compatible with NextAuth
    const tokenPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user.userType || "user").toLowerCase(),
    };

    const jwt = await encode({
      token: tokenPayload,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Determine correct cookie name
    const sessionCookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    const response = NextResponse.json({ success: true });

    // Save admin token for later restore
    response.cookies.set("admin-session-token", adminToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });

    // Set impersonated user session token
    response.cookies.set(sessionCookieName, jwt, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (err) {
    console.error("Impersonation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
