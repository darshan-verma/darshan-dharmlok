"use client";
import { useEffect, useState } from "react";
import DestinationCard from "../../components/travel-portal/DestinationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface Destination {
	id: string;
	name: string;
	description: string;
	image: string;
	location: string;
	category: string;
	price: number;
}

export default function DestinationsPage() {
	const [destinations, setDestinations] = useState<Destination[]>([]);
	const [filteredDestinations, setFilteredDestinations] = useState<
		Destination[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [locationFilter, setLocationFilter] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [priceFilter, setPriceFilter] = useState("");
	const [sortBy, setSortBy] = useState<string>("name");

	// Get unique categories from destinations
	const categories = Array.from(
		new Set(destinations.map((dest) => dest.category))
	);

	useEffect(() => {
		setLoading(true);
		fetch("/api/travel")
			.then((res) => res.json())
			.then((data) => {
				setDestinations(data);
				setFilteredDestinations(data);
			})
			.catch((error) => {
				console.error("Error fetching destinations:", error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		let filtered = destinations;

		// Apply filters
		if (locationFilter) {
			filtered = filtered.filter((dest) =>
				dest.location.toLowerCase().includes(locationFilter.toLowerCase())
			);
		}
		if (categoryFilter && categoryFilter !== "all") {
			filtered = filtered.filter((dest) => dest.category === categoryFilter);
		}
		if (priceFilter) {
			const maxPrice = parseInt(priceFilter);
			if (!isNaN(maxPrice)) {
				filtered = filtered.filter((dest) => dest.price <= maxPrice);
			}
		}

		// Apply sorting
		filtered = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "price-low":
					return a.price - b.price;
				case "price-high":
					return b.price - a.price;
				case "name":
				default:
					return a.name.localeCompare(b.name);
			}
		});

		setFilteredDestinations(filtered);
	}, [locationFilter, categoryFilter, priceFilter, sortBy, destinations]);

	const clearFilters = () => {
		setLocationFilter("");
		setCategoryFilter("");
		setPriceFilter("");
		setSortBy("name");
	};

	const hasActiveFilters = locationFilter || categoryFilter || priceFilter;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-3">
						Discover Sacred Destinations
					</h1>
					<p className="text-muted-foreground text-lg">
						Explore {destinations.length} spiritual journeys across India
					</p>
				</div>

				{/* Filters */}
				<Card className="p-6 mb-8">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Filter className="h-5 w-5 text-muted-foreground" />
							<h2 className="font-semibold">Filters</h2>
						</div>
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="text-muted-foreground"
							>
								<X className="h-4 w-4 mr-1" />
								Clear All
							</Button>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Location Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search by location..."
								value={locationFilter}
								onChange={(e) => setLocationFilter(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Category Filter */}
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger>
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Price Filter */}
						<Input
							type="number"
							placeholder="Max price (₹)"
							value={priceFilter}
							onChange={(e) => setPriceFilter(e.target.value)}
							min="0"
						/>

						{/* Sort By */}
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger>
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="name">Name (A-Z)</SelectItem>
								<SelectItem value="price-low">Price: Low to High</SelectItem>
								<SelectItem value="price-high">Price: High to Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</Card>

				{/* Results Count */}
				<div className="mb-6">
					<p className="text-sm text-muted-foreground">
						Showing {filteredDestinations.length} of {destinations.length}{" "}
						destinations
					</p>
				</div>

				{/* Destinations Grid */}
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, index) => (
							<Card key={index} className="overflow-hidden">
								<Skeleton className="h-48 w-full" />
								<div className="p-4 space-y-3">
									<Skeleton className="h-6 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
								</div>
							</Card>
						))}
					</div>
				) : filteredDestinations.length === 0 ? (
					<Card className="p-12 text-center">
						<div className="flex flex-col items-center justify-center">
							<div className="text-6xl mb-4">🏔️</div>
							<h3 className="text-xl font-semibold mb-2">
								No destinations found
							</h3>
							<p className="text-muted-foreground mb-4">
								Try adjusting your filters to see more results
							</p>
							{hasActiveFilters && (
								<Button onClick={clearFilters} variant="outline">
									Clear Filters
								</Button>
							)}
						</div>
					</Card>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredDestinations.map((dest) => (
							<DestinationCard key={dest.id} destination={dest} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
