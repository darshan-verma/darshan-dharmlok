"use client";

import { Calendar, Users, Hotel, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface MinimalHotelSearchProps {
	location: string;
	checkInDate?: Date;
	checkOutDate?: Date;
	rooms: number;
	adults: number;
	childrenCount: number;
	onModifySearch: () => void;
}

export default function MinimalHotelSearch({
	location,
	checkInDate,
	checkOutDate,
	rooms,
	adults,
	childrenCount,
	onModifySearch,
}: MinimalHotelSearchProps) {
	const totalGuests = adults + childrenCount;

	return (
		<div className="bg-white shadow-md border-b border-slate-200 py-3 px-4">
			<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
				{/* Location */}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<Hotel className="h-4 w-4 text-blue-600 flex-shrink-0" />
					<div className="flex items-center gap-2 min-w-0 text-sm">
						<div className="font-semibold text-gray-900 truncate">
							{location || "Select Location"}
						</div>
					</div>
				</div>

				{/* Dates */}
				<div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
					<Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
					<span className="whitespace-nowrap">
						{checkInDate ? format(checkInDate, "dd MMM") : "Check-in"}
					</span>
					<span>-</span>
					<span className="whitespace-nowrap">
						{checkOutDate ? format(checkOutDate, "dd MMM") : "Check-out"}
					</span>
				</div>

				{/* Guests & Rooms */}
				<div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
					<Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
					<span className="whitespace-nowrap">
						{totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
					</span>
					<span className="text-gray-400">•</span>
					<span className="whitespace-nowrap">
						{rooms} {rooms === 1 ? "Room" : "Rooms"}
					</span>
				</div>

				{/* Modify Search Button */}
				<Button
					onClick={onModifySearch}
					size="sm"
					className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
				>
					<Search className="h-4 w-4 mr-2" />
					<span className="hidden sm:inline">Modify</span>
					<span className="sm:hidden">Edit</span>
				</Button>
			</div>
		</div>
	);
}
