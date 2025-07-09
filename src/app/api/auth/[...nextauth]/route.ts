import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
	adapter: PrismaAdapter(prisma),
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt",
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
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
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
