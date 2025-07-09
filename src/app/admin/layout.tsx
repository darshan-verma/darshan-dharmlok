"use client";

import * as React from "react";
import { AdminSidebar } from "./components/Sidebar/sidebar";
import {
	SidebarProvider,
	SidebarTrigger,
	SidebarInset,
} from "@/components/ui/sidebar";
import AdminRoute from "@/components/auth/AdminRoute";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AdminRoute>
			<SidebarProvider defaultOpen={true}>
				<div className="flex h-screen w-full">
					<AdminSidebar />
					<div className="flex flex-1 flex-col">
						<header className="bg-background border-b flex h-14 shrink-0 items-center px-4 lg:h-[60px] sticky top-0 z-10">
							<SidebarTrigger />
							<div className="ml-4 flex items-center gap-4">
								<h1 className="text-xl font-semibold">Dashboard</h1>
							</div>
						</header>
						<SidebarInset>
							<div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
						</SidebarInset>
					</div>
				</div>
			</SidebarProvider>
		</AdminRoute>
	);
}
