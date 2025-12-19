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
import { Armchair, Info, X } from "lucide-react";
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
	selectedSeats,
	onSelect,
}: SeatSelectionProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
	const [activePassengerIndex, setActivePassengerIndex] = useState(0);

	if (!seatData || seatData.length === 0) return null;

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

	return (
		<div className="space-y-6">
			{seatData.map((segmentData, segmentIndex) => {
				const segmentSeat = segmentData.SegmentSeat?.[0];
				if (!segmentSeat) return null;

				const firstSeat = segmentSeat.RowSeats?.[0]?.Seats?.[0];
				const origin = firstSeat?.Origin || "Origin";
				const destination = firstSeat?.Destination || "Dest";

				return (
					<div key={segmentIndex} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
								{origin} → {destination}
							</span>
						</h4>

						<div className="grid grid-cols-1 gap-4">
							{passengers.map((passenger, passengerIndex) => {
								const key = `${passengerIndex}-${segmentIndex}`;
								const selected = selectedSeats[key];

								return (
									<div
										key={passengerIndex}
										className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-gray-300 transition-colors"
									>
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"p-2 rounded-full",
													selected ? "bg-green-100" : "bg-gray-100"
												)}
											>
												<Armchair
													className={cn(
														"h-5 w-5",
														selected ? "text-green-600" : "text-gray-500"
													)}
												/>
											</div>
											<div>
												<p className="text-sm font-semibold text-gray-900">
													{passenger.firstName} {passenger.lastName}
												</p>
												<p className="text-xs text-muted-foreground mt-0.5">
													{selected
														? `Seat ${selected.RowNo}${selected.SeatNo} • ₹${selected.Price}`
														: "No seat selected"}
												</p>
											</div>
										</div>
										<Button
											variant={selected ? "outline" : "default"}
											size="sm"
											onClick={() => {
												setActivePassengerIndex(passengerIndex);
												setActiveSegmentIndex(segmentIndex);
												setIsModalOpen(true);
											}}
											className={cn(
												selected
													? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
													: "bg-blue-600 hover:bg-blue-700"
											)}
										>
											{selected ? "Change Seat" : "Select Seat"}
										</Button>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
					<DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between bg-white z-10">
						<DialogTitle>
							Select Seat for {passengers[activePassengerIndex]?.firstName}
						</DialogTitle>
					</DialogHeader>

					<div className="flex-1 flex overflow-hidden bg-gray-50">
						{/* Seat Map Container */}
						<div className="flex-1 overflow-y-auto relative flex justify-center py-10">
							{/* Wings Visual - Absolute Positioned */}
							<div className="absolute top-1/3 left-0 w-full h-1/3 pointer-events-none opacity-10">
								<div className="w-full h-full bg-gray-400 transform skew-y-6 origin-left"></div>
							</div>

							<div className="w-full max-w-[380px] relative z-10 bg-white rounded-[40px] shadow-xl border border-gray-200 py-12 px-6 min-h-[600px]">
								{/* Cockpit */}
								<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gray-100 rounded-b-3xl border-b border-x border-gray-200 flex items-center justify-center mb-8">
									<span className="text-[10px] font-bold text-gray-400 tracking-widest">
										COCKPIT
									</span>
								</div>

								{/* Rows */}
								<div className="space-y-2 mt-8">
									{seatData[
										activeSegmentIndex
									]?.SegmentSeat?.[0]?.RowSeats?.map(
										(row: any, rowIndex: number) => (
											<div
												key={rowIndex}
												className="flex justify-between items-center gap-4"
											>
												{/* Left Group */}
												<div className="flex gap-1">
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
																onSelect(
																	activePassengerIndex,
																	activeSegmentIndex,
																	seat
																)
															}
														/>
													))}
												</div>

												{/* Aisle Number */}
												<div className="w-6 text-center text-[10px] font-mono text-gray-300">
													{row.Seats[0]?.RowNo}
												</div>

												{/* Right Group */}
												<div className="flex gap-1">
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
																onSelect(
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

								{/* Tail */}
								<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-12 bg-gray-50 rounded-b-[40px] border-t border-gray-100"></div>
							</div>
						</div>

						{/* Sidebar Legend & Info */}
						<div className="w-80 bg-white border-l p-6 overflow-y-auto">
							<div className="space-y-8">
								<div>
									<h3 className="font-semibold mb-4 text-gray-900">
										Seat Legend
									</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 rounded border border-gray-300 bg-white" />
											<span className="text-xs text-gray-600">Free</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 rounded border border-blue-300 bg-blue-50" />
											<span className="text-xs text-gray-600">Paid</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 rounded bg-green-500 border border-green-600" />
											<span className="text-xs text-gray-600">Selected</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
												<X className="h-3 w-3 text-gray-400" />
											</div>
											<span className="text-xs text-gray-600">Occupied</span>
										</div>
									</div>
								</div>

								<div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
									<h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm">
										<Info className="h-4 w-4" />
										Seat Pricing
									</h4>
									<p className="text-xs text-blue-700 leading-relaxed">
										Prices vary by location. Front rows and emergency exits may
										cost more. Hover over a seat to see the price.
									</p>
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
							"w-9 h-9 rounded-md border flex items-center justify-center text-[10px] transition-all relative",
							isOccupied || isSelectedByOther
								? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
								: isSelected
								? "bg-green-500 border-green-600 text-white shadow-sm scale-105 z-10"
								: isPaid
								? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 hover:border-blue-300"
								: "bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400"
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
