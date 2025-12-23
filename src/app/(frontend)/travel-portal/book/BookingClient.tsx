"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PassengerDetails from "../components/PassengerDetails";
import SSRSelection from "../components/ssr/SSRSelection";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Plane, Check, Loader2 } from "lucide-react";
import { BaggageOption } from "../components/ssr/BaggageSelection";
import { MealOption } from "../components/ssr/MealSelection";
import { SeatOption } from "../components/ssr/SeatSelection";

interface BookingClientProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	traceId: string;
	resultIndex: string;
	flightResult: any;
}

export default function BookingClient({
	adultCount,
	childCount,
	infantCount,
	traceId,
	resultIndex,
	flightResult,
}: BookingClientProps) {
	const router = useRouter();
	const [isBooking, setIsBooking] = useState(false);
	const [passengers, setPassengers] = useState<any[]>([]);
	const [selectedSSRs, setSelectedSSRs] = useState<{
		baggage: Record<string, BaggageOption | null>;
		meals: Record<string, MealOption | null>;
		seats: Record<string, SeatOption | null>;
	}>({
		baggage: {},
		meals: {},
		seats: {},
	});

	const calculateTotalFare = () => {
		let total = flightResult.Fare.PublishedFare;

		// Add Baggage
		Object.values(selectedSSRs.baggage).forEach((item) => {
			if (item) total += item.Price;
		});

		// Add Meals
		Object.values(selectedSSRs.meals).forEach((item) => {
			if (item) total += item.Price;
		});

		// Add Seats
		Object.values(selectedSSRs.seats).forEach((item) => {
			if (item) total += item.Price;
		});

		return total;
	};

	const handleBookingSubmit = async (passengerData: any[]) => {
		setIsBooking(true);
		try {
			// Construct the booking request payload
			// We need to map SSRs to passengers
			const passengersWithSSR = passengerData.map((p, index) => {
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
		} finally {
			setIsBooking(false);
		}
	};

	// Trigger form submission from outside
	const handleProceedToPay = () => {
		const form = document.getElementById("passenger-form") as HTMLFormElement;
		if (form) {
			form.requestSubmit();
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
					/>

					{/* SSR Selection */}
					<div className="pt-4">
						<h3 className="text-xl font-semibold mb-4">Add-ons & Services</h3>
						<SSRSelection
							traceId={traceId}
							resultIndex={resultIndex}
							passengers={passengers}
							onSSRChange={setSelectedSSRs}
						/>
					</div>
				</div>

				{/* Right Column removed as per UX request: Fare Summary moved/hidden */}
			</div>
		</div>
	);
}
