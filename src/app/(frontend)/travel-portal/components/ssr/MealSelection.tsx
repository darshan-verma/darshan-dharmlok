"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PassengerDetail } from "@/types/tbo";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CheckCircle2, Search } from "lucide-react";

export interface MealOption {
	AirlineCode: string;
	FlightNumber: string;
	WayType: number;
	Code: string;
	Description: number;
	AirlineDescription: string;
	Quantity: number;
	Currency: string;
	Price: number;
	Origin: string;
	Destination: string;
}

interface MealSelectionProps {
	mealData: MealOption[][];
	passengers: PassengerDetail[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	selectedMeals: Record<string, MealOption | null>; // Key: `${passengerIndex}-${segmentIndex}`
	onSelect: (
		passengerIndex: number,
		segmentIndex: number,
		meal: MealOption | null
	) => void;
}

export default function MealSelection({
	mealData,
	passengers,
	adultCount,
	childCount,
	infantCount,
	selectedMeals,
	onSelect,
}: MealSelectionProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activePassengerIndex, setActivePassengerIndex] = useState(0);
	const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

	if (!mealData || mealData.length === 0) return null;

	// Helper function to get passenger label
	const getPassengerLabel = (passengerIndex: number) => {
		let count = 0;
		if (passengerIndex < adultCount) {
			return `${passengerIndex + 1}${
				passengerIndex === 0
					? "st"
					: passengerIndex === 1
					? "nd"
					: passengerIndex === 2
					? "rd"
					: "th"
			} Adult`;
		}
		count += adultCount;
		if (passengerIndex < count + childCount) {
			const childIndex = passengerIndex - adultCount;
			return `${childIndex + 1}${
				childIndex === 0
					? "st"
					: childIndex === 1
					? "nd"
					: childIndex === 2
					? "rd"
					: "th"
			} Child`;
		}
		count += childCount;
		if (passengerIndex < count + infantCount) {
			const infantIndex = passengerIndex - count;
			return `${infantIndex + 1}${
				infantIndex === 0
					? "st"
					: infantIndex === 1
					? "nd"
					: infantIndex === 2
					? "rd"
					: "th"
			} Infant`;
		}
		return `Passenger ${passengerIndex + 1}`;
	};

	// Helper to categorize meals
	const categorizeMeal = (description: string) => {
		const lower = description.toLowerCase();
		if (lower.includes("veg") && !lower.includes("non-veg")) return "Veg";
		if (
			lower.includes("non-veg") ||
			lower.includes("chicken") ||
			lower.includes("egg") ||
			lower.includes("meat") ||
			lower.includes("fish")
		)
			return "Non-Veg";
		if (
			lower.includes("tea") ||
			lower.includes("coffee") ||
			lower.includes("cookie") ||
			lower.includes("sandwich") ||
			lower.includes("snack") ||
			lower.includes("combo")
		)
			return "Snacks";
		return "Other";
	};

	// Helper to shorten meal names
	const shortenMealName = (name: string) => {
		// Limit to 40 characters for display
		if (name.length > 40) {
			return name.substring(0, 37) + "...";
		}
		return name;
	};

	const getFilteredMeals = (meals: MealOption[], category: string) => {
		return meals.filter((meal) => {
			const mealCat = categorizeMeal(meal.AirlineDescription);
			const matchesSearch = meal.AirlineDescription.toLowerCase().includes(
				searchQuery.toLowerCase()
			);
			return (category === "All" || mealCat === category) && matchesSearch;
		});
	};

	return (
		<div className="space-y-6">
			{mealData.map((segmentMeals, segmentIndex) => {
				if (!segmentMeals || segmentMeals.length === 0) return null;
				const origin = segmentMeals[0].Origin;
				const destination = segmentMeals[0].Destination;

				return (
					<div key={segmentIndex} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground">
							{origin} → {destination}
						</h4>

                                                {passengers.map((_, passengerIndex) => {
                                                        const key = `${passengerIndex}-${segmentIndex}`;
                                                        const selected = selectedMeals[key];							// Get top 3 meals (e.g., 1 Veg, 1 Non-Veg, 1 Snack)
							const topMeals = segmentMeals.slice(0, 3);

							return (
								<div key={passengerIndex} className="space-y-2">
									<p className="text-sm font-semibold">
										{getPassengerLabel(passengerIndex)}
									</p>

									<div className="space-y-2">
										{topMeals.map((meal) => {
											const isSelected = selected?.Code === meal.Code;
											const mealCategory = categorizeMeal(
												meal.AirlineDescription
											);
											return (
												<div
													key={meal.Code}
													onClick={() =>
														onSelect(
															passengerIndex,
															segmentIndex,
															isSelected ? null : meal
														)
													}
													className={cn(
														"flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
														isSelected
															? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
															: "border-gray-200 hover:border-gray-300"
													)}
												>
													<div className="flex items-center gap-3 flex-1 min-w-0">
														<div
															className={cn(
																"h-3 w-3 rounded-full flex-shrink-0",
																mealCategory === "Veg"
																	? "bg-green-500"
																	: mealCategory === "Non-Veg"
																	? "bg-red-500"
																	: "bg-yellow-500"
															)}
														/>
														<span
															className="text-sm font-medium truncate"
															title={meal.AirlineDescription}
														>
															{shortenMealName(meal.AirlineDescription)}
														</span>
													</div>
													<div className="flex items-center gap-3 flex-shrink-0">
														<span className="text-sm font-bold text-gray-900">
															₹{meal.Price.toLocaleString("en-IN")}
														</span>
														{isSelected ? (
															<CheckCircle2 className="h-5 w-5 text-blue-600" />
														) : (
															<div className="h-5 w-5 rounded-full border-2 border-gray-300" />
														)}
													</div>
												</div>
											);
										})}
									</div>

									<Button
										variant="link"
										className="text-blue-600 p-0 h-auto text-sm"
										onClick={() => {
											setActivePassengerIndex(passengerIndex);
											setActiveSegmentIndex(segmentIndex);
											setIsModalOpen(true);
										}}
									>
										View all meals
									</Button>
								</div>
							);
						})}
					</div>
				);
			})}

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-2xl h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>
							Select Meal for {getPassengerLabel(activePassengerIndex)}
						</DialogTitle>
					</DialogHeader>

					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search meals..."
							className="pl-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<Tabs
						defaultValue="All"
						className="flex-1 flex flex-col overflow-hidden"
					>
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="All">All</TabsTrigger>
							<TabsTrigger value="Veg">Veg</TabsTrigger>
							<TabsTrigger value="Non-Veg">Non-Veg</TabsTrigger>
							<TabsTrigger value="Snacks">Snacks</TabsTrigger>
						</TabsList>

						{["All", "Veg", "Non-Veg", "Snacks"].map((category) => (
							<TabsContent
								key={category}
								value={category}
								className="flex-1 overflow-hidden mt-2"
							>
								<ScrollArea className="h-full pr-4">
									<div className="space-y-2">
										{mealData[activeSegmentIndex] &&
											getFilteredMeals(
												mealData[activeSegmentIndex],
												category
											).map((meal) => {
												const key = `${activePassengerIndex}-${activeSegmentIndex}`;
												const isSelected =
													selectedMeals[key]?.Code === meal.Code;

												return (
													<div
														key={meal.Code}
														onClick={() => {
															onSelect(
																activePassengerIndex,
																activeSegmentIndex,
																isSelected ? null : meal
															);
															// Optional: Close modal on selection? No, user might want to browse.
														}}
														className={cn(
															"flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
															isSelected
																? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
																: "border-gray-200 hover:border-gray-300"
														)}
													>
														<div className="flex items-center gap-3 flex-1 min-w-0">
															<div
																className={cn(
																	"h-3 w-3 rounded-full flex-shrink-0",
																	categorizeMeal(meal.AirlineDescription) ===
																		"Veg"
																		? "bg-green-500"
																		: categorizeMeal(
																				meal.AirlineDescription
																		  ) === "Non-Veg"
																		? "bg-red-500"
																		: "bg-yellow-500"
																)}
															/>
															<span
																className="text-sm font-medium"
																title={meal.AirlineDescription}
															>
																{meal.AirlineDescription}
															</span>
														</div>
														<div className="flex items-center gap-3 flex-shrink-0">
															<span className="text-sm font-bold text-gray-900">
																₹{meal.Price.toLocaleString("en-IN")}
															</span>
															{isSelected ? (
																<CheckCircle2 className="h-5 w-5 text-blue-600" />
															) : (
																<div className="h-5 w-5 rounded-full border-2 border-gray-300" />
															)}
														</div>
													</div>
												);
											})}
									</div>
								</ScrollArea>
							</TabsContent>
						))}
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
