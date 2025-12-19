"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

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
	passengers: any[];
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
	selectedBaggage,
	onSelect,
}: BaggageSelectionProps) {
	if (!baggageData || baggageData.length === 0) return null;

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

						{passengers.map((passenger, passengerIndex) => {
							const key = `${passengerIndex}-${segmentIndex}`;
							const selected = selectedBaggage[key];

							return (
								<div key={passengerIndex} className="space-y-3">
									<p className="text-sm font-semibold text-gray-700">
										{passenger.firstName} {passenger.lastName}
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
