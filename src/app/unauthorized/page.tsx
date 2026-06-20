"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getDashboardRoute } from "@/app/dashboard/components/user-role";

export default function UnauthorizedPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [dashboard, setDashboard] = useState("/");
	const [adminReturnUrl, setAdminReturnUrl] = useState<string | null>(null);

	useEffect(() => {
		// Check for a saved admin return URL in localStorage
		if (typeof window !== "undefined") {
			const savedUrl = localStorage.getItem("adminReturnUrl");
			setAdminReturnUrl(savedUrl);
		}
		if (status === "authenticated") {
			const role = session?.user?.role;
			setDashboard(getDashboardRoute(role) ?? "/dashboard");
		}
	}, [session, status]);

	return (
		<div className="flex flex-col items-center justify-center h-[80vh] text-center">
			<h1 className="text-4xl font-bold mb-4">Unauthorized Access</h1>
			<p className="text-gray-600 mb-8 max-w-md">
				You don&apos;t have permission to access this page. This page may be
				restricted to users with specific roles.
			</p>
			<div className="flex gap-4">
				{adminReturnUrl ? (
					<Button
						onClick={() => {
							localStorage.removeItem("adminReturnUrl");
							router.push(adminReturnUrl);
						}}
					>
						Return to Admin Page
					</Button>
				) : (
					<Button onClick={() => router.push(dashboard)}>
						Go to Your{" "}
						{session?.user?.role
							? session.user.role.charAt(0).toUpperCase() +
							  session.user.role.slice(1)
							: ""}
						&nbsp;Dashboard
					</Button>
				)}
				<Button variant="outline" onClick={() => router.push("/auth/signin")}>
					Go to Sign In
				</Button>
			</div>
		</div>
	);
}
