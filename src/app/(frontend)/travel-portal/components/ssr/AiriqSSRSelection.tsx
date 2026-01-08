"use client";

import { useState, useEffect } from "react";
import type { PassengerDetail } from "@/types/tbo";
import type { AiriqPricingResponse } from "@/types/airiq";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Briefcase, Utensils, Armchair } from "lucide-react";
import { Loader2 } from "lucide-react";
import AiriqSeatSelection from "./AiriqSeatSelection";
import type { FlightResult } from "@/types/tbo";

interface AiriqSSRSelectionProps {
	traceId: string;
	resultIndex: string;
	flight: FlightResult;
	passengers: PassengerDetail[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	pricingData: AiriqPricingResponse | null;
	onSSRChange: (ssrs: {
		baggage: Record<string, { Id: string; Price: number } | null>;
		meals: Record<string, { Id: string; Price: number } | null>;
		seats: Record<string, { SeatID: string; Price: number } | null>;
	}) => void;
}

// Airlines that support SSR in AIRiQ
const SSR_SUPPORTED_AIRLINES = ["AI", "UK"]; // AI = Air India, UK = Vistara

export default function AiriqSSRSelection({
	traceId,
	resultIndex,
	flight,
	passengers,
	adultCount,
	childCount,
	infantCount,
	pricingData,
	onSSRChange,
}: AiriqSSRSelectionProps) {
	const [loading, setLoading] = useState(false);
	const [seatMapData, setSeatMapData] = useState<any>(null);
	const [selectedBaggage, setSelectedBaggage] = useState<
		Record<string, { Id: string; Price: number } | null>
	>({});
	const [selectedMeals, setSelectedMeals] = useState<
		Record<string, { Id: string; Price: number } | null>
	>({});
	const [selectedSeats, setSelectedSeats] = useState<
		Record<string, { SeatID: string; Price: number } | null>
	>({});

	// Get airline code from flight
	const airlineCode = flight?.AirlineCode || flight?.ValidatingAirlineCode || "";
	const isSSRSupported = SSR_SUPPORTED_AIRLINES.includes(airlineCode);

	// Fetch seat map - use placeholder names if passengers don't have names yet
	// This allows users to see seat map before filling passenger details
	// Only fetch if airline supports SSR
	useEffect(() => {
		// Don't fetch seat map for unsupported airlines
		if (!isSSRSupported) {
			return;
		}

		const fetchSeatMap = async () => {
			// Create passenger list with actual names or placeholder names
			const passengersForSeatMap = passengers.length > 0
				? passengers.map((p, index) => ({
						...p,
						FirstName: p.FirstName?.trim() || `PASSENGER${index + 1}`,
						LastName: p.LastName?.trim() || "TEST",
						Title: p.Title || "Mr",
						PaxType: p.PaxType || (index < adultCount ? 1 : index < adultCount + childCount ? 2 : 3),
				  }))
				: // If no passengers yet, create placeholder passengers based on counts
				  [
						...Array(adultCount).fill(null).map((_, i) => ({
							Title: "Mr",
							FirstName: `PASSENGER${i + 1}`,
							LastName: "TEST",
							PaxType: 1,
						})),
						...Array(childCount).fill(null).map((_, i) => ({
							Title: "Mstr",
							FirstName: `CHILD${i + 1}`,
							LastName: "TEST",
							PaxType: 2,
						})),
						...Array(infantCount).fill(null).map((_, i) => ({
							Title: "Mstr",
							FirstName: `INFANT${i + 1}`,
							LastName: "TEST",
							PaxType: 3,
						})),
				  ];

			if (passengersForSeatMap.length === 0) {
				console.log("AiriqSSRSelection: No passengers to fetch seat map for");
				return;
			}

			try {
				setLoading(true);
				console.log("AiriqSSRSelection: Fetching seat map with", passengersForSeatMap.length, "passengers");
				const response = await fetch("/api/travel/airiq/seat-map", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						traceId,
						resultIndex,
						flight,
						passengers: passengersForSeatMap,
						adultCount,
						childCount,
						infantCount,
						pricingData, // Pass pricing data so seat map can use FlightDetails from pricing
					}),
				});

				if (response.ok) {
					const data = await response.json();
					console.log("AiriqSSRSelection: Seat map response:", data);
					
					// Check if seat map is actually available
					if (data.FlightSeat && data.FlightSeat.length > 0) {
						setSeatMapData(data.FlightSeat);
					} else {
						// Check if it's an IP validation error
						if (data.message && data.message.includes("IP address")) {
							console.warn("AiriqSSRSelection: Seat map unavailable due to IP validation");
						} else {
							console.log("AiriqSSRSelection: Seat map not available for this flight");
						}
						setSeatMapData(null);
					}
				} else {
					const errorData = await response.json().catch(() => ({}));
					console.warn(
						"AiriqSSRSelection: Failed to fetch seat map:",
						errorData.error || errorData.message || errorData.code || "Unknown error",
						"Status:",
						response.status
					);
					// Don't show error to user, seat map is optional
					setSeatMapData(null);
				}
			} catch (error) {
				console.error("AiriqSSRSelection: Error fetching seat map:", error);
				// Don't show error to user, seat map is optional
				setSeatMapData(null);
			} finally {
				setLoading(false);
			}
		};

		fetchSeatMap();
	}, [traceId, resultIndex, flight, passengers, adultCount, childCount, infantCount, pricingData, isSSRSupported]);

	// Update parent when selections change
	useEffect(() => {
		onSSRChange({
			baggage: selectedBaggage,
			meals: selectedMeals,
			seats: selectedSeats,
		});
	}, [selectedBaggage, selectedMeals, selectedSeats, onSSRChange]);

	// Get SSR data from pricing response
	const ssrData = pricingData?.PriceItenaryInfo?.SSR;
	const baggageOptions = ssrData?.Baggage || [];
	const mealOptions = ssrData?.Meal || [];

	// Debug logging (only log once to avoid spam)
	useEffect(() => {
		if (pricingData) {
			console.log("AiriqSSRSelection - Pricing Data:", {
				hasPricingData: !!pricingData,
				hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
				hasSSR: !!ssrData,
				baggageCount: baggageOptions.length,
				mealCount: mealOptions.length,
				ssrData: ssrData,
				fullPriceItenaryInfo: pricingData?.PriceItenaryInfo,
				// Log the entire pricing response structure to debug
				pricingResponseKeys: pricingData ? Object.keys(pricingData) : [],
				priceItenaryInfoKeys: pricingData?.PriceItenaryInfo ? Object.keys(pricingData.PriceItenaryInfo) : [],
			});
		}
	}, [pricingData]);

	const hasBaggage = isSSRSupported && baggageOptions.length > 0;
	const hasMeals = isSSRSupported && mealOptions.length > 0;
	const hasSeats = isSSRSupported && seatMapData && seatMapData.length > 0;

	// If airline doesn't support SSR, show message
	if (!isSSRSupported) {
		return (
			<div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						<svg
							className="h-5 w-5 text-blue-600 mt-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div className="flex-1">
						<h3 className="text-sm font-semibold text-blue-900 mb-1">
							Add-on Services Not Available
						</h3>
						<p className="text-sm text-blue-700">
							SSR (Special Service Requests) for {airlineCode} flights are not
							available during booking. You can add baggage, meals, and select
							seats during airline web check-in.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const handleBaggageSelect = (
		pIndex: number,
		sIndex: number,
		option: { Id: string; Price: number } | null
	) => {
		setSelectedBaggage((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: option,
		}));
	};

	const handleMealSelect = (
		pIndex: number,
		sIndex: number,
		option: { Id: string; Price: number } | null
	) => {
		setSelectedMeals((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: option,
		}));
	};

	const handleSeatSelect = (
		pIndex: number,
		sIndex: number,
		seat: { SeatID: string; Price: number } | null
	) => {
		setSelectedSeats((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: seat,
		}));
	};

	if (!hasBaggage && !hasMeals && !hasSeats) {
		return (
			<div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
				<p>No add-on services available for this flight.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Accordion type="multiple" className="w-full space-y-4" defaultValue={[]}>
				{/* Baggage Card */}
				{hasBaggage && (
					<AccordionItem
						value="baggage"
						className="border rounded-lg px-4 bg-white shadow-sm"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-blue-100 p-2 rounded-full">
									<Briefcase className="h-5 w-5 text-blue-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Baggage{" "}
										<span className="text-muted-foreground font-normal">
											(Optional)
										</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedBaggage).filter(Boolean).length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedBaggage).filter(Boolean).length}{" "}
												baggage selected (₹
												{Object.values(selectedBaggage)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Add extra baggage if needed"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-6">
							<div className="space-y-4">
								{baggageOptions.map((baggage: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors"
									>
										<div>
											<p className="font-medium">{baggage.Description}</p>
											<p className="text-sm text-gray-500">
												{baggage.Weight} kg • {baggage.Origin} → {baggage.Destination}
											</p>
										</div>
										<div className="flex items-center gap-4">
											<span className="font-semibold">
												₹{parseFloat(baggage.Price || "0").toLocaleString()}
											</span>
											<button
												onClick={() => {
													// For now, select for first passenger, first segment
													handleBaggageSelect(0, 0, {
														Id: baggage.Code || String(index),
														Price: parseFloat(baggage.Price || "0"),
													});
												}}
												className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
											>
												Select
											</button>
										</div>
									</div>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Meals Card */}
				{hasMeals && (
					<AccordionItem
						value="meals"
						className="border rounded-lg px-4 bg-white shadow-sm"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-orange-100 p-2 rounded-full">
									<Utensils className="h-5 w-5 text-orange-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Meals{" "}
										<span className="text-muted-foreground font-normal">
											(Optional)
										</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedMeals).filter(Boolean).length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedMeals).filter(Boolean).length}{" "}
												meals selected (₹
												{Object.values(selectedMeals)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Pre-book your meals"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-6">
							<div className="space-y-4">
								{mealOptions.map((meal: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg hover:border-orange-300 transition-colors"
									>
										<div>
											<p className="font-medium">{meal.Description}</p>
											<p className="text-sm text-gray-500">
												{meal.Origin} → {meal.Destination}
											</p>
										</div>
										<div className="flex items-center gap-4">
											<span className="font-semibold">
												₹{parseFloat(meal.Price || "0").toLocaleString()}
											</span>
											<button
												onClick={() => {
													// For now, select for first passenger, first segment
													handleMealSelect(0, 0, {
														Id: meal.Code || String(index),
														Price: parseFloat(meal.Price || "0"),
													});
												}}
												className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
											>
												Select
											</button>
										</div>
									</div>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Seats Card */}
				{hasSeats && (
					<AccordionItem
						value="seats"
						className="border rounded-lg px-4 bg-white shadow-sm"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-purple-100 p-2 rounded-full">
									<Armchair className="h-5 w-5 text-purple-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Seats{" "}
										<span className="text-muted-foreground font-normal">
											(Optional)
										</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedSeats).filter(Boolean).length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedSeats).filter(Boolean).length}{" "}
												seats selected (₹
												{Object.values(selectedSeats)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Choose your preferred seats"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							{loading ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
								</div>
							) : (
								<AiriqSeatSelection
									seatMapData={seatMapData}
									passengers={passengers}
									adultCount={adultCount}
									childCount={childCount}
									infantCount={infantCount}
									selectedSeats={selectedSeats}
									onSelect={handleSeatSelect}
								/>
							)}
						</AccordionContent>
					</AccordionItem>
				)}
			</Accordion>
		</div>
	);
}
