"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Armchair, Info, X, Check } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SeatOption {
	AirlineCode: string;
	FlightNumber: string;
	CraftType: string;
	Origin: string;
	Destination: string;
	AvailablityType: number;
	Description: number;
	Code: string;
	RowNo: string;
	SeatNo: string | null;
	SeatType: number;
	SeatWayType: number;
	Compartment: number;
	Deck: number;
	Currency: string;
	Price: number;
}

interface SeatSelectionProps {
	seatData: any[]; // SeatDynamic structure
	passengers: any[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	selectedSeats: Record<string, SeatOption | null>; // Key: `${passengerIndex}-${segmentIndex}`
	onSelect: (
		passengerIndex: number,
		segmentIndex: number,
		seat: SeatOption | null
	) => void;
}

export default function SeatSelection({
	seatData,
	passengers,
	adultCount,
	childCount,
	infantCount,
	selectedSeats,
	onSelect,
}: SeatSelectionProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
	const [activePassengerIndex, setActivePassengerIndex] = useState(0);

	if (!seatData || seatData.length === 0) return null;

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

	// Helper to check if a seat is occupied
	const isOccupied = (seat: SeatOption) => seat.AvailablityType !== 1;

	// Helper to check if a seat is selected by ANY passenger (for visual indication)
	const isSeatSelected = (seat: SeatOption, segmentIndex: number) => {
		return Object.entries(selectedSeats).some(([key, selectedSeat]) => {
			const [, sIndex] = key.split("-");
			return (
				parseInt(sIndex) === segmentIndex &&
				selectedSeat?.Code === seat.Code &&
				selectedSeat?.RowNo === seat.RowNo
			);
		});
	};

	// Helper to check if a seat is selected by CURRENT passenger
	const isSeatSelectedByCurrent = (seat: SeatOption) => {
		const key = `${activePassengerIndex}-${activeSegmentIndex}`;
		const selectedSeat = selectedSeats[key];
		return (
			selectedSeat?.Code === seat.Code && selectedSeat?.RowNo === seat.RowNo
		);
	};

	// Helper to check if all passengers have seats selected for a segment
	const areAllSeatsSelected = (segmentIndex: number) => {
		for (let i = 0; i < passengers.length; i++) {
			const key = `${i}-${segmentIndex}`;
			if (!selectedSeats[key]) return false;
		}
		return true;
	};

	// Helper to move to next passenger without seat
	const moveToNextPassenger = () => {
		for (let i = 0; i < passengers.length; i++) {
			const key = `${i}-${activeSegmentIndex}`;
			if (!selectedSeats[key]) {
				setActivePassengerIndex(i);
				return;
			}
		}
		// If all have seats, stay on current
	};

	// Handle seat selection with sequential logic
	const handleSeatSelect = (
		passengerIndex: number,
		segmentIndex: number,
		seat: SeatOption | null
	) => {
		onSelect(passengerIndex, segmentIndex, seat);
		if (seat) {
			// Move to next passenger without seat after a short delay
			setTimeout(() => moveToNextPassenger(), 500);
		}
	};

	// Helper to get selected seats summary for a segment
	const getSelectedSeatsSummary = (segmentIndex: number) => {
		const selected = passengers
			.map((_, i) => selectedSeats[`${i}-${segmentIndex}`])
			.filter(Boolean);
		return selected.map((seat) => `${seat!.RowNo}${seat!.SeatNo}`).join(", ");
	};

	return (
		<div className="space-y-6">
			{seatData.map((segmentData, segmentIndex) => {
				const segmentSeat = segmentData.SegmentSeat?.[0];
				if (!segmentSeat) return null;

				const firstSeat = segmentSeat.RowSeats?.[0]?.Seats?.[0];
				const origin = firstSeat?.Origin || "Origin";
				const destination = firstSeat?.Destination || "Dest";
				const allSelected = areAllSeatsSelected(segmentIndex);
				const selectedSeatsSummary = getSelectedSeatsSummary(segmentIndex);

				return (
					<div key={segmentIndex} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
								{origin} → {destination}
							</span>
						</h4>

						<div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-gray-300 transition-colors">
							<div className="flex items-center gap-4">
								<div
									className={cn(
										"p-2 rounded-full",
										allSelected ? "bg-green-100" : "bg-gray-100"
									)}
								>
									<Armchair
										className={cn(
											"h-5 w-5",
											allSelected ? "text-green-600" : "text-gray-500"
										)}
									/>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-900">
										Seat Selection
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{allSelected
											? `Seats selected: ${selectedSeatsSummary}`
											: `${passengers.length} passengers • ${
													Object.values(selectedSeats).filter(
														(seat, i) =>
															seat &&
															Math.floor(i / passengers.length) === segmentIndex
													).length
											  } seats selected`}
									</p>
								</div>
							</div>
							<Button
								variant={allSelected ? "outline" : "default"}
								size="sm"
								onClick={() => {
									setActiveSegmentIndex(segmentIndex);
									setActivePassengerIndex(0); // Start with first passenger
									setIsModalOpen(true);
								}}
								className={cn(
									allSelected
										? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
										: "bg-blue-600 hover:bg-blue-700"
								)}
							>
								{allSelected ? "Change Seats" : "Select Seats"}
							</Button>
						</div>
					</div>
				);
			})}

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
					<DialogHeader className="px-6 py-4 border-b bg-white z-10 relative">
						<div className="flex items-start justify-between">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsModalOpen(false)}
								className="mb-2"
							>
								<X className="h-4 w-4" />
							</Button>
							<div className="flex-1 text-center">
								<DialogTitle className="mb-4">Select Seats</DialogTitle>
								{/* Passenger Selector */}
								<div className="flex flex-wrap gap-2 justify-center">
									{passengers.map((_, passengerIndex) => {
										const key = `${passengerIndex}-${activeSegmentIndex}`;
										const hasSeat = !!selectedSeats[key];
										return (
											<button
												key={passengerIndex}
												onClick={() => setActivePassengerIndex(passengerIndex)}
												className={cn(
													"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
													activePassengerIndex === passengerIndex
														? "bg-blue-100 border-blue-300 text-blue-900"
														: hasSeat
														? "bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
														: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
												)}
											>
												{hasSeat && <Check className="h-4 w-4" />}
												<span>{getPassengerLabel(passengerIndex)}</span>
												{hasSeat && (
													<span className="text-xs opacity-75">
														{selectedSeats[key]!.RowNo}
														{selectedSeats[key]!.SeatNo}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</DialogHeader>{" "}
					<div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
						{/* Seat Map Container */}
						<div className="flex-1 overflow-auto relative py-6">
							{/* Wings Visual - Absolute Positioned */}
							<div className="absolute top-1/3 left-0 w-full h-1/3 pointer-events-none opacity-8">
								<div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-200 transform -skew-y-6 origin-left"></div>
							</div>

							<div className="w-full max-w-[900px] mx-auto relative z-10 bg-transparent rounded-2xl py-8 px-4 min-h-[500px] overflow-visible">
								{/* Cockpit */}
								<div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/80 backdrop-blur-sm rounded-b-lg border border-gray-200 flex items-center justify-center shadow-sm z-20">
									<span className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">
										Cockpit
									</span>
								</div>

								{/* Wings (decorative) */}
								<div className="absolute -left-24 top-1/2 -translate-y-1/2 w-56 h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl transform -skew-y-6 rotate-6 opacity-30 pointer-events-none z-0" />
								<div className="absolute -right-24 top-1/2 -translate-y-1/2 w-56 h-16 bg-gradient-to-l from-gray-100 to-gray-50 rounded-xl transform skew-y-6 -rotate-6 opacity-30 pointer-events-none z-0" />

								{/* Fuselage content (rows) */}
								<div className="relative z-10 mx-auto max-w-[920px] bg-gradient-to-b from-sky-50 to-white rounded-3xl border border-gray-200 p-6 shadow-lg">
									<div className="space-y-3">
										{seatData[
											activeSegmentIndex
										]?.SegmentSeat?.[0]?.RowSeats?.map(
											(row: any, rowIndex: number) => (
												<div
													key={rowIndex}
													className="flex items-center gap-6 justify-center w-full"
												>
													{/* Left Group */}
													<div className="flex gap-2 items-center">
														{row.Seats.filter((s: any) =>
															s.SeatNo?.match(/[A-C]/)
														).map((seat: SeatOption) => (
															<SeatButton
																key={seat.Code}
																seat={seat}
																isSelected={isSeatSelectedByCurrent(seat)}
																isOccupied={isOccupied(seat)}
																isSelectedByOther={
																	isSeatSelected(seat, activeSegmentIndex) &&
																	!isSeatSelectedByCurrent(seat)
																}
																onClick={() =>
																	isSeatSelectedByCurrent(seat)
																		? handleSeatSelect(
																				activePassengerIndex,
																				activeSegmentIndex,
																				null
																		  )
																		: handleSeatSelect(
																				activePassengerIndex,
																				activeSegmentIndex,
																				seat
																		  )
																}
															/>
														))}
													</div>

													{/* Aisle Number */}
													<div className="w-8 text-center text-[11px] font-mono text-gray-400">
														{row.Seats[0]?.RowNo}
													</div>

													{/* Right Group */}
													<div className="flex gap-2 items-center">
														{row.Seats.filter(
															(s: any) => !s.SeatNo?.match(/[A-C]/)
														).map((seat: SeatOption) => (
															<SeatButton
																key={seat.Code}
																seat={seat}
																isSelected={isSeatSelectedByCurrent(seat)}
																isOccupied={isOccupied(seat)}
																isSelectedByOther={
																	isSeatSelected(seat, activeSegmentIndex) &&
																	!isSeatSelectedByCurrent(seat)
																}
																onClick={() =>
																	isSeatSelectedByCurrent(seat)
																		? handleSeatSelect(
																				activePassengerIndex,
																				activeSegmentIndex,
																				null
																		  )
																		: handleSeatSelect(
																				activePassengerIndex,
																				activeSegmentIndex,
																				seat
																		  )
																}
															/>
														))}
													</div>
												</div>
											)
										)}
									</div>

									{/* Tail (subtle) */}
									<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11/12 max-w-[880px] h-8 bg-gray-50 rounded-t-2xl border-t border-gray-100 pointer-events-none z-0" />
								</div>
							</div>
						</div>

						{/* Footer Legend & Pricing (moved to bottom) */}
						<div className="bg-white border-t p-4 z-20 relative">
							<div className="max-w-[1100px] mx-auto px-2">
								<div className="flex flex-col gap-4">
									{/* Confirm Button Section */}
									<div className="flex justify-center">
										<Button
											onClick={() => setIsModalOpen(false)}
											disabled={!areAllSeatsSelected(activeSegmentIndex)}
											className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 px-8 py-2"
											size="lg"
										>
											{areAllSeatsSelected(activeSegmentIndex)
												? "Confirm Seats"
												: "Select All Seats"}
										</Button>
									</div>

									{/* Legend and Pricing Row */}
									<div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-semibold mb-3 text-gray-900">
												Seat Legend
											</h3>
											<div className="flex flex-wrap items-center gap-2">
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 rounded border border-gray-300 bg-white flex-shrink-0" />
													<span className="text-xs text-gray-600">Free</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 rounded border border-blue-300 bg-blue-50 flex-shrink-0" />
													<span className="text-xs text-gray-600">Paid</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 rounded bg-green-500 border border-green-600 flex-shrink-0" />
													<span className="text-xs text-gray-600">
														Selected
													</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
														<X className="h-3 w-3 text-gray-400" />
													</div>
													<span className="text-xs text-gray-600">
														Occupied
													</span>
												</div>
											</div>
										</div>
										<div className="w-full md:w-48 flex-shrink-0 mx-auto">
											<div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
												<div className="flex items-center justify-center">
													<h4 className="font-semibold text-blue-900 flex items-center gap-3 text-xs">
														<TooltipProvider delayDuration={0}>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Info className="h-4 w-4 cursor-help text-blue-700 hover:text-blue-900" />
																</TooltipTrigger>
																<TooltipContent
																	side="top"
																	className="bg-gray-900 text-white border-0 max-w-xs"
																>
																	<p className="text-xs">
																		Prices vary by location. Front rows and
																		emergency exits may cost more. Hover over a
																		seat to see the price.
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
														<span>Seat Pricing</span>
													</h4>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function SeatButton({
	seat,
	isSelected,
	isOccupied,
	isSelectedByOther,
	onClick,
}: {
	seat: SeatOption;
	isSelected: boolean;
	isOccupied: boolean;
	isSelectedByOther: boolean;
	onClick: () => void;
}) {
	const isPaid = seat.Price > 0;

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						disabled={isOccupied || isSelectedByOther}
						onClick={onClick}
						className={cn(
							"w-10 h-10 rounded-md border flex items-center justify-center text-[11px] transition-transform duration-150 relative focus:outline-none focus:ring-2 focus:ring-offset-1",
							isOccupied || isSelectedByOther
								? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
								: isSelected
								? "bg-green-500 border-green-600 text-white shadow-md scale-105 z-10"
								: isPaid
								? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 hover:border-blue-300 hover:scale-105"
								: "bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400 hover:scale-105"
						)}
					>
						{isOccupied || isSelectedByOther ? (
							<X className="h-3 w-3" />
						) : (
							seat.SeatNo
						)}
					</button>
				</TooltipTrigger>
				<TooltipContent side="top" className="bg-gray-900 text-white border-0">
					<div className="text-xs">
						<p className="font-bold mb-1">
							Seat {seat.RowNo}
							{seat.SeatNo}
						</p>
						<p className="opacity-90">
							{isOccupied
								? "Occupied"
								: seat.Price > 0
								? `₹${seat.Price.toLocaleString("en-IN")}`
								: "Free"}
						</p>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
