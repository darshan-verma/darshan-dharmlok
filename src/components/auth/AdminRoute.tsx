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
		console.log("here");
		if (status === "loading") return;

		// If not authenticated, redirect to signin
		if (status === "unauthenticated") {
			router.push("/auth/signin");
			return;
		}

		// If user doesn't have admin role, redirect to home or show 403
		if (session?.user?.role !== "ADMIN") {
			router.push("/");
		}
	}, [status, session, router]);

	// Show loading spinner while checking auth status
	if (
		status === "loading" ||
		(status === "authenticated" && session?.user?.role !== "ADMIN")
	) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin" />
			</div>
		);
	}

	return <>{children}</>;
}
