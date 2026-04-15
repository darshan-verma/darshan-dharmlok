"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";

export interface FilterState {
	priceRange: [number, number];
	starRatings: number[];
	mealTypes: string[];
	refundable: boolean;
}

interface HotelFiltersProps {
	filters: FilterState;
	onFilterChange: (filters: FilterState) => void;
	priceRange?: {
		min: number;
		max: number;
	};
}

export default function HotelFilters({
	filters,
	onFilterChange,
	priceRange = { min: 0, max: 50000 },
}: HotelFiltersProps) {
	const [localFilters, setLocalFilters] = useState<FilterState>(filters);

	const handlePriceChange = (value: number[]) => {
		const newFilters = {
			...localFilters,
			priceRange: [value[0], value[1]] as [number, number],
		};
		setLocalFilters(newFilters);
		onFilterChange(newFilters);
	};

	const handleStarRatingToggle = (rating: number) => {
		const newRatings = localFilters.starRatings.includes(rating)
			? localFilters.starRatings.filter((r) => r !== rating)
			: [...localFilters.starRatings, rating];

		const newFilters = {
			...localFilters,
			starRatings: newRatings,
		};
		setLocalFilters(newFilters);
		onFilterChange(newFilters);
	};

	const handleMealTypeToggle = (mealType: string) => {
		const newMealTypes = localFilters.mealTypes.includes(mealType)
			? localFilters.mealTypes.filter((m) => m !== mealType)
			: [...localFilters.mealTypes, mealType];

		const newFilters = {
			...localFilters,
			mealTypes: newMealTypes,
		};
		setLocalFilters(newFilters);
		onFilterChange(newFilters);
	};

	const handleRefundableToggle = () => {
		const newFilters = {
			...localFilters,
			refundable: !localFilters.refundable,
		};
		setLocalFilters(newFilters);
		onFilterChange(newFilters);
	};

	const resetFilters = () => {
		const defaultFilters: FilterState = {
			priceRange: [priceRange.min, priceRange.max],
			starRatings: [],
			mealTypes: [],
			refundable: false,
		};
		setLocalFilters(defaultFilters);
		onFilterChange(defaultFilters);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Filters</h2>
				<Button variant="ghost" size="sm" onClick={resetFilters}>
					Reset All
				</Button>
			</div>

			{/* Price Range Filter */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Price Range</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Slider
							value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
							onValueChange={handlePriceChange}
							min={priceRange.min}
							max={priceRange.max}
							step={500}
							className="w-full"
						/>
						<div className="flex justify-between text-sm text-gray-600">
							<span>₹ {formatTravelPriceInr(localFilters.priceRange[0])}</span>
							<span>₹ {formatTravelPriceInr(localFilters.priceRange[1])}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Star Rating Filter */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Star Rating</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[5, 4, 3, 2, 1].map((rating) => (
							<div key={rating} className="flex items-center space-x-2">
								<Checkbox
									id={`star-${rating}`}
									checked={localFilters.starRatings.includes(rating)}
									onCheckedChange={() => handleStarRatingToggle(rating)}
								/>
								<Label
									htmlFor={`star-${rating}`}
									className="flex items-center gap-1 cursor-pointer"
								>
									{Array.from({ length: rating }).map((_, i) => (
										<Star
											key={i}
											className="w-4 h-4 fill-yellow-400 text-yellow-400"
										/>
									))}
								</Label>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Meal Type Filter */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Meal Type</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[
							{ value: "Room_Only", label: "Room Only" },
							{ value: "Breakfast", label: "Breakfast Included" },
							{ value: "HalfBoard", label: "Half Board" },
							{ value: "FullBoard", label: "Full Board" },
							{ value: "AllInclusive", label: "All Inclusive" },
						].map((meal) => (
							<div key={meal.value} className="flex items-center space-x-2">
								<Checkbox
									id={`meal-${meal.value}`}
									checked={localFilters.mealTypes.includes(meal.value)}
									onCheckedChange={() => handleMealTypeToggle(meal.value)}
								/>
								<Label
									htmlFor={`meal-${meal.value}`}
									className="cursor-pointer"
								>
									{meal.label}
								</Label>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Cancellation Policy Filter */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Cancellation Policy</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="refundable"
							checked={localFilters.refundable}
							onCheckedChange={handleRefundableToggle}
						/>
						<Label htmlFor="refundable" className="cursor-pointer">
							Free Cancellation
						</Label>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
