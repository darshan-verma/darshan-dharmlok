"use client";

import { useState, useEffect } from "react";
import PassengerDetails from "../components/PassengerDetails";
import FareBreakdown from "@/components/travel-portal/FareBreakdown";
import FlightDetails from "./components/FlightDetails";
import FareRulesView from "./components/FareRulesView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import type { PassengerDetail, FlightResult } from "@/types/tbo";

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
	const [fareRules, setFareRules] = useState<any>(null);

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
			console.log("Loaded cache:", cache);

			// Find the flight with matching resultIndex and traceId
			let foundFlight: FlightResult | null = null;
			Object.values(cache).forEach((entry: any) => {
				if (entry.traceId === traceId && entry.results) {
					const flight = entry.results.find(
						(f: FlightResult) => f.ResultIndex === resultIndex
					);
					if (flight) {
						foundFlight = flight;
					}
				}
			});

			if (foundFlight) {
				console.log("Found flight in cache:", foundFlight);
				setFlightResult(foundFlight);

				// Fetch pricing and fare rules for AIRiQ flight
				fetchAiriqBookingData(foundFlight);
			} else {
				console.error("Flight not found in cache");
				setLoading(false);
			}
		} catch (e) {
			console.error("Error loading flight data from cache:", e);
			setLoading(false);
		}
	}, [traceId, resultIndex]);

	const fetchAiriqBookingData = async (flight: FlightResult) => {
		try {
			// Fetch pricing and fare rules SEQUENTIALLY to avoid race conditions
			// First fetch pricing
			const pricingResponse = await fetch("/api/travel/airiq/pricing", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					traceId,
					resultIndex,
					flight,
					adultCount,
					childCount,
					infantCount,
				}),
			});

			if (!pricingResponse.ok) {
				throw new Error("Failed to fetch pricing");
			}

			const pricingData = await pricingResponse.json();
			console.log("Pricing data:", pricingData);

			// Then fetch fare rules (using the same token from cache)
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

			setLoading(false);
		} catch (error) {
			console.error("Error fetching AIRiQ booking data:", error);
			toast.error("Failed to load booking details");
			setLoading(false);
		}
	};

	const handleBookingSubmit = async (passengerData: PassengerDetail[]) => {
		try {
			// Validate passenger data
			if (!passengerData || passengerData.length === 0) {
				toast.error("Please provide passenger details");
				return;
			}

			// Validate required fields for each passenger
			for (let i = 0; i < passengerData.length; i++) {
				const passenger = passengerData[i];
				if (!passenger.FirstName || !passenger.LastName) {
					toast.error(
						`Passenger ${i + 1}: First name and last name are required`
					);
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

			// Construct AIRiQ booking request
			const bookingRequest = {
				traceId,
				resultIndex,
				passengers: passengerData,
				adultCount,
				childCount,
				infantCount,
			};

			console.log("AIRiQ Booking Request:", bookingRequest);

			// TODO: Call AIRiQ booking API
			const response = await fetch("/api/travel/airiq/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingRequest),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Booking failed");
			}

			const result = await response.json();
			console.log("Booking result:", result);

			toast.success(
				"Booking request submitted successfully! Our team will contact you shortly."
			);
		} catch (error) {
			console.error("Booking failed:", error);

			let errorMessage = "Booking failed. Please try again.";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			toast.error(errorMessage);
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
		<div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
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

					{/* 2. Passenger Details Form */}
					<section>
						<PassengerDetails
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onBookingSubmit={handleBookingSubmit}
							onPassengersChange={() => {}}
							flightResult={flightResult}
							ssrCharges={{
								baggage: {},
								meals: {},
								seats: {},
								specialServices: {},
							}}
						/>
					</section>

					{/* 3. Fare Rules (Accordion) */}
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
								baggage: {},
								meals: {},
								seats: {},
								specialServices: {},
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
