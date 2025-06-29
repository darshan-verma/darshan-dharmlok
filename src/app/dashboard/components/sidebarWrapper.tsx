"use client";

import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function SidebarProviderWrapper({
	children,
}: {
	children: ReactNode;
}) {
	return <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>;
}
