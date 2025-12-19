"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface SpecialServiceOption {
	Origin: string;
	Destination: string;
	DepartureTime: string;
	AirlineCode: string;
	FlightNumber: string;
	Code: string;
	ServiceType: number;
	Text: string;
	WayType: number;
	Currency: string;
	Price: number;
}

interface SpecialServiceSelectionProps {
	serviceData: any[]; // SpecialServices structure
	passengers: any[];
	selectedServices: Record<string, SpecialServiceOption[]>; // Key: `${passengerIndex}-${segmentIndex}` -> Array of selected services
	onSelect: (
		passengerIndex: number,
		segmentIndex: number,
		service: SpecialServiceOption,
		isChecked: boolean
	) => void;
}

export default function SpecialServiceSelection({
	serviceData,
	passengers,
	selectedServices,
	onSelect,
}: SpecialServiceSelectionProps) {
	if (!serviceData || serviceData.length === 0) return null;

	return (
		<div className="space-y-6">
			{serviceData.map((segmentData, segmentIndex) => {
				const segmentServices =
					segmentData.SegmentSpecialService?.[0]?.SSRService;

				if (!segmentServices || segmentServices.length === 0) return null;

				const firstService = segmentServices[0];
				const origin = firstService.Origin;
				const destination = firstService.Destination;

				return (
					<div key={segmentIndex} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
								{origin} → {destination}
							</span>
						</h4>

						<div className="space-y-4">
							{passengers.map((passenger, passengerIndex) => {
								const key = `${passengerIndex}-${segmentIndex}`;
								const selectedForPassenger = selectedServices[key] || [];

								return (
									<div key={passengerIndex} className="space-y-3">
										<p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
											{passenger.firstName} {passenger.lastName}
										</p>

										<div className="space-y-3">
											{segmentServices.map((service: SpecialServiceOption) => {
												const isSelected = selectedForPassenger.some(
													(s) => s.Code === service.Code
												);

												return (
													<div
														key={service.Code}
														className={cn(
															"flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50",
															isSelected
																? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
																: "border-gray-200 hover:border-gray-300"
														)}
														onClick={() =>
															onSelect(
																passengerIndex,
																segmentIndex,
																service,
																!isSelected
															)
														}
													>
														<div className="flex items-center gap-3 flex-1">
															<Checkbox
																checked={isSelected}
																onCheckedChange={(checked) =>
																	onSelect(
																		passengerIndex,
																		segmentIndex,
																		service,
																		checked as boolean
																	)
																}
																className="data-[state=checked]:bg-blue-600 h-5 w-5"
															/>
															<span className="text-sm font-medium text-gray-900">
																{service.Text}
															</span>
														</div>
														{service.Price > 0 && (
															<div className="font-semibold text-sm text-gray-900">
																₹{service.Price.toLocaleString("en-IN")}
															</div>
														)}
													</div>
												);
											})}
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
}
