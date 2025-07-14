"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import RouteProtection from "../../components/route-protection";
import Sidebar from "../../components/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import PoojaServicesSection from "../../components/pooja-services-section";
import PanditjiDashboard from "../../components/panditji-dashboard";

const LoadingState = ({ message }: { message: string }) => (
	<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
		<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
		<p className="text-lg text-muted-foreground">{message}</p>
	</div>
);

export default function PanditjiSectionPage() {
	const { data: session, status: sessionStatus } = useSession();
	const params = useParams();
	const section = Array.isArray(params.section)
		? params.section[0]
		: params.section;

	if (sessionStatus === "loading") {
		return <LoadingState message="Loading session..." />;
	}

	if (!session?.user?.id) {
		return <LoadingState message="User not found." />;
	}

	let content = null;
	if (section === "dashboard") {
		content = <PanditjiDashboard />;
	} else if (section === "pooja-services") {
		content = <PoojaServicesSection />;
	} else {
		content = (
			<div className="text-center mt-8">
				Select a valid section from the sidebar.
			</div>
		);
	}

	return (
		<RouteProtection requiredRole="panditji">
			<div className="flex bg-muted/40 w-full min-h-screen">
				<Sidebar userType={session?.user?.role?.toLowerCase() || "panditji"} />
				<SidebarInset className="p-4 sm:p-6 lg:p-8">
					<div className="w-full">{content}</div>
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
