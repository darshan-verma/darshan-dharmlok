"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import RouteProtection from "../components/route-protection";
import Sidebar from "../components/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ImpersonationRestoreButton from "../components/ImpersonationRestoreButton";
import { SidebarInset } from "@/components/ui/sidebar";
import KathavachakDashboard from "../components/kathavachak-dashboard";

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

		const isAdmin = session?.user?.role?.toLowerCase() === "admin";
		if (isAdmin) {
			setLoading(false);
			return;
		}

		const fetchUser = async () => {
			try {
				const userId = session.user.id;
				// Use the new kathavachak-specific API endpoint for optimized queries
				const response = await fetch(`/api/users/kathavachak/${userId}`);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.error || "Failed to fetch user data");
				}

				const responseData = await response.json();
				// Handle the nested data structure from the API
				const userData = responseData.data || responseData;
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
							<Button onClick={() => window.location.reload()}>Retry</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const effectiveUser = user || session?.user;
	const isAdmin = session?.user?.role?.toLowerCase() === "admin";

	return (
		<RouteProtection requiredRole="kathavachak">
			{isAdmin ? (
				<div className="fixed inset-0 flex items-center justify-center bg-muted/40 z-50">
					<div className="flex flex-col items-center justify-center gap-4 p-6 border rounded-lg bg-background shadow-sm">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-6 w-6 text-yellow-500" />
							<span className="text-lg font-semibold text-primary">
								Admin View
							</span>
						</div>
						<p className="text-muted-foreground text-center max-w-md">
							You are viewing the Kathavachak dashboard as an{" "}
							<span className="font-medium">admin</span>.<br />
							User-specific data may not be available.
						</p>
						<ImpersonationRestoreButton />
					</div>
				</div>
			) : (
				<div className="flex bg-muted/40 w-full min-h-screen">
					<Sidebar
						userType={session?.user?.role?.toLowerCase() || "kathavachak"}
					/>
					<SidebarInset className="w-full min-h-screen">
						{effectiveUser ? (
							<KathavachakDashboard />
						) : (
							<LoadingState message="Preparing your dashboard..." />
						)}
					</SidebarInset>
				</div>
			)}
		</RouteProtection>
	);
}
