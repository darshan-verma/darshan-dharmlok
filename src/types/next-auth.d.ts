import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: string;
			image?: string | null;
		} & DefaultSession["user"];
		// Add accessToken property for API auth
		accessToken?: string;
	}

	interface User extends DefaultUser {
		role?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		role?: string;
		id: string;
		image?: string | null;
		accessToken?: string;
	}
}
