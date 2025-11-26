"use client";
import { useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface City {
	city: string;
	airport: string;
	code: string;
}

interface FromToSelectorProps {
	from: City;
	to: City;
	onSwap: () => void;
	onFromChange?: (city: City) => void;
	onToChange?: (city: City) => void;
}

// Sample cities data - you can expand this list
const cities: City[] = [
	{ city: "Delhi", airport: "Delhi Airport India", code: "DEL" },
	{ city: "Bengaluru", airport: "Bengaluru International Airport", code: "BLR" },
	{ city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj International Airport", code: "BOM" },
	{ city: "Hyderabad", airport: "Rajiv Gandhi International Airport", code: "HYD" },
	{ city: "Chennai", airport: "Chennai International Airport", code: "MAA" },
	{ city: "Kolkata", airport: "Netaji Subhas Chandra Bose International Airport", code: "CCU" },
	{ city: "Pune", airport: "Pune Airport", code: "PNQ" },
	{ city: "Ahmedabad", airport: "Sardar Vallabhbhai Patel International Airport", code: "AMD" },
	{ city: "Goa", airport: "Goa International Airport", code: "GOI" },
	{ city: "Jaipur", airport: "Jaipur International Airport", code: "JAI" },
];

function CitySelector({
	selectedCity,
	onSelect,
	label,
}: {
	selectedCity: City;
	onSelect: (city: City) => void;
	label: string;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filteredCities = cities.filter(
		(city) =>
			city.city.toLowerCase().includes(search.toLowerCase()) ||
			city.code.toLowerCase().includes(search.toLowerCase()) ||
			city.airport.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="w-full p-4 hover:bg-gray-100 cursor-pointer transition-colors text-left">
					<div className="text-xs text-gray-500 mb-1 uppercase">{label}</div>
					<div className="text-2xl font-bold text-gray-900">
						{selectedCity.city}
					</div>
					<div className="text-xs text-gray-500">
						{selectedCity.code}, {selectedCity.airport}
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<div className="p-3 border-b">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search cities..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div className="max-h-64 overflow-y-auto">
					{filteredCities.length > 0 ? (
						filteredCities.map((city) => (
							<button
								key={city.code}
								onClick={() => {
									onSelect(city);
									setOpen(false);
									setSearch("");
								}}
								className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 ${
									selectedCity.code === city.code ? "bg-blue-50" : ""
								}`}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-semibold text-gray-900">{city.city}</div>
										<div className="text-xs text-gray-500">{city.airport}</div>
									</div>
									<div className="text-sm font-semibold text-gray-600">
										{city.code}
									</div>
								</div>
							</button>
						))
					) : (
						<div className="px-4 py-8 text-center text-sm text-gray-500">
							No cities found
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default function FromToSelector({
	from,
	to,
	onSwap,
	onFromChange,
	onToChange,
}: FromToSelectorProps) {
	const handleFromChange = (city: City) => {
		if (onFromChange) onFromChange(city);
	};

	const handleToChange = (city: City) => {
		if (onToChange) onToChange(city);
	};

	return (
		<div className="flex items-center gap-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
			{/* From Section */}
			<div className="flex-1">
				<CitySelector
					selectedCity={from}
					onSelect={handleFromChange}
					label="From"
				/>
			</div>

			{/* Swap Button */}
			<button
				onClick={onSwap}
				className="p-3 hover:bg-gray-200 transition-colors flex items-center justify-center self-center"
				aria-label="Swap cities"
			>
				<div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all">
					<ArrowLeftRight className="h-4 w-4" />
				</div>
			</button>

			{/* To Section */}
			<div className="flex-1 border-l border-gray-200">
				<CitySelector selectedCity={to} onSelect={handleToChange} label="To" />
			</div>
		</div>
	);
}
