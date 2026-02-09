"use client";

import { useState, useEffect } from "react";
import type { PassengerDetail } from "@/types/tbo";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Briefcase, Utensils, Armchair, Star } from "lucide-react";
import BaggageSelection, { BaggageOption } from "./BaggageSelection";
import MealSelection, { MealOption } from "./MealSelection";
import SeatSelection, { SeatOption } from "./SeatSelection";
import SpecialServiceSelection, {
	SpecialServiceOption,
} from "./SpecialServiceSelection";
import { SSRResponse } from "@/types/tbo";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface SSRSelectionProps {
	traceId: string;
	resultIndex: string;
	passengers: PassengerDetail[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	onSSRChange: (ssrs: {
		baggage: Record<string, BaggageOption | null>;
		meals: Record<string, MealOption | null>;
		seats: Record<string, SeatOption | null>;
		specialServices: Record<string, SpecialServiceOption[]>;
	}) => void;
}

export default function SSRSelection({
	traceId,
	resultIndex,
	passengers,
	adultCount,
	childCount,
	infantCount,
	onSSRChange,
}: SSRSelectionProps) {
	const [loading, setLoading] = useState(true);
	const [ssrData, setSsrData] = useState<SSRResponse["Response"] | null>(null);
	const [selectedBaggage, setSelectedBaggage] = useState<
		Record<string, BaggageOption | null>
	>({});
	const [selectedMeals, setSelectedMeals] = useState<
		Record<string, MealOption | null>
	>({});
	const [selectedSeats, setSelectedSeats] = useState<
		Record<string, SeatOption | null>
	>({});
	const [selectedServices, setSelectedServices] = useState<
		Record<string, SpecialServiceOption[]>
	>({});

	useEffect(() => {
		const fetchSSR = async () => {
			try {
				setLoading(true);
				console.log("SSRSelection: Fetching SSR data with:", {
					traceId,
					resultIndex,
				});

				// Call our API route instead of directly calling TBO
				const response = await fetch("/api/travel/ssr", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						TraceId: traceId,
						ResultIndex: resultIndex,
						EndUserIp: "192.168.1.1",
					}),
				});

				if (!response.ok) {
					// Handle HTTP errors
					if (response.status === 400) {
						throw new Error(
							"Invalid request parameters for additional services",
						);
					} else if (response.status === 404) {
						throw new Error("Flight not found for additional services");
					} else if (response.status === 429) {
						throw new Error(
							"Too many requests. Please wait a moment before selecting services.",
						);
					} else if (response.status >= 500) {
						throw new Error(
							"Server error loading additional services. Please try again later.",
						);
					} else {
						throw new Error(
							`Failed to load additional services (Error ${response.status})`,
						);
					}
				}

				const data = await response.json();
				console.log("SSRSelection: SSR API response:", data);

				if (data.Response) {
					setSsrData(data.Response);
					console.log("SSRSelection: SSR data set successfully");
				} else {
					console.log("SSRSelection: No Response in API response");
					toast.info("No additional services available for this flight");
				}
			} catch (error) {
				console.error("SSRSelection: Failed to fetch SSRs:", error);
				// Silently handle SSR errors - don't show toast messages to users
				// This is especially common for multi-city flights where SSR may not be available
			} finally {
				setLoading(false);
			}
		};

		if (traceId && resultIndex) {
			console.log("SSRSelection: Starting SSR fetch");
			fetchSSR();
		} else {
			console.log("SSRSelection: Missing traceId or resultIndex:", {
				traceId,
				resultIndex,
			});
		}
	}, [traceId, resultIndex]);

	// Update parent when selections change
	useEffect(() => {
		onSSRChange({
			baggage: selectedBaggage,
			meals: selectedMeals,
			seats: selectedSeats,
			specialServices: selectedServices,
		});
	}, [
		selectedBaggage,
		selectedMeals,
		selectedSeats,
		selectedServices,
		onSSRChange,
	]);

	const handleBaggageSelect = (
		pIndex: number,
		sIndex: number,
		option: BaggageOption | null,
	) => {
		setSelectedBaggage((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: option,
		}));
	};

	const handleMealSelect = (
		pIndex: number,
		sIndex: number,
		option: MealOption | null,
	) => {
		setSelectedMeals((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: option,
		}));
	};

	const handleSeatSelect = (
		pIndex: number,
		sIndex: number,
		option: SeatOption | null,
	) => {
		setSelectedSeats((prev) => ({
			...prev,
			[`${pIndex}-${sIndex}`]: option,
		}));
	};

	const handleServiceSelect = (
		pIndex: number,
		sIndex: number,
		option: SpecialServiceOption,
		isChecked: boolean,
	) => {
		setSelectedServices((prev) => {
			const key = `${pIndex}-${sIndex}`;
			const currentServices = prev[key] || [];

			if (isChecked) {
				return { ...prev, [key]: [...currentServices, option] };
			} else {
				return {
					...prev,
					[key]: currentServices.filter((s) => s.Code !== option.Code),
				};
			}
		});
	};

	if (loading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!ssrData) {
		console.log("SSRSelection: No SSR data available");
		return (
			<div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
				<p>No add-on services available for this flight.</p>
			</div>
		);
	}

	console.log("SSRSelection: SSR data received:", ssrData);

	// Flatten the nested arrays from TBO API
	// Baggage comes as [[bag1, bag2, ...]] - keep 2D structure for component
	const baggageData = ssrData.Baggage || [];

	// MealDynamic comes as [[meal1, meal2, ...]] - keep 2D structure for component
	const mealData = ssrData.MealDynamic || [];

	// SeatDynamic comes as [{SegmentSeat: [{RowSeats: [...]}]}]
	const seatData = ssrData.SeatDynamic || [];

	// SpecialServices comes as [{SegmentSpecialService: [{SSRService: [...]}]}]
	const specialServicesData = ssrData.SpecialServices || [];

	const hasBaggage = baggageData.length > 0;
	const hasMeals = mealData.length > 0;
	const hasSeats = seatData.length > 0;
	const hasServices = specialServicesData.length > 0;

	console.log("SSRSelection availability:", {
		hasBaggage,
		hasMeals,
		hasSeats,
		hasServices,
		passengers: passengers.length,
		baggageCount: baggageData.length,
		mealCount: mealData.length,
		seatCount: seatData.length,
		servicesCount: specialServicesData.length,
	});

	// If no SSR options available, show message
	if (!hasBaggage && !hasMeals && !hasSeats && !hasServices) {
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
										{Object.values(selectedBaggage).filter(Boolean).length >
										0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedBaggage).reduce(
													(acc, curr) => acc + (curr?.Weight || 0),
													0,
												)}
												kg added (₹
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
							<BaggageSelection
								baggageData={baggageData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedBaggage={selectedBaggage}
								onSelect={handleBaggageSelect}
							/>
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
							<MealSelection
								mealData={mealData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedMeals={selectedMeals}
								onSelect={handleMealSelect}
							/>
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
							<SeatSelection
								seatData={seatData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedSeats={selectedSeats}
								onSelect={handleSeatSelect}
							/>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Special Services Card */}
				{hasServices && (
					<AccordionItem
						value="services"
						className="border rounded-lg px-4 bg-white shadow-sm"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-yellow-100 p-2 rounded-full">
									<Star className="h-5 w-5 text-yellow-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Priority Services{" "}
										<span className="text-muted-foreground font-normal">
											(Optional)
										</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedServices).flat().length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedServices).flat().length} services
												selected (₹
												{Object.values(selectedServices)
													.flat()
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Wheelchair, Priority Check-in, etc."
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							<SpecialServiceSelection
								serviceData={specialServicesData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedServices={selectedServices}
								onSelect={handleServiceSelect}
							/>
						</AccordionContent>
					</AccordionItem>
				)}
			</Accordion>
		</div>
	);
}
