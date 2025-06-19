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
	Cast,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

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
import cn from "classnames";

export function AdminSidebar({ className }: { className?: string }) {
	const pathname = usePathname();

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
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/kathavachak"}
							asChild
						>
							<Link href="/admin/kathavachak">
								<UserCircle2 className="h-5 w-5 text-amber-500" />
								<span>Kathavachak</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/dharmguru"}
							asChild
						>
							<Link href="/admin/dharmguru">
								<HandHeart className="h-5 w-5 text-green-500" />
								<span>Dharmguru</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/seller"}
							asChild
						>
							<Link href="/admin/seller">
								<Store className="h-5 w-5 text-blue-500" />
								<span>Seller</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/panditji"}
							asChild
						>
							<Link href="/admin/panditji">
								<User className="h-5 w-5 text-orange-500" />
								<span>Pandit ji</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/hotel_dharamshala_vendor"}
							asChild
						>
							<Link href="/admin/hotel_dharamshala_vendor">
								<Building2 className="h-5 w-5 text-cyan-500" />
								<span>Hotel/Dharamshala Vendor</span>
							</Link>
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
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/banner"}>
							<BadgeDollarSign className="h-5 w-5 text-yellow-500" />
							<Link href="/admin/banner" className="flex items-center gap-2">
							<span>Banner</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/video"}>
							<MailQuestion className="h-5 w-5 text-purple-500" />
							<Link href="/admin/video" className="flex items-center gap-2">
							<span>Launch Video</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/quotes"}>
							<HandHeart className="h-5 w-5 text-green-500" />
							<Link href="/admin/quotes" className="flex items-center gap-2">
							<span>Quotes</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/temple"}>
							<Building2 className="h-5 w-5 text-cyan-500" />
							<Link href="/admin/temple" className="flex items-center gap-2">
							<span>Temples</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/dharamshala"}>
							<Building2 className="h-5 w-5 text-cyan-500" />
							<Link href="/admin/dharamshala" className="flex items-center gap-2">
							<span>Dharamshala</span>
								</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/balvidya"}
							>
							<HandHeart className="h-5 w-5 text-green-500" />
							<Link href="/admin/balvidhya" className="flex items-center gap-2">
							<span>Bal-Vidya</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/pooja-category"}
						>
							<HandHeart className="h-5 w-5 text-green-500" />
							<Link href="/admin/pooja-category" className="flex items-center gap-2">
							<span>Pooja Category</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/audio-library"}>
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<Link href="/admin/audio-library" className="flex items-center gap-2">
							<span>Audio Library</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
							isActive={pathname === "/admin/ebook"}>
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<Link href="/admin/ebook" className="flex items-center gap-2">
								<span>E-Book</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/e-shop"}>
							<ShoppingBag className="h-5 w-5 text-pink-500" />
							<Link href="/admin/e-shop" className="flex items-center gap-2">
							<span>E-Shop</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/coupon"}>
							<BadgeDollarSign className="h-5 w-5 text-yellow-500" />
							<Link href="/admin/coupon" className="flex items-center gap-2">
							<span>Coupon</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all"
						isActive={pathname === "/admin/events-booking"}>
							<Calendar className="h-5 w-5 text-red-500" />
							<Link href="/admin/events" className="flex items-center gap-2">
							<span>Events and Booking</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton className="gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-all">
							<Cast className="h-5 w-5 text-teal-500" />
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
