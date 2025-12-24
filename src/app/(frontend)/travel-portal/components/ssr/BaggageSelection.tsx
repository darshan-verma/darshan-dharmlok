"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { PassengerDetail } from "@/types/tbo";

export interface BaggageOption {
	AirlineCode: string;
	FlightNumber: string;
	WayType: number;
	Code: string;
	Description: number;
	Weight: number;
	Currency: string;
	Price: number;
	Origin: string;
	Destination: string;
}

interface BaggageSelectionProps {
	baggageData: BaggageOption[][];
	passengers: PassengerDetail[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	selectedBaggage: Record<string, BaggageOption | null>; // Key: `${passengerIndex}-${segmentIndex}`
	onSelect: (
		passengerIndex: number,
		segmentIndex: number,
		baggage: BaggageOption | null
	) => void;
}

export default function BaggageSelection({
	baggageData,
	passengers,
	adultCount,
	childCount,
	infantCount,
	selectedBaggage,
	onSelect,
}: BaggageSelectionProps) {
	if (!baggageData || baggageData.length === 0) return null;

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

	return (
		<div className="space-y-6">
			{baggageData.map((segmentBaggage, segmentIndex) => {
				if (!segmentBaggage || segmentBaggage.length === 0) return null;

				const origin = segmentBaggage[0].Origin;
				const destination = segmentBaggage[0].Destination;

				return (
					<div key={segmentIndex} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
								{origin} → {destination}
							</span>
						</h4>

						{passengers.map((_, passengerIndex) => {
							const key = `${passengerIndex}-${segmentIndex}`;
							const selected = selectedBaggage[key];

							return (
								<div key={passengerIndex} className="space-y-3">
									<p className="text-sm font-semibold text-gray-700">
										{getPassengerLabel(passengerIndex)}
									</p>
									<div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
										{/* No Extra Option */}
										<div
											onClick={() =>
												onSelect(passengerIndex, segmentIndex, null)
											}
											className={cn(
												"cursor-pointer rounded-lg border px-4 py-3 min-w-[140px] transition-all flex flex-col justify-between relative bg-white",
												!selected
													? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
													: "border-gray-200 hover:border-gray-300"
											)}
										>
											<div className="flex justify-between items-start mb-1">
												<span
													className={cn(
														"text-xs font-medium",
														!selected ? "text-blue-700" : "text-gray-500"
													)}
												>
													No Extra
												</span>
												{!selected && (
													<CheckCircle2 className="h-4 w-4 text-blue-600" />
												)}
											</div>
											<div className="font-bold text-base">0 kg</div>
											<div className="text-xs text-gray-600">Included</div>
										</div>

										{/* Paid Options */}
										{segmentBaggage.map((option) => {
											const isSelected = selected?.Code === option.Code;
											return (
												<div
													key={option.Code}
													onClick={() =>
														onSelect(passengerIndex, segmentIndex, option)
													}
													className={cn(
														"cursor-pointer rounded-lg border px-4 py-3 min-w-[140px] transition-all flex flex-col justify-between relative bg-white",
														isSelected
															? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
															: "border-gray-200 hover:border-gray-300"
													)}
												>
													<div className="flex justify-between items-start mb-1">
														<span
															className={cn(
																"text-xs font-medium",
																isSelected ? "text-blue-700" : "text-gray-500"
															)}
														>
															+{option.Weight}kg
														</span>
														{isSelected && (
															<CheckCircle2 className="h-4 w-4 text-blue-600" />
														)}
													</div>
													<div className="font-bold text-base">
														+{option.Weight}kg
													</div>
													<div className="text-sm font-semibold text-gray-900">
														₹{option.Price.toLocaleString("en-IN")}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
