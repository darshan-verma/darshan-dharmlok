"use client";

import * as React from "react";
import {
	LayoutDashboard,
	Users,
	UserCircle2,
	HandHeart,
	Store,
	User,
	Building2,
	BadgeDollarSign,
	MailQuestion,
	ShoppingBag,
	Calendar,
	LogOut,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import Image from "next/image";

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar className="border-r border-border bg-gradient-to-b from-background to-muted/20">
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
				<p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent className="px-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							isActive={pathname === "/admin"}
							className="gap-3 px-4 py-2.5 rounded-lg"
							asChild
						>
							<Link href="/admin">
								<LayoutDashboard className="h-5 w-5" />
								<span>Dashboard</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					{/* Manage Section */}
					<div className="mt-6 mb-2">
						<div className="px-4 py-1.5 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
							Manage
						</div>
					</div>

					<SidebarMenuItem>
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/users"}
							asChild
						>
							<Link href="/admin/users">
								<Users className="h-5 w-5 text-indigo-500" />
								<span>Users</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<UserCircle2 className="h-5 w-5 text-amber-500" />
							<span>Kathavachak</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<HandHeart className="h-5 w-5 text-green-500" />
							<span>Dharmguru</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Store className="h-5 w-5 text-blue-500" />
							<span>Seller</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<User className="h-5 w-5 text-orange-500" />
							<span>Pandit ji</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Building2 className="h-5 w-5 text-cyan-500" />
							<span>Hotel/Dharamshala Vendor</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<span>List Advertisement</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<MailQuestion className="h-5 w-5 text-purple-500" />
							<span>List Enquiry</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<span>E-shop Order Requests</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Calendar className="h-5 w-5 text-red-500" />
							<span>Event Booking Requests</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<HandHeart className="h-5 w-5 text-green-500" />
							<span>Pooja Booking Requests</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Building2 className="h-5 w-5 text-cyan-500" />
							<span>Temple Booking Requests</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Building2 className="h-5 w-5 text-cyan-500" />
							<span>Dharamshala Booking Requests</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					{/* Content Management Section */}
					<div className="mt-6 mb-2">
						<div className="px-4 py-1.5 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
							Content Management
						</div>
					</div>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<BadgeDollarSign className="h-5 w-5 text-yellow-500" />
							<span>Banner</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<MailQuestion className="h-5 w-5 text-purple-500" />
							<span>Launch Video</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<HandHeart className="h-5 w-5 text-green-500" />
							<span>Quotes</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Building2 className="h-5 w-5 text-cyan-500" />
							<span>Temples</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Building2 className="h-5 w-5 text-cyan-500" />
							<span>Dharamshala</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<HandHeart className="h-5 w-5 text-green-500" />
							<span>Bal-Vidya</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<HandHeart className="h-5 w-5 text-green-500" />
							<span>Pooja Category</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<span>Audio Library</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<span>E-Book</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<span>E-Shop</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<BadgeDollarSign className="h-5 w-5 text-yellow-500" />
							<span>Coupon</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Calendar className="h-5 w-5 text-red-500" />
							<span>Events and Booking</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							{/* <PrayingHands className="h-5 w-5 text-teal-500" /> */}
							<span>Live Darshan</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<MailQuestion className="h-5 w-5 text-purple-500" />
							<span>Comments & Replies</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<BadgeDollarSign className="h-5 w-5 text-yellow-500" />
							<span>Payments & History</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className="px-4 py-4 mt-auto">
				<div className="flex flex-col gap-2">
					<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all border border-border">
						<Settings className="h-5 w-5" />
						<span>Settings</span>
					</SidebarMenuButton>
					<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 hover:text-red-500 transition-all">
						<LogOut className="h-5 w-5" />
						<span>Logout</span>
					</SidebarMenuButton>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
