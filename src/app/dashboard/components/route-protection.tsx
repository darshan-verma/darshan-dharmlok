"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RouteProtection({
	children,
	requiredRole,
}: {
	children: React.ReactNode;
	requiredRole?: string;
}) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

	useEffect(() => {
		// If the session is loading, do nothing
		if (status === "loading") return;

		// If not authenticated, redirect to signin
		if (status === "unauthenticated") {
			console.log("Not authenticated, redirecting to signin");
			router.push("/auth/signin");
			return;
		}

		// If authenticated but role doesn't match (when role is required)
		// Check case-insensitively to avoid capitalization issues
		if (
			requiredRole &&
			session?.user?.role?.toLowerCase() !== requiredRole.toLowerCase()
		) {
			console.log(
				`Role mismatch: Required ${requiredRole}, but user has ${session?.user?.role}`
			);
			router.push("/unauthorized");
			return;
		}

		// If we reach here, the user is authorized
		setIsAuthorized(true);
	}, [session, status, requiredRole, router]);

	// Show loading while checking auth
	if (status === "loading") {
		return (
			<div className="fixed inset-0 flex items-center justify-center z-50 bg-white/60">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	// If we're authenticated and have correct role, or no role is required
	if (isAuthorized) {
		return <>{children}</>;
	}

	// This shouldn't render as we redirect in the useEffect
	return null;
}
