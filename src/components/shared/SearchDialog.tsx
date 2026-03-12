"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ArrowRight, X, Hotel, MapPin } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchablePages, categories } from "@/lib/searchable-pages";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";

interface SearchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children?: React.ReactNode;
}

interface HotelResult {
	id: string;
	type: "hotel" | "city";
	name: string;
	countryCode: string;
	cityCode?: string;
	hotelCode?: string;
}

type SearchResult = {
	title: string;
	description: string;
	href: string;
	category: string;
	keywords?: string[];
	resultType?: "page" | "hotel" | "city";
	hotelCode?: string;
	cityCode?: string;
};

export function SearchDialog({
	open,
	onOpenChange,
	children,
}: SearchDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [hotelResults, setHotelResults] = useState<HotelResult[]>([]);
	const router = useRouter();

	// Configure Fuse.js for fuzzy search
	const fuse = useMemo(
		() =>
			new Fuse(searchablePages, {
				keys: [
					{ name: "title", weight: 2 },
					{ name: "description", weight: 1 },
					{ name: "keywords", weight: 1.5 },
					{ name: "category", weight: 0.5 },
				],
				threshold: 0.4, // Lower = more strict matching
				includeScore: true,
				minMatchCharLength: 2,
				ignoreLocation: true,
			}),
		[],
	);

	// Search hotels from database
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.length < 2) {
			setHotelResults([]);
			return;
		}

		// Only search hotels if "All" or "Travel" category is selected
		if (selectedCategory !== "All" && selectedCategory !== "Travel") {
			setHotelResults([]);
			return;
		}

		const searchHotels = async () => {
			try {
				const response = await fetch(
					`/api/travel/hotel-search?q=${encodeURIComponent(searchQuery)}&limit=5&type=hotel`,
				);
				const data = await response.json();
				if (data.success && data.results) {
					setHotelResults(data.results);
				} else {
					setHotelResults([]);
				}
			} catch (error) {
				console.error("Error searching hotels:", error);
				setHotelResults([]);
			}
		};

		const debounceTimer = setTimeout(searchHotels, 300);
		return () => clearTimeout(debounceTimer);
	}, [searchQuery, selectedCategory]);

	// Perform fuzzy search and merge with hotel results
	const searchResults = useMemo(() => {
		let pageResults: SearchResult[] = [];

		if (!searchQuery.trim()) {
			// If no search query, show all pages filtered by category
			pageResults =
				selectedCategory === "All"
					? searchablePages
					: searchablePages.filter(
							(page) => page.category === selectedCategory,
						);
		} else {
			// Perform fuzzy search on pages
			const results = fuse.search(searchQuery);
			pageResults = results.map((result) => ({
				...result.item,
				resultType: "page" as const,
			}));

			// Filter by category if not "All"
			if (selectedCategory !== "All") {
				pageResults = pageResults.filter(
					(page) => page.category === selectedCategory,
				);
			}
		}

		// Add hotel results if applicable
		if (
			searchQuery.trim() &&
			(selectedCategory === "All" || selectedCategory === "Travel")
		) {
			// Generate default dates: tomorrow for check-in, day after tomorrow for check-out
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dayAfterTomorrow = new Date();
			dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

			const formatDate = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};

			const checkInDate = formatDate(tomorrow);
			const checkOutDate = formatDate(dayAfterTomorrow);

			const hotelSearchResults: SearchResult[] = hotelResults.map((hotel) => {
				// Always use cityCode as the locationCode, even for hotels
				// since the search page fetches all hotels in a city
				const locationCode = hotel.cityCode || hotel.hotelCode || "";

				const params = new URLSearchParams({
					location: hotel.name,
					locationCode: locationCode,
					checkIn: checkInDate,
					checkOut: checkOutDate,
					rooms: "1",
					adults: "1",
					children: "0",
				});

				// Add hotelCode if it's a specific hotel search
				if (hotel.type === "hotel" && hotel.hotelCode) {
					params.set("hotelCode", hotel.hotelCode);
				}

				return {
					title: hotel.name,
					description:
						hotel.type === "hotel"
							? "Hotel - Book now"
							: `${hotel.type === "city" ? "City" : "Location"} - View hotels`,
					href: `/travel-portal/hotel-search?${params.toString()}`,
					category: "Travel",
					resultType: hotel.type === "hotel" ? "hotel" : "city",
					hotelCode: hotel.hotelCode,
					cityCode: hotel.cityCode,
				};
			});
			pageResults = [...hotelSearchResults, ...pageResults];
		}

		return pageResults;
	}, [searchQuery, selectedCategory, fuse, hotelResults]);

	// Reset search when dialog closes
	useEffect(() => {
		if (!open) {
			setSearchQuery("");
			setSelectedCategory("All");
		}
	}, [open]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Open search with Cmd/Ctrl + K
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				onOpenChange(!open);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	const handleNavigate = (href: string) => {
		onOpenChange(false);
		router.push(href);
	};

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				className="w-[420px] p-0 mr-4 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl"
				align="end"
				sideOffset={8}
				style={{
					backdropFilter: "blur(40px) saturate(180%)",
					WebkitBackdropFilter: "blur(40px) saturate(180%)",
				}}
			>
				<div className="px-4 pt-4 pb-3 border-b border-white/30">
					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
						<Input
							type="text"
							placeholder="Search pages, hotels, cities..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="border-0 focus-visible:ring-0 text-sm px-0 h-auto py-0 bg-transparent"
							autoFocus
						/>
						<button
							onClick={() => onOpenChange(false)}
							className="p-1 hover:bg-white/50 rounded-full transition-colors flex-shrink-0"
						>
							<X className="w-4 h-4 text-gray-500" />
						</button>
					</div>
				</div>

				{/* Category Filters */}
				<div className="px-4 py-2 border-b border-white/30 bg-white/20 overflow-x-auto scrollbar-hide">
					<div className="flex gap-1.5 min-w-max">
						{categories.map((category) => (
							<Badge
								key={category}
								variant={selectedCategory === category ? "default" : "outline"}
								className={`cursor-pointer transition-colors text-xs ${
									selectedCategory === category
										? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
										: "hover:bg-white/50 border-white/40"
								}`}
								onClick={() => setSelectedCategory(category)}
							>
								{category}
							</Badge>
						))}
					</div>
				</div>

				{/* Search Results */}
				<div className="overflow-y-auto max-h-[50vh] px-4 py-3">
					{searchResults.length === 0 ? (
						<div className="text-center py-8">
							<Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
							<p className="text-gray-600 text-sm font-medium">
								No results found
							</p>
							<p className="text-gray-500 text-xs mt-1">
								Try adjusting your search
							</p>
						</div>
					) : (
						<div className="space-y-1.5">
							{searchResults.map((page, index) => {
								const isHotel = page.resultType === "hotel";
								const isCity = page.resultType === "city";
								const Icon = isHotel ? Hotel : isCity ? MapPin : null;

								return (
									<button
										key={`${page.href}-${index}`}
										onClick={() => handleNavigate(page.href)}
										className="w-full text-left p-3 rounded-lg hover:bg-white/50 transition-colors group border border-transparent hover:border-orange-200/50"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-2 flex-1 min-w-0">
												{Icon && (
													<Icon className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
												)}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-0.5">
														<h3 className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
															{page.title}
														</h3>
														<Badge
															variant={
																isHotel || isCity ? "default" : "secondary"
															}
															className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
																isHotel
																	? "bg-orange-500 hover:bg-orange-600 text-white"
																	: isCity
																		? "bg-blue-500 hover:bg-blue-600 text-white"
																		: ""
															}`}
														>
															{isHotel
																? "Hotel"
																: isCity
																	? "City"
																	: page.category}
														</Badge>
													</div>
													<p className="text-xs text-gray-600 line-clamp-1">
														{page.description}
													</p>
												</div>
											</div>
											<ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5" />
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-4 py-2 border-t border-white/30 bg-white/20">
					<div className="flex items-center justify-between text-xs text-gray-600">
						<span className="text-[11px]">
							{searchResults.length}{" "}
							{searchResults.length === 1 ? "result" : "results"}
						</span>
						<div className="flex items-center gap-1.5">
							<kbd className="px-1.5 py-0.5 bg-white/50 border border-white/40 rounded text-[10px]">
								Esc
							</kbd>
							<span className="text-[11px]">Close</span>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
