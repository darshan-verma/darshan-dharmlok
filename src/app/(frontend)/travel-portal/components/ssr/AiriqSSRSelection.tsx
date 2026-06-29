"use client";

import { useState, useEffect } from "react";
import type { PassengerDetail, FlightResult } from "@/types/tbo";
import type { AiriqPricingResponse, AiriqSeatMapResponse } from "@/types/airiq";
import { resolveAiriqTripBookContext } from "@/lib/airiqTripContext";

// Type aliases for pricing response items (removed - using inline types instead)
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Briefcase, Utensils, Armchair, Sparkles, Info } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import AiriqSeatSelection from "./AiriqSeatSelection";

interface AiriqSSRSelectionProps {
	traceId: string;
	resultIndex: string;
	flight: FlightResult;
	returnFlight?: FlightResult | null;
	passengers: PassengerDetail[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	pricingData: AiriqPricingResponse | null;
	onSSRChange: (ssrs: {
		baggage: Record<string, { Id: string; Price: number } | null>;
		meals: Record<string, { Id: string; Price: number } | null>;
		seats: Record<string, { SeatID: string; Price: number } | null>;
		otherServices?: Record<string, { Id: string; Price: number } | null>;
	}) => void;
}

// Airlines that support SSR in AIRiQ
const SSR_SUPPORTED_AIRLINES = ["AI", "UK"]; // AI = Air India, UK = Vistara

export default function AiriqSSRSelection({
	traceId,
	resultIndex,
	flight,
	returnFlight,
	passengers,
	adultCount,
	childCount,
	infantCount,
	pricingData,
	onSSRChange,
}: AiriqSSRSelectionProps) {
	const [loading, setLoading] = useState(false);
	const [seatMapData, setSeatMapData] = useState<AiriqSeatMapResponse['FlightSeat'] | null>(null);
	const [loadingServices, setLoadingServices] = useState<boolean>(true);
	const [selectedBaggage, setSelectedBaggage] = useState<
		Record<string, { Id: string; Price: number } | null>
	>({});
	const [selectedMeals, setSelectedMeals] = useState<
		Record<string, { Id: string; Price: number } | null>
	>({});
	const [selectedServices, setSelectedServices] = useState<
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
	// Fetch if airline supports SSR OR if seat map is available from search
	useEffect(() => {
		// Check if seat map is available from flight search
		const hasSeatMapAvailable = (flight as FlightResult & { _airiqSeatMapAvailable?: boolean })?._airiqSeatMapAvailable === true;
		
		// Allow seat map fetch if SSR is supported OR seat map is available
		// (Seat map API can work independently of SSR support)
		if (!isSSRSupported && !hasSeatMapAvailable) {
			console.log("🚫 AiriqSSRSelection: Skipping seat map fetch - airline not supported and no seat map available:", airlineCode);
			return;
		}

		// CRITICAL: Seat map API requires pricing data with FlightDetails
		// According to AIRiQ docs, FlightID must come from Pricing response
		// PriceItenaryInfo is an array - access first element
		const priceInfoArray = pricingData?.PriceItenaryInfo;
		const priceInfo = priceInfoArray && Array.isArray(priceInfoArray) && priceInfoArray.length > 0
			? priceInfoArray[0]
			: null;
		const hasValidPricingData = priceInfo ? (
			(priceInfo.FlightDetails && Array.isArray(priceInfo.FlightDetails) && priceInfo.FlightDetails.length > 0) ||
			(priceInfo.AvailabilityResponse && Array.isArray(priceInfo.AvailabilityResponse) && priceInfo.AvailabilityResponse.length > 0 &&
				priceInfo.AvailabilityResponse[0]?.Flights && Array.isArray(priceInfo.AvailabilityResponse[0].Flights) && priceInfo.AvailabilityResponse[0].Flights.length > 0)
		) : false;
		
		if (hasSeatMapAvailable && !hasValidPricingData) {
			console.warn("⚠️ AiriqSSRSelection: Seat map is available but pricing data is missing or invalid");
			console.warn("   Seat map requires pricing data with FlightDetails");
			console.warn("   Current pricingData:", {
				hasPricingData: !!pricingData,
				hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
				isArray: Array.isArray(pricingData?.PriceItenaryInfo),
				priceItenaryInfoLength: Array.isArray(pricingData?.PriceItenaryInfo) ? pricingData.PriceItenaryInfo.length : 0,
				hasFlightDetails: !!priceInfo?.FlightDetails,
				flightDetailsLength: priceInfo?.FlightDetails ? (Array.isArray(priceInfo.FlightDetails) ? priceInfo.FlightDetails.length : 0) : 0,
				pricingDataKeys: pricingData ? Object.keys(pricingData) : [],
			});
			console.warn("   Waiting for pricing data to be available...");
			return; // Don't fetch yet, wait for pricing data
		}

		console.log("🔍 AiriqSSRSelection: Starting seat map fetch check:", {
			airlineCode,
			isSSRSupported,
			hasSeatMapAvailable,
			hasPricingData: !!pricingData,
			hasValidPricingData,
			hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
			isArray: Array.isArray(pricingData?.PriceItenaryInfo),
			priceItenaryInfoLength: Array.isArray(pricingData?.PriceItenaryInfo) ? pricingData.PriceItenaryInfo.length : 0,
			hasFlightDetails: !!priceInfo?.FlightDetails,
			flightDetailsLength: priceInfo?.FlightDetails ? (Array.isArray(priceInfo.FlightDetails) ? priceInfo.FlightDetails.length : 0) : 0,
			passengerCount: passengers.length,
			adultCount,
			childCount,
			infantCount,
			willFetch: (isSSRSupported || hasSeatMapAvailable) && (isSSRSupported || hasValidPricingData),
		});

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
				console.log("🛫 AiriqSSRSelection: Fetching seat map with", passengersForSeatMap.length, "passengers");
				console.log("🛫 Seat map request params:", {
					traceId,
					resultIndex,
					airlineCode: flight?.AirlineCode || flight?.ValidatingAirlineCode,
					passengerCount: passengersForSeatMap.length,
					hasPricingData: !!pricingData,
					pricingDataType: typeof pricingData,
					pricingDataKeys: pricingData ? Object.keys(pricingData) : [],
					hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
					isArray: Array.isArray(pricingData?.PriceItenaryInfo),
					priceItenaryInfoLength: Array.isArray(pricingData?.PriceItenaryInfo) ? pricingData.PriceItenaryInfo.length : 0,
					hasFlightDetails: !!priceInfo?.FlightDetails,
					flightDetailsLength: priceInfo?.FlightDetails?.length || 0,
					flightHasSeatMapAvailable: hasSeatMapAvailable,
					passengerNames: passengersForSeatMap.map(p => `${p.FirstName} ${p.LastName}`),
					pricingDataPreview: pricingData ? {
						hasPriceItenaryInfo: !!pricingData.PriceItenaryInfo,
						isArray: Array.isArray(pricingData.PriceItenaryInfo),
						priceItenaryInfoKeys: priceInfo ? Object.keys(priceInfo) : [],
						flightDetailsCount: priceInfo?.FlightDetails?.length || 0,
					} : null,
				});
				const tripType = resolveAiriqTripBookContext({
					flight,
					returnFlight,
					searchJourneyType:
						typeof sessionStorage !== "undefined"
							? sessionStorage.getItem("lastFlightSearchJourneyType") ||
								undefined
							: undefined,
				}).tripType;
				const response = await fetch("/api/travel/airiq/seat-map", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						traceId,
						resultIndex,
						flight,
						returnFlight,
						passengers: passengersForSeatMap,
						adultCount,
						childCount,
						infantCount,
						pricingData,
						tripType,
						searchJourneyType:
							typeof sessionStorage !== "undefined"
								? sessionStorage.getItem("lastFlightSearchJourneyType") ||
									undefined
								: undefined,
					}),
				});

				console.log("🛫 Seat map API response status:", response.status, response.statusText);
				
				if (response.ok) {
					const data = await response.json();
					console.log("✅ AiriqSSRSelection: Seat map response received:", {
						hasFlightSeat: !!data.FlightSeat,
						flightSeatLength: data.FlightSeat?.length || 0,
						resultCode: data.ResponseStatus?.ResultCode,
						error: data.ResponseStatus?.Error,
						message: data.message,
						fullResponse: data,
					});
					
					// Check if seat map is actually available
					if (data.FlightSeat && data.FlightSeat.length > 0) {
						console.log("✅ Seat map data available! Setting seat map data:", {
							segmentCount: data.FlightSeat.length,
							firstSegment: data.FlightSeat[0],
						});
						setSeatMapData(data.FlightSeat);
					} else {
						// Check for specific error messages
						if (data.requiresPricing) {
							console.error("❌ AiriqSSRSelection: Seat map requires pricing data but pricing failed or timed out");
							console.error("   According to AIRiQ docs, FlightID must come from Pricing response");
							console.error("   Please ensure pricing API succeeds first");
						} else if (data.message && data.message.includes("IP address")) {
							console.warn("⚠️ AiriqSSRSelection: Seat map unavailable due to IP validation");
						} else if (data.ResponseStatus?.Error) {
							const errorMsg = data.ResponseStatus.Error;
							console.warn("⚠️ AiriqSSRSelection: Seat map API returned error:", {
								error: errorMsg,
								resultCode: data.ResponseStatus.ResultCode,
								message: data.message,
							});
							
							// Check if error is about FlightDetails (likely means pricing is needed)
							if (errorMsg.includes("Unable to retrieve the FlightDetails") || errorMsg.includes("FlightDetails")) {
								console.error("❌ This error typically means pricing data is required. FlightID must come from Pricing response.");
							}
						} else {
							console.log("ℹ️ AiriqSSRSelection: Seat map not available for this flight (empty response)");
						}
						setSeatMapData(null);
					}
				} else {
					const errorData = await response.json().catch(() => ({}));
					console.error("❌ AiriqSSRSelection: Failed to fetch seat map:", {
						status: response.status,
						statusText: response.statusText,
						error: errorData.error || errorData.message || errorData.code || "Unknown error",
						errorData,
					});
					// Don't show error to user, seat map is optional
					setSeatMapData(null);
				}
			} catch (error) {
				console.error("❌ AiriqSSRSelection: Error fetching seat map:", error);
				if (error instanceof Error) {
					console.error("Error details:", {
						message: error.message,
						stack: error.stack,
					});
				}
				// Don't show error to user, seat map is optional
				setSeatMapData(null);
			} finally {
				setLoading(false);
				console.log("🏁 AiriqSSRSelection: Seat map fetch completed, loading:", false);
			}
		};

		fetchSeatMap();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [traceId, resultIndex, flight, passengers, adultCount, childCount, infantCount, pricingData, isSSRSupported]);

	// Update parent when selections change
	useEffect(() => {
		onSSRChange({
			baggage: selectedBaggage,
			meals: selectedMeals,
			seats: selectedSeats,
			otherServices: selectedServices,
		});

		// Log seat/meal selections (non-blocking, debounced)
		const hasSelections = 
			Object.keys(selectedSeats).length > 0 ||
			Object.keys(selectedMeals).length > 0 ||
			Object.keys(selectedBaggage).length > 0;

		if (hasSelections) {
			// Debounce logging to avoid too many logs
			const timeoutId = setTimeout(() => {
				fetch("/api/travel/log-selection", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						logType: "flight",
						action: "selection",
						provider: "AIRiQ",
						flightData: {
							seats: selectedSeats,
							meals: selectedMeals,
							baggage: selectedBaggage,
							airline: flight?.AirlineCode || flight?.ValidatingAirlineCode,
							flightNumber: (flight?.Segments?.[0]?.[0] as { FlightNumber?: string })?.FlightNumber,
						},
						traceId,
						resultIndex,
					}),
				}).catch(() => {}); // Silently fail
			}, 1000); // 1 second debounce

			return () => clearTimeout(timeoutId);
		}
	}, [selectedBaggage, selectedMeals, selectedSeats, selectedServices, onSSRChange, traceId, resultIndex, flight]);

	// Get SSR data from pricing response
	// PriceItenaryInfo is an array - access first element
	const priceInfoArrayForSSR = pricingData?.PriceItenaryInfo;
	const priceInfoForSSR = priceInfoArrayForSSR && Array.isArray(priceInfoArrayForSSR) && priceInfoArrayForSSR.length > 0
		? priceInfoArrayForSSR[0]
		: null;
	
	// Extract services from AvailabilityResponse[0] as per AIRiQ API structure
	const availResponse = priceInfoForSSR?.AvailabilityResponse?.[0];
	const mealOptions = availResponse?.Meal || [];
	const baggageOptions = availResponse?.Bagg || []; // Note: AIRiQ uses "Bagg" not "Baggage"
	const otherServiceOptions = availResponse?.OtherService || [];
	
	// Also check transformed SSR structure for backward compatibility
	const ssrData = priceInfoForSSR ? priceInfoForSSR.SSR : undefined;
	const transformedBaggage = ssrData?.Baggage || [];
	const transformedMeals = ssrData?.Meal || [];
	
	// Use AvailabilityResponse data if available, otherwise fallback to transformed SSR
	const finalBaggageOptions = baggageOptions.length > 0 ? baggageOptions : transformedBaggage;
	const finalMealOptions = mealOptions.length > 0 ? mealOptions : transformedMeals;
	
	// Debug: Log service extraction
	if (pricingData) {
		console.log("🔍 AiriqSSRSelection: Service extraction:", {
			hasPriceInfo: !!priceInfoForSSR,
			hasAvailabilityResponse: !!availResponse,
			hasMealArray: !!availResponse?.Meal,
			hasBaggArray: !!availResponse?.Bagg,
			hasOtherServiceArray: !!availResponse?.OtherService,
			mealCount: mealOptions.length,
			baggageCount: baggageOptions.length,
			otherServiceCount: otherServiceOptions.length,
			finalMealCount: finalMealOptions.length,
			finalBaggageCount: finalBaggageOptions.length,
			availResponseKeys: availResponse ? Object.keys(availResponse) : [],
		});
	}

	// Update loading state when pricing data is available or after timeout
	useEffect(() => {
		// Set loading to false once we have pricing data (services are in pricing response)
		if (pricingData) {
			setLoadingServices(false);
			console.log("AiriqSSRSelection - Services loaded:", {
				hasPricingData: !!pricingData,
				hasAvailabilityResponse: !!availResponse,
				baggageCount: finalBaggageOptions.length,
				mealCount: finalMealOptions.length,
				otherServiceCount: otherServiceOptions.length,
				hasSeatMap: !!seatMapData,
				loadingSeatMap: loading,
			});
		}
	}, [pricingData, availResponse, finalBaggageOptions.length, finalMealOptions.length, otherServiceOptions.length, seatMapData, loading]);

	// Show services if they exist in pricing response, regardless of isSSRSupported flag
	// Pricing API always returns available services (Meal, Bagg, OtherService) if they exist
	const hasBaggage = finalBaggageOptions.length > 0;
	const hasMeals = finalMealOptions.length > 0;
	const hasOtherServices = otherServiceOptions.length > 0;
	const hasSeatMapAvailable = (flight as FlightResult & { _airiqSeatMapAvailable?: boolean })?._airiqSeatMapAvailable === true;
	// Allow seats if SSR is supported OR if seat map is available (even without SSR)
	const hasSeats = (isSSRSupported || hasSeatMapAvailable) && seatMapData && seatMapData.length > 0;
	
	// Check if we have any services from pricing response
	const hasServicesFromPricing = hasBaggage || hasMeals || hasOtherServices;
	
	console.log("🔍 AiriqSSRSelection: Rendering check:", {
		isSSRSupported,
		hasBaggage,
		hasMeals,
		hasOtherServices,
		hasServicesFromPricing,
		hasSeats,
		hasSeatMapAvailable,
		seatMapDataLength: seatMapData?.length || 0,
		loading,
		loadingServices,
		pricingDataExists: !!pricingData,
		airlineCode,
		baggageCount: finalBaggageOptions.length,
		mealCount: finalMealOptions.length,
		otherServiceCount: otherServiceOptions.length,
	});

	// Show loader if services are being fetched (waiting for pricing data)
	if (loadingServices || (pricingData === null && (isSSRSupported || hasSeatMapAvailable))) {
		return (
			<div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
				<p className="text-gray-600 font-medium">Fetching services for you...</p>
				<p className="text-sm text-gray-500 mt-2">Please wait while we load available options</p>
			</div>
		);
	}

	// Only show "not available" message if:
	// - No services in pricing response AND
	// - Airline doesn't support SSR AND
	// - No seat map available
	// If we have services from pricing, show them regardless of SSR support status
	if (!hasServicesFromPricing && !isSSRSupported && !hasSeatMapAvailable) {
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
							No additional services are available for this flight. You can add baggage, meals, and select
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

	const handleServiceSelect = (
		pIndex: number,
		sIndex: number,
		option: { Id: string; Price: number } | null
	) => {
		setSelectedServices((prev) => ({
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

	if (!hasBaggage && !hasMeals && !hasOtherServices && !hasSeats && !loadingServices) {
		// Show helpful message if seat map was expected but not available
		if (isSSRSupported && hasSeatMapAvailable && !seatMapData) {
			return (
				<div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0">
							<svg
								className="h-5 w-5 text-yellow-600 mt-0.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<h3 className="text-sm font-semibold text-yellow-900 mb-1">
								Seat Map Loading
							</h3>
							<p className="text-sm text-yellow-700">
								{loading
									? "Loading seat map data... Please wait."
									: "Seat map was expected for this flight but is not currently available. This may be due to API limitations or flight availability."}
							</p>
							{!loading && (
								<p className="text-xs text-yellow-600 mt-2">
									Check the browser console for more details.
								</p>
							)}
						</div>
					</div>
				</div>
			);
		}
		
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
								{finalBaggageOptions.map((baggage, index: number) => {
									// AIRiQ structure: Bagg array has BaggageID, Code, Description, Amount
									// Transformed SSR structure has Id, Price
									const baggageId = (baggage as { BaggageID?: string; Id?: string }).BaggageID || (baggage as { BaggageID?: string; Id?: string }).Id || String(index);
									const price = parseFloat((baggage as { Amount?: string; Price?: number }).Amount || String((baggage as { Amount?: string; Price?: number }).Price || 0));
									const description = (baggage as { Description?: string }).Description || "";
									const origin = (baggage as { Origin?: string; Orgin?: string }).Origin || (baggage as { Origin?: string; Orgin?: string }).Orgin || "";
									const destination = (baggage as { Destination?: string }).Destination || "";
									const isSelected = selectedBaggage["0-0"]?.Id === baggageId;
									
									return (
										<div
											key={baggageId}
											className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
												isSelected
													? "border-blue-600 bg-blue-50"
													: "border-gray-200 hover:border-blue-300"
											}`}
										>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium">{description}</p>
													{(baggage as { BaggageText?: string }).BaggageText && (
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	type="button"
																	className="text-blue-600 hover:text-blue-800 focus:outline-none"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Info className="h-4 w-4" />
																</button>
															</TooltipTrigger>
															<TooltipContent
																className="max-w-md bg-gray-900 text-white p-3 text-xs whitespace-pre-wrap"
																side="right"
															>
																<div className="font-semibold mb-2">Terms & Conditions:</div>
																<div className="whitespace-pre-wrap">
																	{(baggage as { BaggageText?: string }).BaggageText}
																</div>
															</TooltipContent>
														</Tooltip>
													)}
												</div>
												<p className="text-sm text-gray-500">
													{origin} → {destination}
												</p>
											</div>
											<div className="flex items-center gap-4">
												<span className="font-semibold">
													₹{price.toLocaleString()}
												</span>
												<button
													onClick={() => {
														const newSelection = isSelected ? null : {
															Id: baggageId,
															Price: price,
														};
														handleBaggageSelect(0, 0, newSelection);
													}}
													className={`px-4 py-2 rounded-lg transition-colors ${
														isSelected
															? "bg-red-600 text-white hover:bg-red-700"
															: "bg-blue-600 text-white hover:bg-blue-700"
													}`}
												>
													{isSelected ? "Remove" : "Select"}
												</button>
											</div>
										</div>
									);
								})}
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
								{finalMealOptions.map((meal, index: number) => {
									// AIRiQ structure: Meal array has MealID, Code, Description, Amount
									// Transformed SSR structure has Id, Price
									const mealId = (meal as { MealID?: string; Id?: string }).MealID || (meal as { MealID?: string; Id?: string }).Id || String(index);
									const price = parseFloat((meal as { Amount?: string; Price?: number }).Amount || String((meal as { Amount?: string; Price?: number }).Price || 0));
									const description = (meal as { Description?: string }).Description || "";
									const origin = (meal as { Origin?: string; Orgin?: string }).Origin || (meal as { Origin?: string; Orgin?: string }).Orgin || "";
									const destination = (meal as { Destination?: string }).Destination || "";
									const isSelected = selectedMeals["0-0"]?.Id === mealId;
									
									return (
										<div
											key={mealId}
											className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
												isSelected
													? "border-orange-600 bg-orange-50"
													: "border-gray-200 hover:border-orange-300"
											}`}
										>
											<div className="flex-1">
												<p className="font-medium">{description}</p>
												<p className="text-sm text-gray-500">
													{origin} → {destination}
												</p>
												{meal.Code && (
													<p className="text-xs text-gray-400 mt-1">
														Code: {meal.Code.split('|')[0]}
													</p>
												)}
											</div>
											<div className="flex items-center gap-4">
												<span className="font-semibold">
													₹{price.toLocaleString()}
												</span>
												<button
													onClick={() => {
														const newSelection = isSelected ? null : {
															Id: mealId,
															Price: price,
														};
														handleMealSelect(0, 0, newSelection);
													}}
													className={`px-4 py-2 rounded-lg transition-colors ${
														isSelected
															? "bg-red-600 text-white hover:bg-red-700"
															: "bg-orange-600 text-white hover:bg-orange-700"
													}`}
												>
													{isSelected ? "Remove" : "Select"}
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Other Services Card */}
				{hasOtherServices && (
					<AccordionItem
						value="other-services"
						className="border rounded-lg px-4 bg-white shadow-sm"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-green-100 p-2 rounded-full">
									<Sparkles className="h-5 w-5 text-green-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Other Services{" "}
										<span className="text-muted-foreground font-normal">
											(Optional)
										</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedServices).filter(Boolean).length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedServices).filter(Boolean).length}{" "}
												services selected (₹
												{Object.values(selectedServices)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Add special services"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-6">
							<div className="space-y-4">
								{otherServiceOptions.map((service, index: number) => {
									// AIRiQ structure: OtherService array has OtherID, SSRCode, Description, Amount
									// Use OtherID first, then SSRCode as fallback, then index
									const serviceId = service.OtherID || service.SSRCode || `service-${index}`;
									const price = parseFloat(service.Amount || "0");
									const description = service.Description || "";
									const origin = service.Origin || "";
									const destination = service.Destination || "";
									const serviceType = service.SSRType || "";
									// Check if this service is selected - compare by ID
									const isSelected = selectedServices["0-0"]?.Id === serviceId;
									
									return (
										<div
											key={serviceId}
											className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
												isSelected
													? "border-green-600 bg-green-50"
													: "border-gray-200 hover:border-green-300"
											}`}
										>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium">{description}</p>
													{service.OtherSSRtext && (
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	type="button"
																	className="text-green-600 hover:text-green-800 focus:outline-none"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Info className="h-4 w-4" />
																</button>
															</TooltipTrigger>
															<TooltipContent
																className="max-w-md bg-gray-900 text-white p-3 text-xs whitespace-pre-wrap"
																side="right"
															>
																<div className="font-semibold mb-2">Details:</div>
																<div className="whitespace-pre-wrap">
																	{service.OtherSSRtext}
																</div>
															</TooltipContent>
														</Tooltip>
													)}
												</div>
												{serviceType && (
													<p className="text-sm text-gray-500">
														{serviceType} • {origin} → {destination}
													</p>
												)}
											</div>
											<div className="flex items-center gap-4">
												<span className="font-semibold">
													₹{price.toLocaleString()}
												</span>
												<button
													onClick={() => {
														const newSelection = isSelected ? null : {
															Id: serviceId,
															Price: price,
														};
														handleServiceSelect(0, 0, newSelection);
													}}
													className={`px-4 py-2 rounded-lg transition-colors ${
														isSelected
															? "bg-red-600 text-white hover:bg-red-700"
															: "bg-green-600 text-white hover:bg-green-700"
													}`}
												>
													{isSelected ? "Remove" : "Select"}
												</button>
											</div>
										</div>
									);
								})}
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
								<div className="flex flex-col items-center justify-center p-8">
									<Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
									<p className="text-sm text-gray-600">Fetching services for you...</p>
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
