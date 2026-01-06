"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Hotel, Building2 } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface City {
	name: string;
	country: string;
	code?: string;
	type?: "country" | "city" | "hotel";
	hotelCode?: string;
	cityCode?: string;
	countryCode?: string;
}

interface HotelLocationSelectorProps {
	location: City;
	onLocationChange: (location: City) => void;
	placeholder?: string;
}

interface SearchResult {
	id: string;
	type: "country" | "city" | "hotel";
	name: string;
	countryCode: string;
	cityCode?: string;
	hotelCode?: string;
}

// Popular Indian destinations for initial display
const popularDestinations: City[] = [
	{
		name: "Mumbai",
		country: "India",
		code: "144306",
		type: "city",
		cityCode: "144306",
		countryCode: "IN",
	},
	{
		name: "New Delhi",
		country: "India",
		code: "130443",
		type: "city",
		cityCode: "130443",
		countryCode: "IN",
	},
	{
		name: "Bengaluru",
		country: "India",
		code: "111124",
		type: "city",
		cityCode: "111124",
		countryCode: "IN",
	},
	{
		name: "Jaipur",
		country: "India",
		code: "122175",
		type: "city",
		cityCode: "122175",
		countryCode: "IN",
	},
	{
		name: "Goa",
		country: "India",
		code: "119805",
		type: "city",
		cityCode: "119805",
		countryCode: "IN",
	},
	{
		name: "Agra",
		country: "India",
		code: "100589",
		type: "city",
		cityCode: "100589",
		countryCode: "IN",
	},
];

export default function HotelLocationSelector({
	location,
	onLocationChange,
	placeholder = "City, Property Name Or Location",
}: HotelLocationSelectorProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredDestinations, setFilteredDestinations] =
		useState<City[]>(popularDestinations);
	const [isSearching, setIsSearching] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (searchQuery.trim() === "") {
			setFilteredDestinations(popularDestinations);
			setIsSearching(false);
			return;
		}

		// Clear previous timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Debounce search
		searchTimeoutRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await fetch(
					`/api/travel/hotel-search?q=${encodeURIComponent(
						searchQuery
					)}&limit=10`
				);
				const data = await response.json();

				if (data.success && data.results) {
					const destinations: City[] = data.results.map(
						(result: SearchResult) => ({
							name: result.name,
							country: "India", // Since we're only syncing India for now
							code: result.cityCode || result.hotelCode || result.countryCode,
							type: result.type,
							cityCode: result.cityCode,
							hotelCode: result.hotelCode,
							countryCode: result.countryCode,
						})
					);
					setFilteredDestinations(destinations);
				} else {
					setFilteredDestinations([]);
				}
			} catch (error) {
				console.error("Error searching hotels:", error);
				setFilteredDestinations([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery]);

	useEffect(() => {
		if (open && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open]);

	const handleSelect = (city: City) => {
		onLocationChange(city);
		setOpen(false);
		setSearchQuery("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left w-full h-full">
					<div className="flex items-center gap-3">
						<MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<div className="text-xs text-gray-500 mb-1 uppercase">
								{placeholder}
							</div>
							{location.name ? (
								<>
									<div className="text-lg font-bold text-gray-900 truncate">
										{location.name}
									</div>
									<div className="text-xs text-gray-600 truncate">
										{location.country}
									</div>
								</>
							) : (
								<div className="text-lg font-bold text-gray-400">
									Select Location
								</div>
							)}
						</div>
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-96 p-0" align="start">
				<div className="p-4 space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
						<input
							ref={inputRef}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search city, hotel, or destination..."
							className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						{isSearching && (
							<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
						)}
					</div>

					{/* Destinations List */}
					<div className="space-y-1 max-h-96 overflow-y-auto">
						{filteredDestinations.length > 0 ? (
							<>
								{searchQuery.trim() === "" && (
									<div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
										Trending Searches
									</div>
								)}
								{filteredDestinations.map((dest, index) => (
									<button
										key={index}
										onClick={() => handleSelect(dest)}
										className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
									>
										{dest.type === "hotel" ? (
											<Hotel className="h-5 w-5 text-blue-500 flex-shrink-0" />
										) : dest.type === "city" ? (
											<Building2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										) : (
											<MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<div className="text-sm font-semibold text-gray-900 truncate">
												{dest.name}
											</div>
											<div className="text-xs text-gray-600 truncate flex items-center gap-1">
												{dest.country}
												{dest.type && (
													<span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
														{dest.type === "hotel"
															? "Hotel"
															: dest.type === "city"
															? "City"
															: "Country"}
													</span>
												)}
											</div>
										</div>
									</button>
								))}
							</>
						) : (
							<div className="text-center py-8 text-gray-500">
								<MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
								<p className="text-sm">
									{isSearching ? "Searching..." : "No destinations found"}
								</p>
								<p className="text-xs mt-1">
									Try searching for cities or hotels in India
								</p>
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
