"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Posts from "../components/posts";
import RouteProtection from "../components/route-protection";

interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	userType: string;
	profileImageUrl: string;
	bio: string;
	// ...other fields
}

export default function KathavachakPage() {
	const { data: session, status: sessionStatus } = useSession();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Only fetch user data if we have a session and it's loaded
		if (sessionStatus !== "authenticated" || !session?.user?.id) {
			console.log("Session not authenticated or missing user ID");
			if (sessionStatus !== "loading") {
				setLoading(false);
			}
			return;
		}

		const fetchUser = async () => {
			try {
				// Get the actual user ID from the session
				const userId = session.user.id;
				console.log("Fetching user with ID:", userId);

				const response = await fetch(`/api/users/${userId}`);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error("Error response:", errorData);
					throw new Error(errorData.error || "Failed to fetch user data");
				}

				const userData = await response.json();
				console.log("User data fetched successfully:", userData);
				setUser(userData);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error fetching user data"
				);
				console.error("Fetch user error:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [session, sessionStatus]);

	// Don't render anything while we're waiting for authentication
	if (sessionStatus === "loading") {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
				<span className="ml-3">Loading session...</span>
			</div>
		);
	}

	// If we're authenticated but still loading the user data
	if (sessionStatus === "authenticated" && loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
				<span className="ml-3">Loading user data...</span>
			</div>
		);
	}

	// Show error only if we have a session but failed to fetch user data
	if (error && session?.user) {
		console.warn("Using fallback with session data due to error:", error);
		// We'll continue with the basic version below
	} else if (error && !session?.user) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="text-red-500">
					{error}
					<div className="mt-2">
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Retry
						</button>
					</div>
				</div>
			</div>
		);
	}

	// If we have a session but no user data yet, we can still show a basic version
	const showBasicVersion = !user && session?.user;

	// If we're not authenticated at all, the RouteProtection component will handle the redirect
	return (
		<RouteProtection requiredRole="kathavachak">
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

				{/* Debug information - remove in production */}
				<div className="bg-gray-100 p-4 mb-4 rounded text-xs">
					<details>
						<summary className="cursor-pointer font-medium">Debug Info</summary>
						<div className="mt-2 space-y-1 whitespace-pre-wrap">
							<div>
								<strong>Session Status:</strong> {sessionStatus}
							</div>
							<div>
								<strong>User ID from Session:</strong>{" "}
								{session?.user?.id || "Not available"}
							</div>
							<div>
								<strong>Role from Session:</strong>{" "}
								{session?.user?.role || "Not available"}
							</div>
							<div>
								<strong>API Fetch Error:</strong> {error || "None"}
							</div>
							<div>
								<strong>Using data from:</strong>{" "}
								{showBasicVersion ? "Session fallback" : "Full user data"}
							</div>
						</div>
					</details>
				</div>

				{showBasicVersion ? (
					// Fallback to session data if user data isn't available
					<Posts
						userId={session!.user.id}
						userName={session!.user.name || "User"}
						profileImageUrl="/placeholder-avatar.png"
					/>
				) : (
					// Use the full user data when available
					<Posts
						userId={user!.id}
						userName={user!.name}
						profileImageUrl={user!.profileImageUrl || "/placeholder-avatar.png"}
					/>
				)}
			</div>
		</RouteProtection>
	);
}
