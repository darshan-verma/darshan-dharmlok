"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Sidebar from "../../components/sidebar";
import RouteProtection from "../../components/route-protection";
import LiveStudio from "../../components/live-studio";
import { SidebarInset } from "@/components/ui/sidebar";

export default function MotivationalSpeakerSectionPage() {
	const { data: session } = useSession();
	const params = useParams();
	const section = Array.isArray(params.section) ? params.section[0] : params.section;

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
						{section === "go-live" ? (
							<LiveStudio roleLabel="Motivational Speaker" />
						) : (
							<div className="text-center mt-8">
								Select a valid section from the sidebar.
							</div>
						)}
					</div>
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
