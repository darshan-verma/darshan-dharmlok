"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, MapPin, Briefcase } from "lucide-react";

export default function Navbar() {
	const pathname = usePathname();
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			setIsScrolled(scrollPosition > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const menuItems = [
		{
			name: "Flight Search",
			href: "/travel-portal",
			icon: Plane,
			match: (path: string) => path === "/travel-portal",
		},
		{
			name: "Destinations",
			href: "/travel-portal/destinations",
			icon: MapPin,
			match: (path: string) => path.includes("/destinations"),
		},
		{
			name: "My Trips",
			href: "/travel-portal/my-trips",
			icon: Briefcase,
			match: (path: string) => path.includes("/my-trips"),
		},
	];

	return (
		<nav className="sticky top-0 z-40 transition-all duration-300">
			<div className="container mx-auto px-4">
				<div className="flex items-center h-10">
					<div className="flex items-center gap-2">
						{menuItems.map((item) => {
							const isActive = item.match(pathname);
							const Icon = item.icon;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
										isActive
											? "text-orange-500 bg-orange-50/80 shadow-sm"
											: "text-gray-700 hover:text-orange-500 hover:bg-orange-50/50"
									}`}
								>
									<Icon className="w-4 h-4" />
									{item.name}
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</nav>
	);
}
