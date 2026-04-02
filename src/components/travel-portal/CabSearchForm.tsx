"use client";

import { useState } from "react";
import { CarFront, Clock3, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TripjackJourneyType } from "@/types/tripjack";
import CabLocationInput, {
	type CabSearchLocation,
} from "@/components/travel-portal/CabLocationInput";

export interface CabSearchData {
	journeyType: TripjackJourneyType;
	tripType: "oneway" | "roundtrip";
	pickupDateTime: string;
	returnDateTime?: string;
	origin: CabSearchLocation | null;
	destination: CabSearchLocation | null;
	passengers: number;
}

interface CabSearchFormProps {
	initialValues?: Partial<CabSearchData>;
	onSearch: (data: CabSearchData) => void;
	submitLabel?: string;
	className?: string;
}

const JOURNEY_TYPES: Array<{ value: TripjackJourneyType; label: string }> = [
	{ value: "airport_transfer", label: "Airport transfer" },
	{ value: "outstations", label: "Outstation" },
	{ value: "local", label: "Local" },
	{ value: "rental", label: "Rental" },
];

function formatDateTimeLocal(value: Date) {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	const hours = String(value.getHours()).padStart(2, "0");
	const minutes = String(value.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultPickupDateTime() {
	const value = new Date(Date.now() + 2 * 60 * 60 * 1000);
	value.setMinutes(Math.ceil(value.getMinutes() / 5) * 5, 0, 0);
	return formatDateTimeLocal(value);
}

function getDefaultReturnDateTime(pickupDateTime: string) {
	const pickup = new Date(pickupDateTime);
	pickup.setDate(pickup.getDate() + 1);
	return formatDateTimeLocal(pickup);
}

export default function CabSearchForm({
	initialValues,
	onSearch,
	submitLabel = "Search Cabs",
	className = "",
}: CabSearchFormProps) {
	const initialPickupDateTime =
		initialValues?.pickupDateTime || getDefaultPickupDateTime();
	const [journeyType, setJourneyType] = useState<TripjackJourneyType>(
		initialValues?.journeyType || "airport_transfer",
	);
	const [tripType, setTripType] = useState<"oneway" | "roundtrip">(
		initialValues?.tripType || "oneway",
	);
	const [pickupDateTime, setPickupDateTime] = useState(initialPickupDateTime);
	const [returnDateTime, setReturnDateTime] = useState(
		initialValues?.returnDateTime ||
			getDefaultReturnDateTime(initialPickupDateTime),
	);
	const [origin, setOrigin] = useState<CabSearchLocation | null>(
		initialValues?.origin || null,
	);
	const [destination, setDestination] = useState<CabSearchLocation | null>(
		initialValues?.destination || null,
	);
	const [passengers, setPassengers] = useState(initialValues?.passengers || 1);
	const [validationError, setValidationError] = useState<string | null>(null);

	function handleSubmit() {
		if (!origin || !destination) {
			setValidationError(
				"Choose both pickup and drop locations from TripJack suggestions.",
			);
			return;
		}

		if (!pickupDateTime) {
			setValidationError("Pickup date and time are required.");
			return;
		}

		if (tripType === "roundtrip" && !returnDateTime) {
			setValidationError("Return date and time are required for round trips.");
			return;
		}

		if (
			tripType === "roundtrip" &&
			new Date(returnDateTime).getTime() <= new Date(pickupDateTime).getTime()
		) {
			setValidationError("Return date must be after pickup date.");
			return;
		}

		setValidationError(null);
		onSearch({
			journeyType,
			tripType,
			pickupDateTime,
			returnDateTime: tripType === "roundtrip" ? returnDateTime : undefined,
			origin,
			destination,
			passengers,
		});
	}

	return (
		<div className={className}>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
				<Card className="border-amber-100 bg-amber-50/60 p-4 lg:col-span-3">
					<div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-900">
						<Route className="h-4 w-4" />
						Trip Details
					</div>
					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Journey Type
							</label>
							<Select
								value={journeyType}
								onValueChange={(value) =>
									setJourneyType(value as TripjackJourneyType)
								}
							>
								<SelectTrigger className="h-12 w-full rounded-xl border-gray-200 bg-white">
									<SelectValue placeholder="Select journey type" />
								</SelectTrigger>
								<SelectContent>
									{JOURNEY_TYPES.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Trip Type
							</label>
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant={tripType === "oneway" ? "default" : "outline"}
									onClick={() => setTripType("oneway")}
									className="rounded-xl"
								>
									One way
								</Button>
								<Button
									type="button"
									variant={tripType === "roundtrip" ? "default" : "outline"}
									onClick={() => setTripType("roundtrip")}
									className="rounded-xl"
								>
									Round trip
								</Button>
							</div>
						</div>
					</div>
				</Card>

				<div className="space-y-4 lg:col-span-6">
					<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
						<CabLocationInput
							label="Pickup"
							placeholder="Airport, station, hotel or area"
							value={origin}
							onChange={setOrigin}
						/>
						<CabLocationInput
							label="Drop"
							placeholder="Where should the cab go?"
							value={destination}
							onChange={setDestination}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Pickup Date & Time
							</label>
							<div className="relative">
								<Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<Input
									type="datetime-local"
									value={pickupDateTime}
									onChange={(event) => setPickupDateTime(event.target.value)}
									className="h-12 rounded-xl border-gray-200 bg-white pl-10"
								/>
							</div>
						</div>

						{tripType === "roundtrip" && (
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">
									Return Date & Time
								</label>
								<div className="relative">
									<Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
									<Input
										type="datetime-local"
										value={returnDateTime}
										onChange={(event) => setReturnDateTime(event.target.value)}
										className="h-12 rounded-xl border-gray-200 bg-white pl-10"
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				<Card className="border-gray-200 bg-white p-4 lg:col-span-3">
					<div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
						<CarFront className="h-4 w-4 text-amber-600" />
						Passengers
					</div>
					<div className="space-y-4">
						<Select
							value={String(passengers)}
							onValueChange={(value) => setPassengers(Number(value))}
						>
							<SelectTrigger className="h-12 w-full rounded-xl border-gray-200 bg-white">
								<SelectValue placeholder="Passengers" />
							</SelectTrigger>
							<SelectContent>
								{[1, 2, 3, 4, 5, 6].map((count) => (
									<SelectItem key={count} value={String(count)}>
										{count} passenger{count > 1 ? "s" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<p className="text-xs leading-5 text-gray-500">
							TripJack returns available vehicle types, capacity and fare
							breakup based on the selected route and pickup time.
						</p>

						<Button onClick={handleSubmit} className="h-12 w-full rounded-xl">
							{submitLabel}
						</Button>
					</div>
				</Card>
			</div>

			{validationError && (
				<p className="mt-3 text-sm text-red-600">{validationError}</p>
			)}
		</div>
	);
}
