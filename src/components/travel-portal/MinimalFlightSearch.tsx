"use client";

import { Calendar, Users, Plane, Search, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface MinimalFlightSearchProps {
	from: { city: string; code: string };
	to: { city: string; code: string };
	departureDate?: Date;
	returnDate?: Date;
	travellers: { adults: number; children: number; infants: number };
	travelClass: string;
	tripType: string;
	onModifySearch: () => void;
}

export default function MinimalFlightSearch({
	from,
	to,
	departureDate,
	returnDate,
	travellers,
	travelClass,
	tripType,
	onModifySearch,
}: MinimalFlightSearchProps) {
	const totalTravellers =
		travellers.adults + travellers.children + travellers.infants;

	return (
		<div className="bg-white shadow-md border-b border-slate-200 py-3 px-4">
			<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
				{/* Flight Route */}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<Plane className="h-4 w-4 text-blue-600 flex-shrink-0" />
					<div className="flex items-center gap-2 min-w-0 text-sm">
						<div className="font-semibold text-gray-900 truncate">
							{from.code || "---"}
						</div>
						<ArrowRightLeft className="h-3 w-3 text-gray-400 flex-shrink-0" />
						<div className="font-semibold text-gray-900 truncate">
							{to.code || "---"}
						</div>
					</div>
				</div>

				{/* Dates */}
				{tripType !== "multi-city" && (
					<div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
						<Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
						<span className="whitespace-nowrap">
							{departureDate ? format(departureDate, "dd MMM") : "Select Date"}
						</span>
						{tripType === "round-trip" && (
							<>
								<span>-</span>
								<span className="whitespace-nowrap">
									{returnDate ? format(returnDate, "dd MMM") : "Select Date"}
								</span>
							</>
						)}
					</div>
				)}

				{/* Travellers & Class */}
				<div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
					<Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
					<span className="whitespace-nowrap">
						{totalTravellers}{" "}
						{totalTravellers === 1 ? "Traveller" : "Travellers"}
					</span>
					<span className="text-gray-400">•</span>
					<span className="whitespace-nowrap">{travelClass}</span>
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
