"use client";

import RouteProtection from "../components/route-protection";
import Sidebar from "../components/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import LiveStudio from "../components/live-studio";
import { useSession } from "next-auth/react";

export default function MotivationalSpeakerDashboardPage() {
	const { data: session } = useSession();

	return (
		<RouteProtection
			requiredRoles={[
				"motivational-speaker",
				"motivationalspeaker",
				"motivation-speaker",
			]}
		>
			<div className="flex bg-muted/40 w-full min-h-screen">
				<Sidebar
					userType={session?.user?.role?.toLowerCase() || "motivational-speaker"}
				/>
				<SidebarInset className="p-4 sm:p-6 lg:p-8">
					<div className="w-full">
						<LiveStudio roleLabel="Motivational Speaker" />
					</div>
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
