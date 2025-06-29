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
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	// If we're authenticated and have correct role, or no role is required
	if (isAuthorized) {
		return <>{children}</>;
	}

	// Show debugging information for authorization issues
	if (status === "authenticated" && requiredRole && session?.user?.role) {
		return (
			<div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold text-yellow-700 mb-3">
					Authorization Debugging
				</h2>
				<div className="space-y-2 text-sm">
					<p>
						<strong>Required Role:</strong> "{requiredRole}" (lowercase: "
						{requiredRole.toLowerCase()}")
					</p>
					<p>
						<strong>Your Role:</strong> "{session.user.role}" (lowercase: "
						{session.user.role.toLowerCase()}")
					</p>
					<p>
						<strong>Case-insensitive Match:</strong>{" "}
						{session.user.role.toLowerCase() === requiredRole.toLowerCase()
							? "Yes ✅"
							: "No ❌"}
					</p>
					<p>
						<strong>Exact Match:</strong>{" "}
						{session.user.role === requiredRole ? "Yes ✅" : "No ❌"}
					</p>
					<p className="mt-4">
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Try Again
						</button>
					</p>
				</div>
			</div>
		);
	}

	// This shouldn't render as we redirect in the useEffect
	return null;
}
