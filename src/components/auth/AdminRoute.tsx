"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminRoute({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") return;

		if (status === "unauthenticated") {
			router.push("/auth/signin");
			return;
		}

		const role = session?.user?.role?.toLowerCase();
		if (role !== "admin") {
			// Redirect non-admins to unauthorized page
			router.push("/unauthorized");
		}
	}, [status, session, router]);

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin" />
			</div>
		);
	}
	if (
		status === "authenticated" &&
		session?.user?.role?.toLowerCase() !== "admin"
	) {
		// Show nothing while redirecting to unauthorized
		return null;
	}

	return <>{children}</>;
}
