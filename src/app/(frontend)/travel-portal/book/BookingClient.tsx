"use client";

import { useState } from "react";
import PassengerDetails from "../components/PassengerDetails";
import SSRSelection from "../components/ssr/SSRSelection";
import { BaggageOption } from "../components/ssr/BaggageSelection";
import { MealOption } from "../components/ssr/MealSelection";
import { SeatOption } from "../components/ssr/SeatSelection";
import { SpecialServiceOption } from "../components/ssr/SpecialServiceSelection";
import FareBreakdown from "@/components/travel-portal/FareBreakdown";
import FareUpsellList from "../components/FareUpsellList";
import FlightDetails from "./components/FlightDetails";
import FareRulesView from "./components/FareRulesView";
import { toast } from "@/lib/toast";
import type {
	FlightResult,
	PassengerDetail,
	FareRuleResponse,
} from "@/types/tbo";
// import { Button } from "@/components/ui/button"; // Assuming available if needed later, but PassengerDetails has the button

interface BookingClientProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	traceId: string;
	resultIndex: string;
	flightResult: FlightResult;
	upsellOptions?: FlightResult[];
	isUpsellAllowed?: boolean;
	fareRules: FareRuleResponse | null;
}

export default function BookingClient({
	adultCount,
	childCount,
	infantCount,
	traceId,
	resultIndex,
	flightResult,
	upsellOptions = [],
	isUpsellAllowed = false,
	fareRules,
}: BookingClientProps) {
	const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
	const [selectedSSRs, setSelectedSSRs] = useState<{
		baggage: Record<string, BaggageOption | null>;
		meals: Record<string, MealOption | null>;
		seats: Record<string, SeatOption | null>;
		specialServices: Record<string, SpecialServiceOption[]>;
	}>({
		baggage: {},
		meals: {},
		seats: {},
		specialServices: {},
	});

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
				if (!passenger.PassportNo) {
					toast.error(`Passenger ${i + 1}: Passport number is required`);
					return;
				}
				if (
					!passenger.AddressLine1 ||
					!passenger.City ||
					!passenger.CountryCode
				) {
					toast.error(`Passenger ${i + 1}: Complete address is required`);
					return;
				}
				if (!passenger.ContactNo) {
					toast.error(`Passenger ${i + 1}: Contact number is required`);
					return;
				}
				if (!passenger.Email) {
					toast.error(`Passenger ${i + 1}: Email address is required`);
					return;
				}
			}

			// Construct the booking request payload
			const passengersWithSSR = passengerData.map((p) => {
				return {
					...p,
					Fare: flightResult.Fare, // Include fare details for each passenger
				};
			});

			const bookingRequest = {
				ResultIndex: resultIndex,
				Passengers: passengersWithSSR,
				EndUserIp: "192.168.1.1",
				TokenId: "2a20f807-1933-45a7-9ac7-1e47377c640c",
				TraceId: traceId,
				// Include SSR details if required by API structure
			};

			console.log("Booking Request:", bookingRequest);
			console.log("Selected SSRs:", selectedSSRs);

			// TODO: Replace with actual API call
			// const response = await fetch("/api/travel/bookings", {
			//     method: "POST",
			//     headers: { "Content-Type": "application/json" },
			//     body: JSON.stringify(bookingRequest),
			// });

			// if (!response.ok) {
			//     const errorData = await response.json();
			//     throw new Error(errorData.error || "Booking failed");
			// }

			// const result = await response.json();

			toast.success(
				"Booking request submitted successfully! Our team will contact you shortly."
			);
		} catch (error) {
			console.error("Booking failed:", error);

			// Handle different types of errors
			let errorMessage = "Booking failed. Please try again.";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			}

			// Show appropriate toast based on error type
			if (
				errorMessage.toLowerCase().includes("network") ||
				errorMessage.toLowerCase().includes("connection")
			) {
				toast.error(
					"Network error. Please check your internet connection and try again."
				);
			} else if (errorMessage.toLowerCase().includes("validation")) {
				toast.error("Please check all required fields and try again.");
			} else if (errorMessage.toLowerCase().includes("payment")) {
				toast.error(
					"Payment processing failed. Please try a different payment method."
				);
			} else {
				toast.error(errorMessage);
			}
		}
	};

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
							onPassengersChange={setPassengers}
							flightResult={flightResult}
							ssrCharges={{
								baggage: selectedSSRs.baggage,
								meals: selectedSSRs.meals,
								seats: selectedSSRs.seats,
								specialServices: selectedSSRs.specialServices,
							}}
						/>
					</section>

					{/* 3. Add-ons (SSR) */}
					<section>
						<SSRSelection
							traceId={traceId}
							resultIndex={resultIndex}
							passengers={passengers}
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onSSRChange={setSelectedSSRs}
						/>
					</section>

					{/* 4. Fare Upsell Options */}
					{isUpsellAllowed && upsellOptions.length > 0 && (
						<section>
							<FareUpsellList
								upsellOptions={upsellOptions}
								isUpsellAllowed={isUpsellAllowed}
								traceId={traceId}
								returnResultIndex={undefined}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								fallbackFareCurrency={flightResult.Fare?.Currency}
							/>
						</section>
					)}

					{/* 5. Fare Rules (Accordion) */}
					<section>
						<FareRulesView fareRules={fareRules} />
					</section>
				</div>

				{/* Right Column: Price Summary Sidebar (30-35%) with Sticky Behavior */}
				<div className="lg:col-span-4 h-full">
					<div className="sticky top-6 space-y-6">
						<FareBreakdown
							flight={flightResult}
							showValidation={false}
							ssrCharges={{
								baggage: selectedSSRs.baggage,
								meals: selectedSSRs.meals,
								seats: selectedSSRs.seats,
								specialServices: selectedSSRs.specialServices,
							}}
						/>

						{/* Additional info or guarantees can go here */}
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
					</div>
				</div>
			</div>
		</div>
	);
}
