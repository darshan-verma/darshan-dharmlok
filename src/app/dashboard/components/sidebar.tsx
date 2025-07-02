"use client";

import * as React from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import cn from "classnames";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	SidebarFooter,
} from "@/components/ui/sidebar";
import {
	UserCircle2,
	HandHeart,
	Store,
	Building2,
	BadgeDollarSign,
	MailQuestion,
	ShoppingBag,
	Calendar,
	LogOut,
	Settings,
	Cast,
	BookOpen,
	Video,
	Image as ImageIcon,
} from "lucide-react";

interface MenuItem {
	label: string;
	href: string;
	icon: ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
	>;
}

type UserType =
	| "kathavachak"
	| "dharmguru"
	| "seller"
	| "panditji"
	| "hotel_dharamshala_vendor"; // Add more as needed

// Define menu items for each userType
const sharedMenuItems: MenuItem[] = [
	{ label: "Go Live", href: "/dashboard/kathavachak/go-live", icon: Cast },
	{ label: "Posts", href: "/dashboard/kathavachak/posts", icon: BookOpen },
	{
		label: "Biography",
		href: "/dashboard/kathavachak/biography",
		icon: UserCircle2,
	},
	{
		label: "Video Gallery",
		href: "/dashboard/kathavachak/videos",
		icon: Video,
	},
	{
		label: "Photo Gallery",
		href: "/dashboard/kathavachak/photos",
		icon: ImageIcon,
	},
	{ label: "My Events", href: "/dashboard/kathavachak/events", icon: Calendar },
	{
		label: "My Advertisement",
		href: "/dashboard/kathavachak/advertisement",
		icon: BadgeDollarSign,
	},
	{
		label: "My Temple Booking",
		href: "/dashboard/kathavachak/temple-booking",
		icon: Building2,
	},
	{
		label: "My Dharamshala Booking",
		href: "/dashboard/kathavachak/dharamshala-booking",
		icon: Building2,
	},
	{
		label: "My Eshop Orders",
		href: "/dashboard/kathavachak/eshop-orders",
		icon: ShoppingBag,
	},
	{
		label: "My Events Orders",
		href: "/dashboard/kathavachak/events-orders",
		icon: Calendar,
	},
	{
		label: "My Pooja Services",
		href: "/dashboard/kathavachak/pooja-services",
		icon: HandHeart,
	},
	{
		label: "Services",
		href: "/dashboard/kathavachak/services",
		icon: HandHeart,
	},
	{
		label: "Add Your Events",
		href: "/dashboard/kathavachak/add-events",
		icon: Calendar,
	},
	{
		label: "Events Request List",
		href: "/dashboard/kathavachak/events-request-list",
		icon: MailQuestion,
	},
	{
		label: "Apply for Paid Promotions",
		href: "/dashboard/kathavachak/paid-promotions",
		icon: BadgeDollarSign,
	},
	{
		label: "Bookmarks - Temple",
		href: "/dashboard/kathavachak/bookmarks/temple",
		icon: BookOpen,
	},
	{
		label: "Bookmarks - Vendors",
		href: "/dashboard/kathavachak/bookmarks/vendors",
		icon: Store,
	},
	{
		label: "Bookmarks - Eshop",
		href: "/dashboard/kathavachak/bookmarks/eshop",
		icon: ShoppingBag,
	},
	{
		label: "Bookmarks - Pooja",
		href: "/dashboard/kathavachak/bookmarks/pooja",
		icon: HandHeart,
	},
	{ label: "Setting", href: "/dashboard/kathavachak/setting", icon: Settings },
	{
		label: "Update Biography",
		href: "/dashboard/kathavachak/update-biography",
		icon: UserCircle2,
	},
	{
		label: "Add Photo",
		href: "/dashboard/kathavachak/add-photo",
		icon: ImageIcon,
	},
	{ label: "Add Video", href: "/dashboard/kathavachak/add-video", icon: Video },
	// ...add more as needed
];

const menuConfig: Record<UserType, MenuItem[]> = {
	kathavachak: sharedMenuItems,
	dharmguru: sharedMenuItems,
	seller: sharedMenuItems,
	panditji: sharedMenuItems,
	hotel_dharamshala_vendor: sharedMenuItems,
};

// Type guard function to check if a string is a valid UserType
function isUserType(type: string | undefined): type is UserType {
	if (!type) return false;
	return [
		"kathavachak",
		"dharmguru",
		"seller",
		"panditji",
		"hotel_dharamshala_vendor",
	].includes(type);
}

export default function DashboardSidebar({
	userType,
	className,
}: {
	userType?: string;
	className?: string;
}) {
	const pathname = usePathname();
	const validUserType = userType && isUserType(userType) ? userType : undefined;
	const menuItems = validUserType ? menuConfig[validUserType] : [];

	return (
		<Sidebar
			className={cn(
				"border-r border-border bg-gradient-to-b from-background to-muted/20",
				className
			)}
		>
			<SidebarHeader className="flex flex-col items-center justify-center p-4 pb-2">
				<div className="w-32 h-auto mb-2">
					<Image
						src="/dharmlok-logo.svg"
						alt="Dharmlok Logo"
						width={150}
						height={80}
						priority
					/>
				</div>
				<p className="text-xs text-muted-foreground mt-1 capitalize">
					{userType ? `${userType} Dashboard` : "Dashboard"}
				</p>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent className="px-2">
				<SidebarMenu>
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								isActive={pathname === item.href}
								className="gap-3 px-4 py-2.5 rounded-lg"
								asChild
							>
								<Link href={item.href}>
									<item.icon
										className={cn(
											"h-5 w-5",
											item.label === "Go Live" && "text-teal-500",
											item.label === "Posts" && "text-green-600",
											item.label === "Biography" && "text-amber-500",
											item.label === "Video Gallery" && "text-purple-500",
											item.label === "Photo Gallery" && "text-blue-500",
											item.label === "My Events" && "text-red-500",
											item.label === "My Advertisement" && "text-yellow-500",
											item.label === "My Temple Booking" && "text-cyan-500",
											item.label === "My Dharamshala Booking" &&
												"text-cyan-500",
											item.label === "My Eshop Orders" && "text-pink-500",
											item.label === "My Events Orders" && "text-red-500",
											item.label === "My Pooja Services" && "text-green-500",
											item.label === "Services" && "text-green-500",
											item.label === "Add Your Events" && "text-red-500",
											item.label === "Events Request List" && "text-purple-500",
											item.label === "Apply for Paid Promotions" &&
												"text-yellow-500",
											item.label === "Bookmarks - Temple" && "text-green-600",
											item.label === "Bookmarks - Vendors" && "text-blue-500",
											item.label === "Bookmarks - Eshop" && "text-pink-500",
											item.label === "Bookmarks - Pooja" && "text-green-500",
											item.label === "Update Biography" && "text-amber-500",
											item.label === "Add Photo" && "text-blue-500",
											item.label === "Add Video" && "text-purple-500"
										)}
									/>
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="px-4 py-4 mt-auto">
				<div className="flex flex-col gap-2">
					<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all border border-border">
						<Settings className="h-5 w-5" />
						<span>Settings</span>
					</SidebarMenuButton>
					<SidebarMenuButton
						onClick={() => signOut({ callbackUrl: "/auth/signin" })}
						className={cn(
							"gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all",
							"hover:text-red-500 focus:text-red-500"
						)}
					>
						<LogOut className="h-5 w-5" />
						<span>Logout</span>
					</SidebarMenuButton>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
