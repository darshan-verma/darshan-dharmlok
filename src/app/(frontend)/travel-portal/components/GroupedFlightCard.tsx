"use client";

import { Briefcase, Loader2, MapPin, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import { AirportCodeLabel } from "@/components/travel-portal/ReferenceCodeLabel";
import { airlineLabelFromFields } from "@/lib/reference-data-client";
import { getFareBreakdown } from "@/lib/tboFareCalculations";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";
import { getFlightRbdAvailability } from "@/lib/tboAdvanceSearch";
import {
	formatFlightDate,
	formatFlightDuration,
	formatFlightTime,
	getFareRowLabel,
	getTotalSeatsAvailable,
	type ScheduleFlightGroup,
} from "@/lib/flightScheduleGrouping";
import type { FlightResult } from "@/types/tbo";

interface GroupedFlightCardProps {
	group: ScheduleFlightGroup;
	selectedResultIndex: string;
	onSelectFare: (resultIndex: string) => void;
	onBook: (flight: FlightResult) => void;
	selectingFlight: string | null;
	tripType: string;
	expandedFareBreakdown: string | null;
	onToggleFareBreakdown: (resultIndex: string | null) => void;
	advanceSearchRbdByIndex: Record<string, string>;
	onAdvanceSearchRbdChange: (resultIndex: string, fareClass: string) => void;
}

function terminalLabel(terminal: string | undefined): string {
	if (!terminal?.trim()) return "";
	return `(T${terminal.replace(/^T/i, "")})`;
}

function formatFareTypeLabel(label: string): string {
	return label
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/Fare$/i, "")
		.trim();
}

export default function GroupedFlightCard({
	group,
	selectedResultIndex,
	onSelectFare,
	onBook,
	selectingFlight,
	tripType,
	expandedFareBreakdown,
	onToggleFareBreakdown,
	advanceSearchRbdByIndex,
	onAdvanceSearchRbdChange,
}: GroupedFlightCardProps) {
	const selectedFlight =
		group.flights.find((f) => f.ResultIndex === selectedResultIndex) ??
		group.representative;
	const displayFlight = selectedFlight;
	const isAdvanceReturn = tripType === "advance-return";
	const selectedPrice = selectedFlight.Fare
		? formatTravelPriceInr(
				getFareBreakdown(selectedFlight.Fare, 0).publishedFare,
			)
		: null;

	return (
		<Card className="shadow-sm hover:shadow-md transition-all duration-200">
			<CardContent className="p-0">
				{/* Flight schedule — full width so times never overlap fare column */}
				<div className="p-4 lg:p-5 border-b border-gray-200 bg-white">
					{displayFlight.Segments.map((legSegments, legIndex) => {
						const firstSegment = legSegments[0];
						const lastSegment = legSegments[legSegments.length - 1];
						const airlineCode =
							firstSegment?.Airline?.AirlineCode ||
							displayFlight.AirlineCode ||
							"XX";
						const airlineName = airlineLabelFromFields(
							airlineCode,
							firstSegment?.Airline?.AirlineName,
						);
						const totalDuration = legSegments.reduce(
							(acc, seg) => acc + (seg?.Duration || 0),
							0,
						);
						const depTime =
							firstSegment?.Origin?.DepTime || firstSegment?.DepartureTime;
						const arrTime =
							lastSegment?.Destination?.ArrTime || lastSegment?.ArrivalTime;
						const seats = getTotalSeatsAvailable(displayFlight);

						return (
							<div
								key={legIndex}
								className="grid grid-cols-[72px_1fr_auto_1fr] sm:grid-cols-[80px_minmax(100px,1fr)_88px_minmax(100px,1fr)] items-center gap-x-3 sm:gap-x-4 max-w-3xl"
							>
								<div>
									<div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-1 overflow-hidden border border-gray-100">
										<AirlineLogo
											airlineCode={airlineCode}
											airlineName={airlineName}
											size="md"
										/>
									</div>
									<div className="text-[10px] text-gray-500 font-medium leading-tight">
										{airlineCode} {firstSegment?.Airline?.FlightNumber}
									</div>
									{firstSegment?.Craft ? (
										<div className="text-[10px] text-gray-400 leading-tight">
											{firstSegment.Craft}
										</div>
									) : null}
									{seats != null ? (
										<div className="mt-1 inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
											{seats} Seats Left
										</div>
									) : null}
								</div>

								<div className="text-right">
									<div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">
										{formatFlightTime(depTime)}
									</div>
									<div className="text-[11px] text-gray-500 mt-1">
										{formatFlightDate(depTime)}
									</div>
									<div className="text-xs font-medium text-gray-600 mt-1 leading-tight">
										<AirportCodeLabel
											code={
												firstSegment?.Origin?.Airport?.AirportCode ||
												firstSegment?.Origin?.Airport?.CityCode ||
												"N/A"
											}
											city={firstSegment?.Origin?.Airport?.CityName}
										/>
										{terminalLabel(firstSegment?.Origin?.Airport?.Terminal)}
									</div>
								</div>

								<div className="flex flex-col items-center w-[72px] sm:w-[88px] shrink-0">
									<div className="text-[10px] sm:text-[11px] text-gray-500 mb-1 text-center leading-tight whitespace-nowrap">
										{formatFlightDuration(totalDuration)}
									</div>
									<div className="w-full flex items-center gap-0.5">
										<div className="h-px flex-1 bg-gray-300" />
										<div className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
										<div className="h-px flex-1 bg-gray-300" />
									</div>
									<div className="text-[10px] text-blue-600 font-medium mt-1 text-center whitespace-nowrap">
										{legSegments.length > 1
											? `${legSegments.length - 1} Stop(s)`
											: "Non stop"}
									</div>
								</div>

								<div className="text-left">
									<div className="text-xs font-medium text-gray-600 mb-1 leading-tight">
										<AirportCodeLabel
											code={
												lastSegment?.Destination?.Airport?.AirportCode ||
												lastSegment?.Destination?.Airport?.CityCode ||
												"N/A"
											}
											city={lastSegment?.Destination?.Airport?.CityName}
										/>
										{terminalLabel(
											lastSegment?.Destination?.Airport?.Terminal,
										)}
									</div>
									<div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">
										{formatFlightTime(arrTime)}
									</div>
									<div className="text-[11px] text-gray-500 mt-1">
										{formatFlightDate(arrTime)}
									</div>
								</div>
							</div>
						);
					})}

					{(() => {
						const firstSegment = displayFlight.Segments?.[0]?.[0];
						const hasBaggage = firstSegment?.Baggage;
						const hasSeatMap =
							(
								displayFlight as FlightResult & {
									_airiqSeatMapAvailable?: boolean;
								}
							)?._airiqSeatMapAvailable === true;

						if (!hasSeatMap && !hasBaggage) return null;

						return (
							<div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center max-w-3xl">
								<span className="text-xs text-gray-500 font-medium">
									Available:
								</span>
								{hasSeatMap ? (
									<div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs border border-purple-200">
										<MapPin className="h-3 w-3" />
										<span>Seat Map</span>
									</div>
								) : null}
								{hasBaggage ? (
									<div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200">
										<ShoppingBag className="h-3 w-3" />
										<span>SSR</span>
									</div>
								) : null}
							</div>
						);
					})()}
				</div>

				{/* Fare options + book */}
				<div className="grid grid-cols-1 sm:grid-cols-[1fr_132px]">
					{/* Fare options */}
					<div className="min-w-0 p-4 lg:p-5 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200">
						<div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
							{group.flights.length > 1
								? `${group.flights.length} fare options`
								: "Fare option"}
						</div>
						<RadioGroup
							value={selectedResultIndex}
							onValueChange={onSelectFare}
							className="gap-2"
						>
							{group.flights.map((flight) => {
								const seg = flight.Segments?.[0]?.[0];
								const fareClass = seg?.Airline?.FareClass || "—";
								const baggage = seg?.Baggage || "—";
								const label = formatFareTypeLabel(getFareRowLabel(flight));
								const price = flight.Fare
									? formatTravelPriceInr(
											getFareBreakdown(flight.Fare, 0).publishedFare,
										)
									: null;
								const rbdOptions = getFlightRbdAvailability(flight);
								const selectedRbd =
									advanceSearchRbdByIndex[flight.ResultIndex] ||
									seg?.Airline?.FareClass ||
									"";
								const isSelected =
									flight.ResultIndex === selectedResultIndex;

								return (
									<label
										key={flight.ResultIndex}
										className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
											isSelected
												? "border-blue-300 bg-blue-50/60 shadow-sm"
												: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
										}`}
									>
										<RadioGroupItem
											value={flight.ResultIndex}
											id={flight.ResultIndex}
											className="shrink-0"
										/>
										<div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
											<div className="text-sm font-bold text-gray-900 tabular-nums shrink-0">
												{price != null ? `₹${price}` : "—"}
											</div>
											<div className="text-xs font-medium text-gray-800 shrink-0">
												{label}
											</div>
											<div className="text-[11px] text-gray-500 shrink-0">
												{fareClass}
											</div>
											<div className="flex items-center gap-1 text-[11px] text-gray-600 shrink-0">
												<Briefcase className="h-3.5 w-3.5 shrink-0" />
												<span>{baggage}</span>
											</div>
											<div
												className={`ml-auto h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
													flight.IsRefundable
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-500"
												}`}
												title={
													flight.IsRefundable ? "Refundable" : "Non-refundable"
												}
											>
												{flight.IsRefundable ? "R" : "N"}
											</div>
										</div>
										{isAdvanceReturn && !flight.Fare && rbdOptions.length > 0 ? (
											<Select
												value={selectedRbd || undefined}
												onValueChange={(value) =>
													onAdvanceSearchRbdChange(flight.ResultIndex, value)
												}
											>
												<SelectTrigger
													className="h-8 w-[72px] text-xs shrink-0"
													onClick={(e) => e.stopPropagation()}
												>
													<SelectValue placeholder="RBD" />
												</SelectTrigger>
												<SelectContent>
													{rbdOptions.map((row) => (
														<SelectItem
															key={`${flight.ResultIndex}-${row.Class}`}
															value={row.Class}
														>
															{row.Class}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : null}
									</label>
								);
							})}
						</RadioGroup>

						{selectedFlight.Fare && selectedFlight.IsUpsellAllowed ? (
							<div className="flex items-center gap-1 mt-3 text-xs text-purple-700">
								<TrendingUp className="h-3 w-3 shrink-0" />
								Upsell available on selected fare
							</div>
						) : null}

						{selectedFlight.Fare ? (
							<Button
								variant="link"
								size="sm"
								className="h-auto p-0 text-xs text-blue-600 mt-3"
								onClick={() =>
									onToggleFareBreakdown(
										expandedFareBreakdown === selectedFlight.ResultIndex
											? null
											: selectedFlight.ResultIndex,
									)
								}
							>
								{expandedFareBreakdown === selectedFlight.ResultIndex
									? "Hide"
									: "View"}{" "}
								Fare Rules
							</Button>
						) : null}
					</div>

					{/* Book */}
					<div className="flex flex-row sm:flex-col items-center sm:items-stretch justify-between sm:justify-center gap-3 p-4 sm:px-3 sm:py-5 bg-white">
						{selectedPrice != null ? (
							<div className="text-left sm:text-center">
								<div className="text-[11px] text-gray-500 whitespace-nowrap">
									Selected fare
								</div>
								<div className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums whitespace-nowrap">
									₹{selectedPrice}
								</div>
							</div>
						) : null}
						<Button
							className="w-full min-w-[88px] max-w-[160px] sm:max-w-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md uppercase tracking-wide text-sm"
							disabled={selectingFlight === selectedFlight.ResultIndex}
							onClick={() => onBook(selectedFlight)}
						>
							{selectingFlight === selectedFlight.ResultIndex ? (
								<>
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
									<span className="truncate">Processing</span>
								</>
							) : (
								"Book"
							)}
						</Button>
					</div>
				</div>

				{expandedFareBreakdown === selectedFlight.ResultIndex &&
				selectedFlight.Fare ? (
					<div className="px-4 lg:px-5 pb-4 border-t border-gray-200 bg-white">
						<div className="pt-4">
							<h3 className="font-medium text-gray-900 mb-3">Fare Breakdown</h3>
							{(() => {
								const breakdown = getFareBreakdown(selectedFlight.Fare, 0);
								return (
									<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2 border border-gray-100">
										<div className="flex justify-between text-gray-600">
											<span>Base Fare</span>
											<span className="font-medium text-gray-900">
												{selectedFlight.Fare.Currency}{" "}
												{formatTravelPriceInr(breakdown.baseFare)}
											</span>
										</div>
										<div className="flex justify-between text-gray-600">
											<span>Tax & Charges</span>
											<span className="font-medium text-gray-900">
												{selectedFlight.Fare.Currency}{" "}
												{formatTravelPriceInr(
													breakdown.tax + breakdown.otherCharges,
												)}
											</span>
										</div>
									</div>
								);
							})()}
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
