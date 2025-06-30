"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import Posts from "../components/posts";
import RouteProtection from "../components/route-protection";
import Sidebar from "../components/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

const LoadingState = ({ message }: { message: string }) => (
	<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
		<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
		<p className="text-lg text-muted-foreground">{message}</p>
	</div>
);

export default function KathavachakPage() {
	const { data: session, status: sessionStatus } = useSession();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sessionStatus !== "authenticated" || !session?.user?.id) {
			if (sessionStatus !== "loading") {
				setLoading(false);
			}
			return;
		}

		const fetchUser = async () => {
			try {
				const userId = session.user.id;
				const response = await fetch(`/api/users/${userId}`);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.error || "Failed to fetch user data");
				}

				const userData = await response.json();
				setUser(userData);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error fetching user data"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [session, sessionStatus]);

	if (sessionStatus === "loading") {
		return <LoadingState message="Loading session..." />;
	}

	if (sessionStatus === "authenticated" && loading) {
		return <LoadingState message="Loading user data..." />;
	}

	if (error && session?.user) {
		console.warn("Using fallback with session data due to error:", error);
	} else if (error && !session?.user) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)] p-4">
				<Alert variant="destructive" className="max-w-md">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Error Loading Data</AlertTitle>
					<AlertDescription>
						{error}
						<div className="mt-4">
							<Button onClick={() => window.location.reload()}>
								Retry
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const effectiveUser = user || session?.user;

	return (
		<RouteProtection requiredRole="kathavachak">
			<div className="flex bg-muted/40">
				<Sidebar
					userType={session?.user?.role?.toLowerCase() || "kathavachak"}
				/>
				<main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
					{effectiveUser ? (
						<Posts
							userId={effectiveUser.id}
							userName={effectiveUser.name || "User"}
							profileImageUrl={
								(effectiveUser as User).profileImageUrl ||
								"/placeholder-avatar.png"
							}
						/>
					) : (
						<LoadingState message="Preparing your dashboard..." />
					)}
				</main>
			</div>
		</RouteProtection>
	);
}
