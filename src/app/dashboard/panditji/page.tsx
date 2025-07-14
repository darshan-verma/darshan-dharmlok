"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function PanditjiDashboardPage() {
	const { data: session } = useSession();
	return (
		<div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
			<h1 className="text-3xl font-bold mb-4">
				Welcome, {session?.user?.name || "Panditji"}!
			</h1>
			<p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
				Manage your pooja service offerings, view your bookings, and update your
				profile from your dashboard.
			</p>
			<div className="flex flex-col sm:flex-row gap-4">
				<Link href="/dashboard/panditji/pooja-services">
					<Button size="lg" variant="default">
						My Pooja Services
					</Button>
				</Link>
				{/* Add more dashboard navigation buttons here as needed */}
			</div>
		</div>
	);
}
