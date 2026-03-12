"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, User, Menu, X, LogOut, Settings, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from "@/components/shared/SearchDialog";

export default function Header() {
	const { data: session, status } = useSession();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
	const [_isScrolled, setIsScrolled] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [_liveNotifications, setLiveNotifications] = useState<
		Array<{
			id: string;
			type: "created" | "live";
			message: string;
			broadcastId: string;
			createdAt: string;
		}>
	>([]);
	const seenIdsRef = useRef<Set<string>>(new Set());
	const [seenIdsLoaded, setSeenIdsLoaded] = useState(false);
	const [unseenNotifications, setUnseenNotifications] = useState<typeof _liveNotifications>([]);
	const isAuthenticated = status === "authenticated";

	const SEEN_STORAGE_KEY = "dharmlok_seen_notification_ids";

	useEffect(() => {
		try {
			const stored = localStorage.getItem(SEEN_STORAGE_KEY);
			if (stored) {
				const ids: string[] = JSON.parse(stored);
				ids.forEach((id) => seenIdsRef.current.add(id));
			}
		} catch { /* ignore corrupt data */ }
		setSeenIdsLoaded(true);
	}, []);

	const persistSeenIds = useCallback(() => {
		try {
			const ids = Array.from(seenIdsRef.current).slice(-50);
			localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids));
		} catch { /* storage full / unavailable */ }
	}, []);

	const markOneSeen = useCallback((id: string) => {
		seenIdsRef.current.add(id);
		persistSeenIds();
		setUnseenNotifications((prev) => prev.filter((n) => n.id !== id));
	}, [persistSeenIds]);

	// Debug: Log session data (remove in production)
	useEffect(() => {
		if (isAuthenticated && session?.user) {
			console.log("Header - Session user:", {
				name: session.user.name,
				email: session.user.email,
				image: session.user.image,
				id: session.user.id,
			});
		}
	}, [isAuthenticated, session]);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			setIsScrolled(scrollPosition > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		if (!seenIdsLoaded) return;

		const fetchLiveNotifications = async () => {
			try {
				const res = await fetch("/api/live/notifications?limit=8", {
					cache: "no-store",
				});
				const data = await res.json();
				if (!res.ok) return;
				const fresh = Array.isArray(data.notifications) ? data.notifications : [];
				setLiveNotifications(fresh);
				setUnseenNotifications(fresh.filter((n: { id: string }) => !seenIdsRef.current.has(n.id)));
			} catch {
				// Silent fail for header-only enhancement.
			}
		};

		fetchLiveNotifications();
		const interval = setInterval(fetchLiveNotifications, 20000);
		return () => clearInterval(interval);
	}, [seenIdsLoaded]);

	const menuItems = [
		{ name: "Home", href: "/", active: true },
		{
			name: "Explore",
			href: "#explore",
			megaMenu: true,
			leftColumn: [
				{ name: "Kathavachak", href: "/kathavachak" },
				{ name: "Dharmguru", href: "/dharmguru" },
				{ name: "Panditji", href: "/panditji" },
			],
			rightColumn: [
				{ name: "Book Pooja", href: "/book-pooja" },
				{ name: "Book Yoga Session", href: "/book-yoga" },
				{ name: "Live Streams", href: "/live-streams" },
				{ name: "E-Books", href: "/e-book" },
				{ name: "Events", href: "/events" },
				{ name: "Dharmshala", href: "/dharmshala" },
				{ name: "Temples", href: "/temple" },
				{ name: "Motivational Speaker", href: "/motivational-speaker" },
			],
			viewAllLink: { name: "View All", href: "/services" },
		},
		{ name: "Travel Portal", href: "/travel-portal" },
		{ name: "Shop", href: "/e-shop" },
		{ name: "Community", href: "/community" },
		{ name: "Contact Us", href: "/contact-us" },
	];

	return (
		<>
			{/* Main Navigation */}
			<nav
				className="sticky top-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-1xl shadow-md border-b border-white/30"
				style={{
					backdropFilter: "blur(40px) saturate(180%)",
					WebkitBackdropFilter: "blur(40px) saturate(180%)",
				}}
			>
				<div className="container mx-auto px-4">
					<div className="flex items-center justify-between h-20">
						{/* Logo */}
						<Link href="/" className="flex items-center gap-2 group">
							<div className="relative group-hover:scale-110 transition-transform">
								<Image
									src="/dharmlok-logo.svg"
									alt="Dharmlok Logo"
									width={100}
									height={100}
									className="object-contain"
									onError={() => {
										// Fallback handled by Next.js Image component
									}}
								/>
							</div>
						</Link>

						{/* Desktop Menu */}
						<div className="hidden lg:flex items-center gap-8">
							{menuItems.map((item) => (
								<div
									key={item.name}
									className="relative"
									onMouseEnter={() =>
										item.megaMenu && setActiveDropdown(item.name)
									}
									onMouseLeave={() => setActiveDropdown(null)}
								>
									<Link
										href={item.href}
										className={`block py-3 px-2 -my-3 -mx-2 text-gray-800 hover:text-orange-500 transition-colors font-medium rounded ${
											item.active
												? "text-orange-500 border-b-2 border-orange-500"
												: ""
										}`}
									>
										{item.name}
									</Link>
									{item.megaMenu && activeDropdown === item.name && (
										<div className="absolute top-full left-0 pt-2 w-96 z-50">
											<div
												className="bg-white/90 backdrop-blur-2xl shadow-2xl rounded-2xl py-4 animate-in fade-in slide-in-from-top-2 border border-white/40"
												style={{
													backdropFilter: "blur(24px) saturate(180%)",
													WebkitBackdropFilter: "blur(24px) saturate(180%)",
												}}
											>
												<div className="flex gap-6 px-4">
													{/* Left Column - Spiritual Guides */}
													<div className="flex-1">
														<h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200/50">
															Spiritual Guides
														</h3>
														<div className="space-y-2">
															{item.leftColumn?.map((subItem) => (
																<Link
																	key={subItem.name}
																	href={subItem.href}
																	className="block px-2 py-2 text-gray-700 hover:bg-orange-50/60 hover:text-orange-500 transition-colors rounded"
																>
																	{subItem.name}
																</Link>
															))}
														</div>
													</div>
													{/* Right Column - Services */}
													<div className="flex-1 border-l border-gray-200/50 pl-6">
														<h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200/50">
															Services
														</h3>
														<div className="space-y-2">
															{item.rightColumn?.map((subItem) => (
																<Link
																	key={subItem.name}
																	href={subItem.href}
																	className="block px-2 py-2 text-gray-700 hover:bg-orange-50/60 hover:text-orange-500 transition-colors rounded"
																>
																	{subItem.name}
																</Link>
															))}
														</div>
														{/* View All Services Link */}
														{item.viewAllLink && (
															<div className="mt-3 pt-3 border-t border-gray-200/50">
																<Link
																	href={item.viewAllLink.href}
																	className="block"
																>
																	<LiquidButton
																		size="sm"
																		variant="default"
																		className="w-full text-orange-500"
																	>
																		{item.viewAllLink.name}
																	</LiquidButton>
																</Link>
															</div>
														)}
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							))}
						</div>

						{/* Right Icons */}
						<div className="flex items-center gap-4">
							<SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
								<button
									className="p-2 hover:bg-gray-100 rounded-full transition-colors"
									aria-label="Search"
								>
									<Search className="w-5 h-5 text-gray-700" />
								</button>
							</SearchDialog>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
									aria-label="Live notifications"
								>
									<Bell className="w-5 h-5 text-gray-700" />
									{unseenNotifications.length > 0 && (
										<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
											{Math.min(unseenNotifications.length, 9)}
										</span>
									)}
								</button>
							</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-80">
									<DropdownMenuLabel>Live Notifications</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{unseenNotifications.length === 0 ? (
										<div className="px-2 py-3 text-sm text-muted-foreground">
											No new notifications.
										</div>
									) : (
										unseenNotifications.map((item) => (
											<DropdownMenuItem key={item.id} asChild>
												<Link
													href="/live-streams"
													className="flex flex-col items-start gap-1 py-2"
													onClick={() => markOneSeen(item.id)}
												>
													<span className="text-xs uppercase text-red-600 font-medium">
														{item.type === "live" ? "Live Now" : "Scheduled"}
													</span>
													<span className="text-sm leading-snug">{item.message}</span>
												</Link>
											</DropdownMenuItem>
										))
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/live-streams" className="cursor-pointer text-orange-600">
											View all live streams
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{isAuthenticated ? (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="p-0 hover:opacity-80 transition-opacity rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
											<Avatar className="w-10 h-10 border-2 border-orange-500/30 hover:border-orange-500 transition-colors">
												<AvatarImage
													src={session?.user?.image || undefined}
													alt={session?.user?.name || "User"}
													className="object-cover"
												/>
												<AvatarFallback className="bg-orange-500 text-white font-semibold">
													{session?.user?.name?.charAt(0)?.toUpperCase() ||
														session?.user?.email?.charAt(0)?.toUpperCase() ||
														"U"}
												</AvatarFallback>
											</Avatar>
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<DropdownMenuLabel>
											<div className="flex flex-col space-y-1">
												<p className="text-sm font-medium leading-none">
													{session?.user?.name || "User"}
												</p>
												<p className="text-xs leading-none text-muted-foreground">
													{session?.user?.email}
												</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/dashboard" className="cursor-pointer">
												<User className="mr-2 h-4 w-4" />
												<span>Dashboard</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link
												href="/dashboard/profile"
												className="cursor-pointer"
											>
												<Settings className="mr-2 h-4 w-4" />
												<span>Settings</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="cursor-pointer text-red-600 focus:text-red-600"
											onClick={() => signOut({ callbackUrl: "/" })}
										>
											<LogOut className="mr-2 h-4 w-4" />
											<span>Log out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<Link
									href="/auth/user/signin"
									className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								>
									<User className="w-5 h-5 text-gray-700" />
								</Link>
							)}
							<button
								className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
								onClick={() => setIsMenuOpen(!isMenuOpen)}
							>
								{isMenuOpen ? (
									<X className="w-5 h-5 text-gray-700" />
								) : (
									<Menu className="w-5 h-5 text-gray-700" />
								)}
							</button>
						</div>
					</div>

					{/* Mobile Menu */}
					{isMenuOpen && (
						<div className="lg:hidden py-4 border-t animate-in slide-in-from-top">
							{menuItems.map((item) => (
								<div key={item.name} className="border-b last:border-b-0">
									<Link
										href={item.href}
										className="block px-4 py-3 text-gray-800 hover:bg-orange-50 hover:text-orange-500 transition-colors"
										onClick={() => setIsMenuOpen(false)}
									>
										{item.name}
									</Link>
									{item.megaMenu && (
										<div className="pl-8">
											<div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
												Spiritual Guides
											</div>
											{item.leftColumn?.map((subItem) => (
												<Link
													key={subItem.name}
													href={subItem.href}
													className="block px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors text-sm"
													onClick={() => setIsMenuOpen(false)}
												>
													{subItem.name}
												</Link>
											))}
											<div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-2">
												Services
											</div>
											{item.rightColumn?.map((subItem) => (
												<Link
													key={subItem.name}
													href={subItem.href}
													className="block px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors text-sm"
													onClick={() => setIsMenuOpen(false)}
												>
													{subItem.name}
												</Link>
											))}
											{item.viewAllLink && (
												<div className="px-4 mt-3">
													<Link
														href={item.viewAllLink.href}
														onClick={() => setIsMenuOpen(false)}
														className="block"
													>
														<LiquidButton
															size="sm"
															variant="default"
															className="w-full text-orange-500"
														>
															{item.viewAllLink.name}
														</LiquidButton>
													</Link>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</nav>
		</>
	);
}
