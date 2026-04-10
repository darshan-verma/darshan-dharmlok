"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TripjackSeatMapResponse, TripjackSeatMapSeatInfo } from "@/types/tripjackFlight";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Armchair, X, Check, Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TripjackFlatSegment } from "@/lib/tripjackSsr";

function selKey(pax: number, segmentIndex: number): string {
	return `${pax}-${segmentIndex}`;
}

function seatLetter(s: TripjackSeatMapSeatInfo): string {
	return (s.seatNo || s.code || "?").replace(/^\d+/, "") || "?";
}

function groupTripjackSeatsByRow(seats: TripjackSeatMapSeatInfo[]) {
	const rows: Record<number, TripjackSeatMapSeatInfo[]> = {};
	for (const s of seats) {
		const r =
			s.seatPosition?.row ??
			parseInt((s.seatNo || s.code || "").match(/^\d+/)?.[0] || "0", 10);
		if (!rows[r]) rows[r] = [];
		rows[r].push(s);
	}
	for (const k of Object.keys(rows)) {
		rows[Number(k)].sort(
			(a, b) => (a.seatPosition?.column ?? 0) - (b.seatPosition?.column ?? 0),
		);
	}
	return rows;
}

function isLeftBlock(s: TripjackSeatMapSeatInfo): boolean {
	const c = s.seatPosition?.column;
	if (c != null) return c <= 3;
	return /[ABC]/.test(seatLetter(s));
}

interface TripjackSeatSelectionProps {
	segments: TripjackFlatSegment[];
	seatMap: TripjackSeatMapResponse | null;
	adultCount: number;
	childCount: number;
	physicalSeats: Record<string, { code: string; amount: number } | null>;
	onPhysicalSelect: (
		passengerIndex: number,
		segmentIndex: number,
		seat: { code: string; amount: number } | null,
	) => void;
}

export default function TripjackSeatSelection({
	segments,
	seatMap,
	adultCount,
	childCount,
	physicalSeats,
	onPhysicalSelect,
}: TripjackSeatSelectionProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeListIndex, setActiveListIndex] = useState(0);
	const [activePassengerIndex, setActivePassengerIndex] = useState(0);

	const seatPaxCount = adultCount + childCount;

	const seatSegments = useMemo(() => {
		return segments.filter(
			(s) => (seatMap?.tripSeatMap?.tripSeat?.[s.segmentKey]?.sInfo?.length ?? 0) > 0,
		);
	}, [segments, seatMap]);

	const getPassengerLabel = (passengerIndex: number) => {
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
		const childIndex = passengerIndex - adultCount;
		if (passengerIndex < adultCount + childCount) {
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
		const infantIndex = passengerIndex - adultCount - childCount;
		return `${infantIndex + 1}${
			infantIndex === 0
				? "st"
				: infantIndex === 1
					? "nd"
					: infantIndex === 2
						? "rd"
						: "th"
		} Infant`;
	};

	const activeSeg = seatSegments[activeListIndex];
	const activeSegmentIndex = activeSeg?.segmentIndex ?? 0;

	const isOccupied = (seat: TripjackSeatMapSeatInfo) => seat.isBooked === true;

	const isSeatSelectedByCurrent = (seat: TripjackSeatMapSeatInfo) => {
		const key = selKey(activePassengerIndex, activeSegmentIndex);
		const c = physicalSeats[key]?.code;
		const code = seat.code || seat.seatNo;
		return !!c && !!code && c === code;
	};

	const isSeatSelectedByOther = (seat: TripjackSeatMapSeatInfo) => {
		const code = seat.code || seat.seatNo;
		if (!code) return false;
		for (let p = 0; p < seatPaxCount; p++) {
			if (p === activePassengerIndex) continue;
			const k = selKey(p, activeSegmentIndex);
			if (physicalSeats[k]?.code === code) return true;
		}
		return false;
	};

	const areAllSeatsSelected = (segmentIndex: number) => {
		for (let i = 0; i < seatPaxCount; i++) {
			if (!physicalSeats[selKey(i, segmentIndex)]) return false;
		}
		return true;
	};

	const getSelectedSeatsSummary = (segmentIndex: number) => {
		const parts: string[] = [];
		for (let i = 0; i < seatPaxCount; i++) {
			const v = physicalSeats[selKey(i, segmentIndex)];
			if (v?.code) parts.push(v.code);
		}
		return parts.join(", ");
	};

	const handleSeatSelect = (
		passengerIndex: number,
		segmentIndex: number,
		seat: TripjackSeatMapSeatInfo | null,
	) => {
		if (!seat) {
			onPhysicalSelect(passengerIndex, segmentIndex, null);
			return;
		}
		const code = seat.code || seat.seatNo || "";
		if (!code || isOccupied(seat)) return;
		const amount = typeof seat.amount === "number" ? seat.amount : 0;
		const key = selKey(passengerIndex, segmentIndex);
		const cur = physicalSeats[key];
		if (cur?.code === code) {
			onPhysicalSelect(passengerIndex, segmentIndex, null);
			return;
		}
		onPhysicalSelect(passengerIndex, segmentIndex, { code, amount });
	};

	if (!seatMap) {
		return null;
	}
	if (!seatSegments.length) {
		const hasKeys =
			seatMap.tripSeatMap?.tripSeat &&
			Object.keys(seatMap.tripSeatMap.tripSeat).length > 0;
		if (!hasKeys) return null;
		return (
			<p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-gray-50">
				Seat map was returned but does not match this itinerary&apos;s segments.
			</p>
		);
	}

	return (
		<div className="space-y-6">
			{seatSegments.map((seg, listIdx) => {
				const sList = seatMap.tripSeatMap?.tripSeat?.[seg.segmentKey]?.sInfo ?? [];
				if (!sList.length) return null;

				const allSelected = areAllSeatsSelected(seg.segmentIndex);
				const selectedSeatsSummary = getSelectedSeatsSummary(seg.segmentIndex);

				return (
					<div key={seg.segmentKey} className="space-y-4">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
								{seg.origin} → {seg.dest}
							</span>
						</h4>

						<div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-gray-300 transition-colors">
							<div className="flex items-center gap-4">
								<div
									className={cn(
										"p-2 rounded-full",
										allSelected ? "bg-green-100" : "bg-gray-100",
									)}
								>
									<Armchair
										className={cn(
											"h-5 w-5",
											allSelected ? "text-green-600" : "text-gray-500",
										)}
									/>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-900">Seat Selection</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{allSelected
											? `Seats selected: ${selectedSeatsSummary}`
											: `${seatPaxCount} passengers • ${seatPaxCount > 0 ? Array.from({ length: seatPaxCount }, (_, i) => physicalSeats[selKey(i, seg.segmentIndex)]).filter(Boolean).length : 0} seats selected`}
									</p>
								</div>
							</div>
							<Button
								variant={allSelected ? "outline" : "default"}
								size="sm"
								onClick={() => {
									setActiveListIndex(listIdx);
									setActivePassengerIndex(0);
									setIsModalOpen(true);
								}}
								className={cn(
									allSelected
										? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
										: "bg-blue-600 hover:bg-blue-700",
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
								<div className="flex flex-wrap gap-2 justify-center">
									{Array.from({ length: seatPaxCount }, (_, passengerIndex) => {
										const key = selKey(passengerIndex, activeSegmentIndex);
										const hasSeat = !!physicalSeats[key];
										return (
											<button
												key={passengerIndex}
												type="button"
												onClick={() => setActivePassengerIndex(passengerIndex)}
												className={cn(
													"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
													activePassengerIndex === passengerIndex
														? "bg-blue-100 border-blue-300 text-blue-900"
														: hasSeat
															? "bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
															: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
												)}
											>
												{hasSeat && <Check className="h-4 w-4" />}
												<span>{getPassengerLabel(passengerIndex)}</span>
												{hasSeat && (
													<span className="text-xs opacity-75">
														{physicalSeats[key]!.code}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</DialogHeader>
					<div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
						<div className="flex-1 overflow-auto relative py-6">
							<div className="absolute top-1/3 left-0 w-full h-1/3 pointer-events-none opacity-8">
								<div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-200 transform -skew-y-6 origin-left" />
							</div>
							<div className="w-full max-w-[900px] mx-auto relative z-10 bg-transparent rounded-2xl py-8 px-4 min-h-[500px] overflow-visible">
								<div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/80 backdrop-blur-sm rounded-b-lg border border-gray-200 flex items-center justify-center shadow-sm z-20">
									<span className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">
										Cockpit
									</span>
								</div>
								<div className="absolute -left-24 top-1/2 -translate-y-1/2 w-56 h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl transform -skew-y-6 rotate-6 opacity-30 pointer-events-none z-0" />
								<div className="absolute -right-24 top-1/2 -translate-y-1/2 w-56 h-16 bg-gradient-to-l from-gray-100 to-gray-50 rounded-xl transform skew-y-6 -rotate-6 opacity-30 pointer-events-none z-0" />

								<div className="relative z-10 mx-auto max-w-[920px] bg-gradient-to-b from-sky-50 to-white rounded-3xl border border-gray-200 p-6 shadow-lg">
									<div className="space-y-3">
										{(() => {
											const currentSeg = seatSegments[activeListIndex];
											const seats =
												seatMap.tripSeatMap?.tripSeat?.[currentSeg?.segmentKey || ""]?.sInfo ??
												[];
											const rows = groupTripjackSeatsByRow(seats);
											const sortedRows = Object.keys(rows)
												.map(Number)
												.sort((a, b) => a - b);

											return sortedRows.map((rowNum) => (
												<div
													key={rowNum}
													className="flex items-center gap-6 justify-center w-full"
												>
													<div className="flex gap-2 items-center">
														{rows[rowNum]
															.filter((s) => isLeftBlock(s))
															.map((seat: TripjackSeatMapSeatInfo) => (
																<TripjackSeatButton
																	key={seat.code || seat.seatNo}
																	seat={seat}
																	isSelected={isSeatSelectedByCurrent(seat)}
																	isOccupied={isOccupied(seat)}
																	isSelectedByOther={isSeatSelectedByOther(seat)}
																	onClick={() =>
																		isSeatSelectedByCurrent(seat)
																			? handleSeatSelect(
																					activePassengerIndex,
																					activeSegmentIndex,
																					null,
																				)
																			: handleSeatSelect(
																					activePassengerIndex,
																					activeSegmentIndex,
																					seat,
																				)
																	}
																/>
															))}
													</div>
													<div className="w-8 text-center text-[11px] font-mono text-gray-400">
														{rowNum}
													</div>
													<div className="flex gap-2 items-center">
														{rows[rowNum]
															.filter((s) => !isLeftBlock(s))
															.map((seat: TripjackSeatMapSeatInfo) => (
																<TripjackSeatButton
																	key={seat.code || seat.seatNo}
																	seat={seat}
																	isSelected={isSeatSelectedByCurrent(seat)}
																	isOccupied={isOccupied(seat)}
																	isSelectedByOther={isSeatSelectedByOther(seat)}
																	onClick={() =>
																		isSeatSelectedByCurrent(seat)
																			? handleSeatSelect(
																					activePassengerIndex,
																					activeSegmentIndex,
																					null,
																				)
																			: handleSeatSelect(
																					activePassengerIndex,
																					activeSegmentIndex,
																					seat,
																				)
																	}
																/>
															))}
													</div>
												</div>
											));
										})()}
									</div>
									<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11/12 max-w-[880px] h-8 bg-gray-50 rounded-t-2xl border-t border-gray-100 pointer-events-none z-0" />
								</div>
							</div>
						</div>

						<div className="bg-white border-t p-4 z-20 relative">
							<div className="max-w-[1100px] mx-auto px-2">
								<div className="flex flex-col gap-4">
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
									<div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-semibold mb-3 text-gray-900">Seat Legend</h3>
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
													<span className="text-xs text-gray-600">Selected</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
														<X className="h-3 w-3 text-gray-400" />
													</div>
													<span className="text-xs text-gray-600">Occupied / taken</span>
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
																		Prices vary by seat. Hover a seat for the amount.
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

function TripjackSeatButton({
	seat,
	isSelected,
	isOccupied,
	isSelectedByOther,
	onClick,
}: {
	seat: TripjackSeatMapSeatInfo;
	isSelected: boolean;
	isOccupied: boolean;
	isSelectedByOther: boolean;
	onClick: () => void;
}) {
	const amount = typeof seat.amount === "number" ? seat.amount : 0;
	const isPaid = amount > 0;
	const label = seatLetter(seat);
	const full = seat.seatNo || seat.code || label;

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
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
										: "bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400 hover:scale-105",
						)}
					>
						{isOccupied || isSelectedByOther ? (
							<X className="h-3 w-3" />
						) : (
							label
						)}
					</button>
				</TooltipTrigger>
				<TooltipContent side="top" className="bg-gray-900 text-white border-0">
					<div className="text-xs">
						<p className="font-bold mb-1">Seat {full}</p>
						<p className="opacity-90">
							{isOccupied
								? "Occupied"
								: isSelectedByOther
									? "Taken"
									: isPaid
										? `₹${amount.toLocaleString("en-IN")}`
										: "Free"}
						</p>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
