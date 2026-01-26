import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	useSecureCookies: process.env.NODE_ENV === "production",
	cookies: {
		sessionToken: {
			name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		callbackUrl: {
			name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		csrfToken: {
			name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		pkceCodeVerifier: {
			name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.pkce.code_verifier`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
				maxAge: 60 * 15, // 15 minutes
			},
		},
		state: {
			name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.state`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
				maxAge: 60 * 15, // 15 minutes
			},
		},
	},
	providers: [
		CredentialsProvider({
			id: "credentials",
			name: "Email & Password",
			credentials: {
				email: {
					label: "Email",
					type: "email",
					placeholder: "Enter your email",
				},
				password: {
					label: "Password",
					type: "password",
					placeholder: "Enter your password",
				},
			},
			async authorize(credentials) {
				console.log("Here at authorize");
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Invalid credentials");
				}
				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});
				if (!user) {
					throw new Error("No user found");
				}
				const isValid = await bcrypt.compare(
					credentials.password,
					user.password
				);
				if (!isValid) {
					throw new Error("Invalid credentials");
				}
				console.log(user);
				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: (user.userType || "user").toLowerCase(), // always lowercase
				};
			},
		}),
		GoogleProvider({
			clientId:
				process.env.GOOGLE_CLIENT_ID ||
				"463577754721-m3ovdcjhs71np6h74fih9uqlt84c5804.apps.googleusercontent.com",
			clientSecret:
				process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET_HERE", // Replace with actual secret
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code"
				}
			}
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			// Handle Google OAuth sign in
			if (account?.provider === "google") {
				try {
					console.log("Google signIn - user.image:", user.image);
					// Check if user exists
					const existingUser = await prisma.user.findUnique({
						where: { email: user.email! },
					});

					if (!existingUser) {
						// Create new user with default values
						const newUser = await prisma.user.create({
							data: {
								email: user.email!,
								name: user.name || "User",
								phone: "", // Default empty for OAuth users
								password: "", // Not used for OAuth
								userType: "user", // Default to regular user
								profileImageUrl: user.image || null,
								emailVerified: new Date(),
								status: "Active",
							},
						});
						console.log("Created new user with profileImageUrl:", newUser.profileImageUrl);
					} else {
						// Update existing user - always update with Google image if available
						const updatedUser = await prisma.user.update({
							where: { email: user.email! },
							data: {
								name: user.name || existingUser.name,
								profileImageUrl: user.image || existingUser.profileImageUrl,
								emailVerified: new Date(),
								// Set userType to "user" if not set
								userType: existingUser.userType || "user",
							},
						});
						console.log("Updated user with profileImageUrl:", updatedUser.profileImageUrl);
					}
				} catch (error) {
					console.error("Error in signIn callback:", error);
					return false;
				}
			}
			return true;
		},
		async jwt({ token, user, account }) {
			// Initial sign in
			if (user) {
				// For OAuth providers, fetch user from database
				if (account?.provider === "google") {
					// Prioritize user.image from Google OAuth (it's immediately available)
					// Then check database, then fallback
					console.log("JWT callback - Google OAuth - user.image:", user.image);
					const dbUser = await prisma.user.findUnique({
						where: { email: user.email! },
						select: { id: true, userType: true, profileImageUrl: true },
					});
					if (dbUser) {
						token.id = dbUser.id;
						token.role = (dbUser.userType || "user").toLowerCase();
						// Use Google image first, then database, then null
						token.image = user.image || dbUser.profileImageUrl || null;
						console.log("JWT callback - Set token.image:", token.image);
					} else {
						token.id = user.id;
						token.role = "user";
						// Use Google image directly
						token.image = user.image || null;
						console.log("JWT callback - No DB user, using user.image:", token.image);
					}
				} else {
					// For credentials provider
					token.id = user.id;
					const dbUser = await prisma.user.findUnique({
						where: { email: user.email! },
						select: { userType: true, profileImageUrl: true },
					});
					token.role = (dbUser?.userType || "user").toLowerCase();
					token.image = dbUser?.profileImageUrl || null;
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
				// Ensure image is properly set - handle both string and null cases
				const imageUrl = token.image;
				session.user.image = imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "" 
					? imageUrl 
					: null;
				console.log("Session callback - Set session.user.image:", session.user.image);
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/signin",
		error: "/auth/error",
	},
});

export { handler as GET, handler as POST };
