"use client";
import {
	Plane,
	Building,
	Home,
	Package,
	Train,
	Bus,
	Car,
	MapPin,
	CreditCard,
	Ship,
	Banknote,
	Shield,
} from "lucide-react";

const categories = [
	{ name: "Flights", icon: Plane, badge: null },
	{ name: "Hotels", icon: Building, badge: null },
	{ name: "Homestays", icon: Home, badge: null },
	{ name: "Holiday Packages", icon: Package, badge: null },
	{ name: "Trains", icon: Train, badge: null },
	{ name: "Buses", icon: Bus, badge: null },
	{ name: "Cabs", icon: Car, badge: null },
	{ name: "Tours & Attractions", icon: MapPin, badge: null },
	{ name: "Visa", icon: CreditCard, badge: null },
	{ name: "Cruise", icon: Ship, badge: "NEW" },
	{ name: "Forex Card & Currency", icon: Banknote, badge: null },
	{ name: "Travel Insurance", icon: Shield, badge: "NEW" },
];

interface CategoryTabsProps {
	activeCategory: string;
	onCategoryChange: (category: string) => void;
}

export default function CategoryTabs({
	activeCategory,
	onCategoryChange,
}: CategoryTabsProps) {
	return (
		<div className="bg-white rounded-t-3xl pt-4">
			<div className="flex overflow-x-auto gap-6 pb-1 px-4 sm:px-6 lg:px-8 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				{categories.map((category) => {
					const isActive = activeCategory === category.name;
					return (
						<button
							key={category.name}
							onClick={() => onCategoryChange(category.name)}
							className={`relative flex flex-col items-center gap-1.5 py-2 px-3 min-w-fit transition-all duration-200 group ${
								isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
							}`}
						>
							{/* NEW Badge */}
							{category.badge && (
								<span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
									{category.badge}
								</span>
							)}

							{/* Icon */}
							<div className="relative">
								<category.icon
									className={`h-6 w-6 ${
										isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
									}`}
								/>
							</div>

							{/* Label */}
							<span
								className={`text-xs whitespace-nowrap ${
									isActive ? "font-semibold" : "font-normal"
								}`}
							>
								{category.name}
							</span>

							{/* Active Indicator */}
							{isActive && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-sm"></div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
