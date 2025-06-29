import DashboardSidebar from "./components/sidebar";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";
import SidebarProviderWrapper from "./components/sidebarWrapper";

export default async function DashboardLayout({ children }: PropsWithChildren) {
	const session = await getServerSession();

	// Use the role from the session, provide a default value if undefined
	const userRole = session?.user?.role || "user";

	// Log the role to help with debugging
	console.log("Dashboard Layout - User Role:", userRole);

	return (
		<SidebarProviderWrapper>
			<div style={{ display: "flex" }}>
				<DashboardSidebar userType={userRole} />
				<main style={{ flex: 1 }}>{children}</main>
			</div>
		</SidebarProviderWrapper>
	);
}
