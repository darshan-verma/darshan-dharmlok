"use client";

import { useState, useEffect } from "react";
import PassengerDetails from "../components/PassengerDetails";
import FareBreakdown from "@/components/travel-portal/FareBreakdown";
import FlightDetails from "./components/FlightDetails";
import FareRulesView from "./components/FareRulesView";
import AiriqSSRSelection from "../components/ssr/AiriqSSRSelection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import type { PassengerDetail, FlightResult, FareRuleResponse } from "@/types/tbo";
import type { SpecialServiceOption } from "../components/ssr/SpecialServiceSelection";
import type { AiriqPricingResponse, AiriqGetMultiClassFareResponse } from "@/types/airiq";
import AiriqMultiClassCards from "../components/AiriqMultiClassCards";
import type { BaggageOption } from "../components/ssr/BaggageSelection";
import type { MealOption } from "../components/ssr/MealSelection";
import type { SeatOption } from "../components/ssr/SeatSelection";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";

interface AiriqBookingClientProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	traceId: string;
	resultIndex: string;
	isUpsellAllowed?: boolean;
}

export default function AiriqBookingClient({
	adultCount,
	childCount,
	infantCount,
	traceId,
	resultIndex,
}: // isUpsellAllowed reserved for future upsell functionality
AiriqBookingClientProps) {
	const [loading, setLoading] = useState(true);
	const [flightResult, setFlightResult] = useState<FlightResult | null>(null);
	const [fareRules, setFareRules] = useState<FareRuleResponse | null>(null);
	const [pricingData, setPricingData] = useState<AiriqPricingResponse | null>(null);
	const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
	const [selectedSSRs, setSelectedSSRs] = useState<{
		baggage: Record<string, { Id: string; Price: number } | null>;
		meals: Record<string, { Id: string; Price: number } | null>;
		seats: Record<string, { SeatID: string; Price: number } | null>;
		otherServices?: Record<string, { Id: string; Price: number } | null>;
	}>({
		baggage: {},
		meals: {},
		seats: {},
		otherServices: {},
	});

	// Post-booking ancillary flow: create booking (block PNR) → fetch ancillaries → add-ons UI → add or skip → payment
	const [postBookingCreated, setPostBookingCreated] = useState<{
		airIqPNR: string;
		airlinePNR: string;
		bookingTrackId: string;
	} | null>(null);
	const [ancillaryAvail, setAncillaryAvail] = useState<{
		trackId: string;
		ssrDetails: {
			Baggages?: Array<{ Id: string; Code?: string; Description?: string; Amount?: string; Origin?: string; Destination?: string }>;
			Meals?: Array<{ Id: string; Code?: string; Description?: string; Amount?: string; Origin?: string; Destination?: string }>;
			Seats?: Array<{ Id: string; SeatName?: string; SeatAmount?: string; SeatStatus?: boolean; Origin?: string; Destination?: string }>;
			OtherSSR?: Array<{ Id: string; Code?: string; Description?: string; Amount?: string }>;
		};
	} | null>(null);
	const [postBookingSelections, setPostBookingSelections] = useState<{
		baggages: string[];
		meals: string[];
		seats: string[];
		otherSSR: string[];
	}>({ baggages: [], meals: [], seats: [], otherSSR: [] });
	const [ancillarySubmitSuccess, setAncillarySubmitSuccess] = useState(false);
	const [createBookingLoading, setCreateBookingLoading] = useState(false);
	const [addAncillaryLoading, setAddAncillaryLoading] = useState(false);
	const [selectedMulticlassFare, setSelectedMulticlassFare] = useState<AiriqGetMultiClassFareResponse | null>(null);
	const [returnFlightResult, setReturnFlightResult] = useState<FlightResult | null>(null);

	// Load flight data from sessionStorage cache
	useEffect(() => {
		try {
			const stored = sessionStorage.getItem("flightSearchCache");
			if (!stored) {
				console.error("No flight search cache found");
				setLoading(false);
				return;
			}

			const cache = JSON.parse(stored);

			// Find the flight with matching resultIndex (cache structure changed - no traceId in cache entries)
			// Search through all cache entries to find the flight
			let foundFlight: FlightResult | null = null;
			for (const entry of Object.values(cache) as Array<{ results?: FlightResult[] }>) {
				if (entry.results && Array.isArray(entry.results)) {
					// Find flight by ResultIndex and ensure it's from AIRiQ
					const flight = entry.results.find(
						(f: FlightResult) => f.ResultIndex === resultIndex && f.ApiSource === "AIRiQ"
					);
					if (flight) {
						foundFlight = flight;
						break; // Found it, exit early
					}
				}
			}

			if (foundFlight) {
				setFlightResult(foundFlight);
				// Show UI immediately, fetch additional data in background
				setLoading(false);
				// Fetch pricing and fare rules in background (non-blocking)
				fetchAiriqBookingData(foundFlight);
			} else {
				console.error("Flight not found in cache");
				setLoading(false);
			}
		} catch (e) {
			console.error("Error loading flight data from cache:", e);
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [traceId, resultIndex]);

	const fetchAiriqBookingData = async (flight: FlightResult) => {
		try {
			// Check if this is a round-trip and fetch return flight
			let returnFlight = null;
			const returnResultIndex = flight.ReturnResultIndex;

			if (returnResultIndex) {
				// Get the flightSearchCache from sessionStorage
				const cacheData = sessionStorage.getItem("flightSearchCache");
				if (cacheData) {
					try {
						const cache = JSON.parse(cacheData);

						// Search through all cache entries to find the return flight (cache structure changed)
						for (const entry of Object.values(cache) as Array<{ results?: FlightResult[] }>) {
							if (entry.results && Array.isArray(entry.results)) {
								// Search for return flight by ResultIndex and ensure it's from AIRiQ
								const found = entry.results.find(
									(r: FlightResult) => r.ResultIndex === returnResultIndex && r.ApiSource === "AIRiQ"
								);
								if (found) {
									returnFlight = found;
									break; // Found it, exit early
								}
							}
						}
					} catch (e) {
						console.error("Error parsing flight search cache:", e);
					}
				}

				if (!returnFlight) {
					console.warn("⚠️ Return flight not found in cache for ResultIndex:", returnResultIndex);
				}
			}
			setReturnFlightResult(returnFlight);

			// Check if airline supports SSR before fetching pricing
			const airlineCode = flight?.AirlineCode || flight?.ValidatingAirlineCode || "";
			const ssrSupportedAirlines = ["AI", "UK"]; // AI = Air India, UK = Vistara
			const isSSRSupported = ssrSupportedAirlines.includes(airlineCode);
			const hasSeatMapAvailable = (flight as FlightResult & { _airiqSeatMapAvailable?: boolean })?._airiqSeatMapAvailable === true;
			
			console.log("🔍 AiriqBookingClient - Checking SSR support:", {
				airlineCode,
				isSSRSupported,
				hasSeatMapAvailable,
			});

			// Fetch pricing data if airline supports SSR, OR if seat map is available
			// (Seat map API might work independently of SSR support)
			if (isSSRSupported || hasSeatMapAvailable) {
				try {
					console.log(`📦 Fetching pricing data - SSR: ${isSSRSupported}, SeatMap: ${hasSeatMapAvailable}`);
					const pricingResponse = await fetch("/api/travel/airiq/pricing", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							traceId,
							resultIndex,
							flight,
							returnFlight,
							adultCount,
							childCount,
							infantCount,
						}),
					});

					if (pricingResponse.ok) {
						const pricingData = await pricingResponse.json();
						// PriceItenaryInfo is an array - access first element for SSR
						const priceInfo = pricingData?.PriceItenaryInfo && Array.isArray(pricingData.PriceItenaryInfo) && pricingData.PriceItenaryInfo.length > 0
							? pricingData.PriceItenaryInfo[0]
							: pricingData?.PriceItenaryInfo; // Fallback for transformed structure
						console.log("📦 AIRiQ Pricing Response:", {
							hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
							isArray: Array.isArray(pricingData?.PriceItenaryInfo),
							priceItenaryInfoLength: Array.isArray(pricingData?.PriceItenaryInfo) ? pricingData.PriceItenaryInfo.length : 0,
							hasSSR: !!priceInfo?.SSR,
							ssrBaggage: priceInfo?.SSR?.Baggage?.length || 0,
							ssrMeals: priceInfo?.SSR?.Meal?.length || 0,
							fullSSR: priceInfo?.SSR,
							trackId: priceInfo?.Trackid, // NEW TrackId from Pricing response
						});
						setPricingData(pricingData);
					}
				} catch (error) {
					console.error("❌ Pricing fetch failed:", error);
					if (hasSeatMapAvailable) {
						console.error("⚠️ Pricing failed but seat map is available");
						console.error("   According to AIRiQ docs, seat map REQUIRES pricing data with FlightDetails");
						console.error("   Seat map cannot work without successful pricing API call");
						console.error("   Error:", error instanceof Error ? error.message : error);
					}
					// Do NOT set empty pricing data - seat map requires real pricing data
					setPricingData(null);
				}
			} else {
				console.log(`⚠️ Airline ${airlineCode} does not support SSR and no seat map available - skipping pricing fetch`);
				setPricingData(null);
			}

			// Fetch fare rules
			try {
				const fareRulesResponse = await fetch("/api/travel/airiq/fare-rules", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						traceId,
						resultIndex,
						flight,
					}),
				});

				if (fareRulesResponse.ok) {
					const fareRulesData = await fareRulesResponse.json();
					setFareRules(fareRulesData);
				}
			} catch (error) {
				console.warn("⚠️ Fare rules fetch failed:", error);
				// Don't block UI if fare rules fail
			}
		} catch (error) {
			console.error("Error fetching AIRiQ booking data:", error);
			toast.error("Failed to load booking details");
			setLoading(false);
		}
	};

	const handleProceedToPayment = () => {
		if (!postBookingCreated) return;
		try {
			sessionStorage.setItem("airiqPostBookingContext", JSON.stringify({
				airIqPNR: postBookingCreated.airIqPNR,
				airlinePNR: postBookingCreated.airlinePNR,
				bookingTrackId: postBookingCreated.bookingTrackId,
				traceId,
				resultIndex,
			}));
		} catch (_) {}
		window.location.href = `/travel-portal/payment?traceId=${encodeURIComponent(traceId)}&resultIndex=${encodeURIComponent(resultIndex)}`;
	};

	const handleAddAncillaries = async () => {
		if (!postBookingCreated || !ancillaryAvail) return;
		setAddAncillaryLoading(true);
		try {
			const totalAmount = [
				...(ancillaryAvail.ssrDetails.Baggages || []).filter((b) => postBookingSelections.baggages.includes(b.Id)),
				...(ancillaryAvail.ssrDetails.Meals || []).filter((m) => postBookingSelections.meals.includes(m.Id)),
				...(ancillaryAvail.ssrDetails.Seats || []).filter((s) => postBookingSelections.seats.includes(s.Id)),
				...(ancillaryAvail.ssrDetails.OtherSSR || []).filter((o) => postBookingSelections.otherSSR.includes(o.Id)),
			].reduce((sum, item) => sum + parseFloat((item as { Amount?: string }).Amount || "0"), 0);
			const res = await fetch("/api/travel/airiq/ancillary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					airIqPNR: postBookingCreated.airIqPNR,
					airlinePNR: postBookingCreated.airlinePNR,
					ancillaryTrackId: ancillaryAvail.trackId,
					selections: {
						baggages: postBookingSelections.baggages.map((id) => ({ paxRefId: "1", baggId: id })),
						meals: postBookingSelections.meals.map((id) => ({ paxRefId: "1", segmentNo: "1", mealId: id })),
						seats: postBookingSelections.seats.map((id) => ({ paxRefId: "1", seatId: id })),
						otherSSR: postBookingSelections.otherSSR.map((id) => ({ otherSSRId: id, paxRefId: "1" })),
					},
					totalAmount: String(totalAmount.toFixed(2)),
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Add ancillaries failed");
			setAncillarySubmitSuccess(true);
			toast.success("Add-ons applied. Proceed to payment when ready.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to add ancillaries");
		} finally {
			setAddAncillaryLoading(false);
		}
	};

	const handleBookingSubmit = async (passengerData: PassengerDetail[]) => {
		try {
			if (postBookingCreated && ancillarySubmitSuccess) {
				handleProceedToPayment();
				return;
			}
			if (postBookingCreated) return; // add-ons phase; use Add ancillaries / Skip / Proceed to payment

			if (!passengerData || passengerData.length === 0) {
				toast.error("Please provide passenger details");
				return;
			}
			for (let i = 0; i < passengerData.length; i++) {
				const passenger = passengerData[i];
				if (!passenger.FirstName || !passenger.LastName) {
					toast.error(`Passenger ${i + 1}: First name and last name are required`);
					return;
				}
				if (!passenger.DateOfBirth) {
					toast.error(`Passenger ${i + 1}: Date of birth is required`);
					return;
				}
				if (!passenger.Gender) {
					toast.error(`Passenger ${i + 1}: Gender is required`);
					return;
				}
			}
			const effectivePricingData = selectedMulticlassFare
				? (() => {
						const mc = selectedMulticlassFare;
						if (!mc.Trackid || !mc.FlightDetails?.length || !mc.Fares?.[0]) {
							return null;
						}
						const grossAmount = (mc.Fares[0].Faredescription || []).reduce(
							(sum, p) => sum + Number(p.GrossAmount || 0),
							0
						);
						return {
							PriceItenaryInfo: [
								{
									Trackid: mc.Trackid,
									FlightDetails: mc.FlightDetails.map((fd) => ({
										FlightID: fd.FlightID,
										FlightNumber: fd.FlightNumber,
										Origin: fd.Origin,
										Destination: fd.Destination,
										DepartureDateTime: fd.DepartureDateTime,
										ArrivalDateTime: fd.ArrivalDateTime,
									})),
									GrossAmount: grossAmount,
								},
							],
							ResponseStatus: mc.Status,
						} as AiriqPricingResponse;
				  })()
				: pricingData;
			if (!effectivePricingData) {
				toast.error("Pricing data is not available. Please refresh and try again.");
				return;
			}
			if (flightResult) {
				await captureAndSendSnapshot(
					{
						flightResult,
						passengers: passengerData.map((p) => ({
							title: p.Title,
							firstName: p.FirstName,
							lastName: p.LastName,
							dateOfBirth: p.DateOfBirth,
							gender: p.Gender,
						})),
						ssrSelections: selectedSSRs,
						adultCount,
						childCount,
						infantCount,
						totalFare: flightResult.Fare?.OfferedFare,
						totalTax: flightResult.Fare?.Tax,
						traceId,
						resultIndex,
					},
					{
						page: "payment",
						user: {},
						booking: { type: "flight", traceId, resultIndex },
					}
				).catch(() => {});
			}
			const leadPax = passengerData.find((p) => p.IsLeadPax) || passengerData[0];
			const contactInfo = {
				countryCode: leadPax.CountryCode || "91",
				contactNumber: leadPax.ContactNo || "",
				emailId: leadPax.Email || "",
			};
			const tripType = flightResult?.ReturnResultIndex ? "R" : "O";
			const bookingRequest = {
				pricingData: effectivePricingData,
				passengers: passengerData,
				adultCount,
				childCount,
				infantCount,
				ssrData: selectedSSRs,
				flightData: flightResult,
				contactInfo,
				gstInfo: undefined,
				blockPNR: true,
				postAncillaryFlow: true,
				tripType,
			};
			setCreateBookingLoading(true);
			const response = await fetch("/api/travel/airiq/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingRequest),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Booking failed");
			const isSuccess = result._meta?.isSuccess;
			const pnrs = result._meta?.pnrs as { airIqPNR: string; airlinePNR: string } | undefined;
			const bookingTrackId = result._meta?.bookingTrackId as string | undefined;
			if (!isSuccess || !pnrs || !bookingTrackId) {
				toast.error(result.Status?.Error || "Booking could not be created");
				return;
			}
			setPostBookingCreated({
				airIqPNR: pnrs.airIqPNR,
				airlinePNR: pnrs.airlinePNR,
				bookingTrackId,
			});
			toast.success("Booking created. Add optional add-ons below or skip to payment.");
			const ancRes = await fetch(
				`/api/travel/airiq/ancillary?airIqPNR=${encodeURIComponent(pnrs.airIqPNR)}&airlinePNR=${encodeURIComponent(pnrs.airlinePNR)}`
			);
			const ancData = await ancRes.json();
			if (ancRes.ok && ancData.trackId && ancData.ssrDetails) {
				setAncillaryAvail({ trackId: ancData.trackId, ssrDetails: ancData.ssrDetails });
			}
		} catch (error) {
			console.error("Booking failed:", error);
			toast.error(error instanceof Error ? error.message : "Booking failed. Please try again.");
		} finally {
			setCreateBookingLoading(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardContent className="py-8 text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
						<p className="text-gray-600">Loading booking details...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Error state - flight not found
	if (!flightResult) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-center text-red-600">
							Flight Not Available
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-gray-600">
							The selected flight is no longer available or the session has
							expired.
						</p>
						<Button asChild className="w-full">
							<Link href="/travel-portal">
								<Search className="mr-2 h-4 w-4" />
								Search Flights Again
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-[calc(8rem+env(safe-area-inset-bottom))]">
			<h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">
				Complete Your Booking
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
				{/* Left Column: Flight Info & Passenger Details (65-70%) */}
				<div className="lg:col-span-8 space-y-8">
					{/* 1. Flight Details */}
					<section>
						<FlightDetails flightResult={flightResult} />
					</section>

					{/* 1b. Booking created – link to confirmation (same pattern as TBO) */}
					{postBookingCreated && (
						<section>
							<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
								<p className="font-medium">Booking created</p>
								<p className="text-sm">
									{postBookingCreated.airlinePNR && `PNR: ${postBookingCreated.airlinePNR}`}
									{postBookingCreated.airlinePNR && postBookingCreated.airIqPNR && " · "}
									{postBookingCreated.airIqPNR && `Ref: ${postBookingCreated.airIqPNR}`}
								</p>
								<p className="mt-1 text-sm">Add optional add-ons below or go to confirmation to view your booking details.</p>
								<Link
									href={`/travel-portal/booking/confirmation?source=airiq&airIqPNR=${encodeURIComponent(postBookingCreated.airIqPNR)}&airlinePNR=${encodeURIComponent(postBookingCreated.airlinePNR)}`}
									className="mt-2 inline-block text-sm font-medium text-green-700 hover:text-green-900 underline"
								>
									View confirmation page
								</Link>
							</div>
						</section>
					)}

					{/* 2. Passenger Details Form */}
					<section>
						<PassengerDetails
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onBookingSubmit={handleBookingSubmit}
							onPassengersChange={setPassengers}
							flightResult={flightResult}
							isSubmitting={createBookingLoading}
							ssrCharges={{
								baggage: Object.fromEntries(
									Object.entries(selectedSSRs.baggage).map(([key, value]) => [
										key,
										value ? { Price: value.Price } : null,
									])
								) as Record<string, { Price: number } | null>,
								meals: Object.fromEntries(
									Object.entries(selectedSSRs.meals).map(([key, value]) => [
										key,
										value ? { Price: value.Price } : null,
									])
								) as Record<string, { Price: number } | null>,
								seats: Object.fromEntries(
									Object.entries(selectedSSRs.seats).map(([key, value]) => [
										key,
										value ? { Price: value.Price } : null,
									])
								) as Record<string, { Price: number } | null>,
								specialServices: selectedSSRs.otherServices
									? Object.fromEntries(
											Object.entries(selectedSSRs.otherServices).map(([key, value]) => [
												key,
												value
													? [
															{
																Origin: "",
																Destination: "",
																DepartureTime: "",
																AirlineCode: "",
																FlightNumber: "",
																Code: value.Id,
																ServiceType: 0,
																Text: "",
																WayType: 0,
																Currency: "INR",
																Price: value.Price,
															} as SpecialServiceOption,
													  ]
													: [],
											])
									  )
									: {},
							}}
						/>
					</section>

					{/* 3. Add-ons (SSR & Seat Map) - Show if pricing data exists OR seat map is available */}
					{(pricingData !== null || (flightResult as FlightResult & { _airiqSeatMapAvailable?: boolean })?._airiqSeatMapAvailable === true) && (
						<section>
							<AiriqSSRSelection
								traceId={traceId}
								resultIndex={resultIndex}
								flight={flightResult}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								pricingData={pricingData}
								onSSRChange={setSelectedSSRs}
							/>
						</section>
					)}

					{/* 3a. Multi-class fare options - same UI style as TBO upsell cards */}
					{flightResult && (flightResult as { _airiqOriginal?: unknown })._airiqOriginal ? (
						<section>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Other fare classes</h3>
							<AiriqMultiClassCards
								flight={flightResult}
								traceId={traceId}
								resultIndex={resultIndex}
								returnFlight={returnFlightResult}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								pricingTrackid={
									pricingData?.PriceItenaryInfo &&
									Array.isArray(pricingData.PriceItenaryInfo) &&
									pricingData.PriceItenaryInfo.length > 0
										? pricingData.PriceItenaryInfo[0]?.Trackid
										: null
								}
								onSelectFare={(response) => {
									setSelectedMulticlassFare(response);
									toast.success("Fare selected. Proceed to book below.");
								}}
							/>
						</section>
					) : null}

					{/* 3b. Post-booking add-ons (after create booking): optional baggage, meals, seats, other SSR */}
					{postBookingCreated && ancillaryAvail && (
						<section>
							<Card>
								<CardHeader>
									<CardTitle>Optional add-ons</CardTitle>
									<p className="text-sm text-muted-foreground">
										Add baggage, meals, seats, or other services to your booking.
									</p>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Baggages */}
									{(ancillaryAvail.ssrDetails.Baggages?.length ?? 0) > 0 && (
										<div>
											<h4 className="font-medium mb-2">Baggage</h4>
											<ul className="space-y-2">
												{ancillaryAvail.ssrDetails.Baggages!.map((b) => (
													<li key={b.Id} className="flex items-center justify-between gap-4 rounded border p-3">
														<label className="flex items-center gap-2 cursor-pointer flex-1">
															<input
																type="checkbox"
																checked={postBookingSelections.baggages.includes(b.Id)}
																onChange={() =>
																	setPostBookingSelections((prev) => ({
																		...prev,
																		baggages: prev.baggages.includes(b.Id)
																			? prev.baggages.filter((x) => x !== b.Id)
																			: [...prev.baggages, b.Id],
																	}))
																}
															/>
															<span>{b.Description ?? b.Code ?? b.Id}</span>
														</label>
														<span className="text-sm font-medium">₹{b.Amount ?? "0"}</span>
													</li>
												))}
											</ul>
										</div>
									)}
									{/* Meals */}
									{(ancillaryAvail.ssrDetails.Meals?.length ?? 0) > 0 && (
										<div>
											<h4 className="font-medium mb-2">Meals</h4>
											<ul className="space-y-2">
												{ancillaryAvail.ssrDetails.Meals!.map((m) => (
													<li key={m.Id} className="flex items-center justify-between gap-4 rounded border p-3">
														<label className="flex items-center gap-2 cursor-pointer flex-1">
															<input
																type="checkbox"
																checked={postBookingSelections.meals.includes(m.Id)}
																onChange={() =>
																	setPostBookingSelections((prev) => ({
																		...prev,
																		meals: prev.meals.includes(m.Id)
																			? prev.meals.filter((x) => x !== m.Id)
																			: [...prev.meals, m.Id],
																	}))
																}
															/>
															<span>{m.Description ?? m.Code ?? m.Id}</span>
														</label>
														<span className="text-sm font-medium">₹{m.Amount ?? "0"}</span>
													</li>
												))}
											</ul>
										</div>
									)}
									{/* Seats */}
									{(ancillaryAvail.ssrDetails.Seats?.length ?? 0) > 0 && (
										<div>
											<h4 className="font-medium mb-2">Seats</h4>
											<ul className="space-y-2">
												{ancillaryAvail.ssrDetails.Seats!.map((s) => (
													<li key={s.Id} className="flex items-center justify-between gap-4 rounded border p-3">
														<label className="flex items-center gap-2 cursor-pointer flex-1">
															<input
																type="checkbox"
																checked={postBookingSelections.seats.includes(s.Id)}
																onChange={() =>
																	setPostBookingSelections((prev) => ({
																		...prev,
																		seats: prev.seats.includes(s.Id)
																			? prev.seats.filter((x) => x !== s.Id)
																			: [...prev.seats, s.Id],
																	}))
																}
															/>
															<span>{s.SeatName ?? s.Id}</span>
														</label>
														<span className="text-sm font-medium">₹{s.SeatAmount ?? "0"}</span>
													</li>
												))}
											</ul>
										</div>
									)}
									{/* Other SSR */}
									{(ancillaryAvail.ssrDetails.OtherSSR?.length ?? 0) > 0 && (
										<div>
											<h4 className="font-medium mb-2">Other services</h4>
											<ul className="space-y-2">
												{ancillaryAvail.ssrDetails.OtherSSR!.map((o) => (
													<li key={o.Id} className="flex items-center justify-between gap-4 rounded border p-3">
														<label className="flex items-center gap-2 cursor-pointer flex-1">
															<input
																type="checkbox"
																checked={postBookingSelections.otherSSR.includes(o.Id)}
																onChange={() =>
																	setPostBookingSelections((prev) => ({
																		...prev,
																		otherSSR: prev.otherSSR.includes(o.Id)
																			? prev.otherSSR.filter((x) => x !== o.Id)
																			: [...prev.otherSSR, o.Id],
																	}))
																}
															/>
															<span>{o.Description ?? o.Code ?? o.Id}</span>
														</label>
														<span className="text-sm font-medium">₹{o.Amount ?? "0"}</span>
													</li>
												))}
											</ul>
										</div>
									)}
									{ancillarySubmitSuccess ? (
										<div className="flex flex-col gap-2 pt-4">
											<p className="text-sm text-green-600 font-medium">You can now proceed to payment.</p>
											<Button onClick={handleProceedToPayment} className="w-full sm:w-auto">
												Proceed to payment
											</Button>
										</div>
									) : (
										<div className="flex flex-wrap gap-2 pt-4">
											<Button
												onClick={handleAddAncillaries}
												disabled={
													addAncillaryLoading ||
													(postBookingSelections.baggages.length === 0 &&
														postBookingSelections.meals.length === 0 &&
														postBookingSelections.seats.length === 0 &&
														postBookingSelections.otherSSR.length === 0)
												}
											>
												{addAncillaryLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
												Add selected add-ons
											</Button>
											<Button variant="outline" onClick={() => { setAncillarySubmitSuccess(true); toast.success("Skipped add-ons. Proceed to payment when ready."); }}>
												Skip add-ons
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</section>
					)}

					{/* 4. Fare Rules (Accordion) */}
					{fareRules && (
						<section>
							<FareRulesView fareRules={fareRules} />
						</section>
					)}
				</div>

				{/* Right Column: Price Summary Sidebar (30-35%) with Sticky Behavior */}
				<div className="lg:col-span-4 h-full">
					<div className="sticky top-6 space-y-6">
						<FareBreakdown
							flight={flightResult}
							showValidation={false}
							ssrCharges={{
								baggage: Object.fromEntries(
									Object.entries(selectedSSRs.baggage).map(([key, value]) => [
										key,
										value ? ({ Price: value.Price } as unknown as BaggageOption) : null,
									])
								) as Record<string, BaggageOption | null>,
								meals: Object.fromEntries(
									Object.entries(selectedSSRs.meals).map(([key, value]) => [
										key,
										value ? ({ Price: value.Price } as unknown as MealOption) : null,
									])
								) as Record<string, MealOption | null>,
								seats: Object.fromEntries(
									Object.entries(selectedSSRs.seats).map(([key, value]) => [
										key,
										value ? ({ Price: value.Price } as unknown as SeatOption) : null,
									])
								) as Record<string, SeatOption | null>,
								specialServices: selectedSSRs.otherServices
									? Object.fromEntries(
											Object.entries(selectedSSRs.otherServices).map(([key, value]) => [
												key,
												value
													? [
															{
																Origin: "",
																Destination: "",
																DepartureTime: "",
																AirlineCode: "",
																FlightNumber: "",
																Code: value.Id,
																ServiceType: 0,
																Text: "",
																WayType: 0,
																Currency: "INR",
																Price: value.Price,
															} as SpecialServiceOption,
													  ]
													: [],
											])
									  )
									: {},
							}}
						/>

						{/* Additional info */}
						<div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-100">
							<p className="flex items-center gap-2 mb-2 font-medium text-gray-900">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-green-600"
								>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
								</svg>
								Secure Booking
							</p>
							<p>
								Your data is encrypted and secure. We do not store your card
								details.
							</p>
						</div>

						{/* AIRiQ Badge */}
						<div className="bg-green-50 rounded-lg p-4 text-sm text-green-700 border border-green-200">
							<p className="flex items-center gap-2 mb-1 font-medium">
								<span className="w-2 h-2 rounded-full bg-green-500"></span>
								AIRiQ Flight
							</p>
							<p className="text-xs text-green-600">Powered by AIRiQ API</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
