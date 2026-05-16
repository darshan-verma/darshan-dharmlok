"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, MapPin, Briefcase, Shield, Umbrella } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function Navbar() {
	const pathname = usePathname();
	const { t } = useTranslation();

	const menuItems = [
		{
			name: t("travel.flightSearch"),
			href: "/travel-portal",
			icon: Plane,
			match: (path: string) => path === "/travel-portal",
		},
		{
			name: t("travel.destinations"),
			href: "/travel-portal/destinations",
			icon: MapPin,
			match: (path: string) => path.includes("/destinations"),
		},
		{
			name: t("travel.travelInsurance"),
			href: "/travel-portal/insurance",
			icon: Umbrella,
			match: (path: string) => path.includes("/travel-portal/insurance"),
		},
		{
			name: t("travel.myTrips"),
			href: "/travel-portal/my-trips",
			icon: Briefcase,
			match: (path: string) => path.includes("/my-trips"),
		},
		{
			name: t("travel.manageBooking"),
			href: "/travel-portal/manage-booking",
			icon: Shield,
			match: (path: string) => path.includes("/manage-booking"),
		},
	];

	return (
		<nav
			className="sticky top-20 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm transition-all duration-300"
			style={{
				backdropFilter: "blur(24px) saturate(180%)",
				WebkitBackdropFilter: "blur(24px) saturate(180%)",
			}}
		>
			<div className="container mx-auto px-4">
				<div className="flex items-center h-14">
					<div className="flex items-center gap-2">
						{menuItems.map((item) => {
							const isActive = item.match(pathname);
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
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
