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
import type { FlightResult, PassengerDetail } from "@/types/tbo";

interface BookingClientProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	traceId: string;
	resultIndex: string;
	flightResult: FlightResult;
	upsellOptions?: FlightResult[];
	isUpsellAllowed?: boolean;
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
			// Construct the booking request payload
			// We need to map SSRs to passengers
			const passengersWithSSR = passengerData.map((p) => {
				// Collect SSRs for this passenger
				// Note: This logic assumes simple mapping.
				// In reality, we need to format it according to TBO API requirements for SSRs.
				// Usually SSRs are passed separately or attached to passenger segments.

				return {
					...p,
					Fare: flightResult.Fare, // Include fare details for each passenger as per TBO API
					// We might need to attach SSR codes here or in a separate field
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

			alert("Booking request prepared! Check console for details.");
		} catch (error) {
			console.error("Booking failed:", error);
			alert("Booking failed. Please try again.");
		}
	};

	return (
		<div className="container mx-auto py-6 px-4">
			<div className="grid grid-cols-1 gap-8">
				{/* Left Column: Scrollable */}
				<div className="lg:col-span-2 space-y-6">
					{/* Passenger Details */}
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

					{/* Fare Breakdown */}
					<div className="pt-4">
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
					</div>

					{/* Fare Upsell Options */}
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

					{/* SSR Selection */}
					<SSRSelection
						traceId={traceId}
						resultIndex={resultIndex}
						passengers={passengers}
						adultCount={adultCount}
						childCount={childCount}
						infantCount={infantCount}
						onSSRChange={setSelectedSSRs}
					/>
				</div>
			</div>

			{/* Right Column removed as per UX request: Fare Summary moved/hidden */}
		</div>
	);
}
