"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center h-[80vh] text-center">
			<h1 className="text-4xl font-bold mb-4">Unauthorized Access</h1>
			<p className="text-gray-600 mb-8 max-w-md">
				You don&apos;t have permission to access this page. This page may be
				restricted to users with specific roles.
			</p>
			<div className="flex gap-4">
				<Button onClick={() => router.push("/admin")}>
					Go to Dashboard
				</Button>
				<Button variant="outline" onClick={() => router.push("/")}>
					Go to Home
				</Button>
			</div>
		</div>
	);
}
