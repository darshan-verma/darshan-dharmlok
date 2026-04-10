"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PassengerDetail } from "@/types/tbo";
import type { TripjackSeatMapResponse } from "@/types/tripjackFlight";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Briefcase, Utensils, Armchair, Star, Loader2 } from "lucide-react";
import type { TripjackFlatSegment, TripjackSsrPickState } from "@/lib/tripjackSsr";
import { tripjackHasCatalogSsr } from "@/lib/tripjackSsr";
import {
	tripjackBaggageDataFromSegments,
	tripjackMealDataFromSegments,
	tripjackSpecialServiceDataFromSegments,
	tripjackCatalogItemToBaggageOption,
	tripjackCatalogItemToMealOption,
	tripjackFindCatalogItem,
} from "@/lib/tripjackSsr";
import type { TripjackSsrCatalogItem } from "@/types/tripjackFlight";
import BaggageSelection, { type BaggageOption } from "./BaggageSelection";
import MealSelection, { type MealOption } from "./MealSelection";
import SpecialServiceSelection, {
	type SpecialServiceOption,
} from "./SpecialServiceSelection";
import TripjackSeatSelection from "./TripjackSeatSelection";

function selKey(pax: number, segmentIndex: number): string {
	return `${pax}-${segmentIndex}`;
}

interface TripjackSSRSelectionProps {
	bookingId: string;
	segments: TripjackFlatSegment[];
	adultCount: number;
	childCount: number;
	infantCount: number;
	passengers: PassengerDetail[];
	picks: TripjackSsrPickState;
	onPicksChange: (next: TripjackSsrPickState) => void;
}

export default function TripjackSSRSelection({
	bookingId,
	segments,
	adultCount,
	childCount,
	infantCount,
	passengers,
	picks,
	onPicksChange,
}: TripjackSSRSelectionProps) {
	const [seatMap, setSeatMap] = useState<TripjackSeatMapResponse | null>(null);
	const [seatMapLoading, setSeatMapLoading] = useState(false);
	const [seatMapNote, setSeatMapNote] = useState<string | null>(null);

	const totalPax = adultCount + childCount + infantCount;

	const baggageData = useMemo(() => tripjackBaggageDataFromSegments(segments), [segments]);
	const mealData = useMemo(() => tripjackMealDataFromSegments(segments), [segments]);
	const specialServicesData = useMemo(
		() => tripjackSpecialServiceDataFromSegments(segments),
		[segments],
	);

	const hasBaggage = baggageData.some((b) => b.length > 0);
	const hasMeals = mealData.some((m) => m.length > 0);
	const hasServices = specialServicesData.some(
		(s) => (s.SegmentSpecialService?.[0]?.SSRService?.length ?? 0) > 0,
	);

	const hasSeatMapData = useMemo(() => {
		const raw = seatMap?.tripSeatMap?.tripSeat;
		return raw ? Object.keys(raw).length > 0 : false;
	}, [seatMap]);

	const hasCatalog = tripjackHasCatalogSsr(segments);

	useEffect(() => {
		if (!bookingId.trim()) return;
		let cancelled = false;
		(async () => {
			setSeatMapLoading(true);
			setSeatMapNote(null);
			try {
				const res = await fetch("/api/travel/tripjack-flight/seat-map", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId }),
				});
				const json = await res.json();
				if (cancelled) return;
				if (!res.ok || !json?.success) {
					setSeatMap(null);
					setSeatMapNote(
						typeof json?.error === "string"
							? json.error
							: "Seat map not available for this itinerary.",
					);
					return;
				}
				setSeatMap(json.data as TripjackSeatMapResponse);
			} catch {
				if (!cancelled) {
					setSeatMap(null);
					setSeatMapNote("Could not load seat map.");
				}
			} finally {
				if (!cancelled) setSeatMapLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [bookingId]);

	const updatePick = useCallback(
		(mutate: (draft: TripjackSsrPickState) => void) => {
			const draft: TripjackSsrPickState = {
				baggage: { ...picks.baggage },
				meals: { ...picks.meals },
				extraSeatServices: { ...picks.extraSeatServices },
				physicalSeats: { ...picks.physicalSeats },
			};
			mutate(draft);
			onPicksChange(draft);
		},
		[picks, onPicksChange],
	);

	const selectedBaggage = useMemo(() => {
		const o: Record<string, BaggageOption | null> = {};
		for (let p = 0; p < totalPax; p++) {
			for (let si = 0; si < segments.length; si++) {
				const seg = segments[si];
				const k = selKey(p, seg.segmentIndex);
				const item = picks.baggage[k];
				const key = `${p}-${si}`;
				o[key] = item
					? tripjackCatalogItemToBaggageOption(item, seg.origin, seg.dest)
					: null;
			}
		}
		return o;
	}, [picks.baggage, segments, totalPax]);

	const selectedMeals = useMemo(() => {
		const o: Record<string, MealOption | null> = {};
		for (let p = 0; p < totalPax; p++) {
			for (let si = 0; si < segments.length; si++) {
				const seg = segments[si];
				const k = selKey(p, seg.segmentIndex);
				const item = picks.meals[k];
				const key = `${p}-${si}`;
				o[key] = item
					? tripjackCatalogItemToMealOption(item, seg.origin, seg.dest)
					: null;
			}
		}
		return o;
	}, [picks.meals, segments, totalPax]);

	const selectedServices = useMemo(() => {
		const o: Record<string, SpecialServiceOption[]> = {};
		for (let p = 0; p < totalPax; p++) {
			for (let si = 0; si < segments.length; si++) {
				const seg = segments[si];
				const k = selKey(p, seg.segmentIndex);
				const ex = picks.extraSeatServices[k];
				const key = `${p}-${si}`;
				if (ex) {
					o[key] = [
						{
							Origin: seg.origin,
							Destination: seg.dest,
							DepartureTime: "",
							AirlineCode: "",
							FlightNumber: "",
							Code: ex.code,
							ServiceType: 0,
							Text: ex.desc,
							WayType: 0,
							Currency: "INR",
							Price: ex.amount,
						},
					];
				} else o[key] = [];
			}
		}
		return o;
	}, [picks.extraSeatServices, segments, totalPax]);

	const handleBaggageSelect = (
		passengerIndex: number,
		segmentArrayIndex: number,
		option: BaggageOption | null,
	) => {
		const seg = segments[segmentArrayIndex];
		if (!seg) return;
		const k = selKey(passengerIndex, seg.segmentIndex);
		if (!option) {
			updatePick((d) => {
				d.baggage = { ...d.baggage, [k]: null };
			});
			return;
		}
		const catalog = tripjackFindCatalogItem(
			segments,
			segmentArrayIndex,
			"BAGGAGE",
			option.Code,
		);
		if (catalog) {
			updatePick((d) => {
				d.baggage = { ...d.baggage, [k]: catalog };
			});
		}
	};

	const handleMealSelect = (
		passengerIndex: number,
		segmentArrayIndex: number,
		option: MealOption | null,
	) => {
		const seg = segments[segmentArrayIndex];
		if (!seg) return;
		const k = selKey(passengerIndex, seg.segmentIndex);
		if (!option) {
			updatePick((d) => {
				d.meals = { ...d.meals, [k]: null };
			});
			return;
		}
		const catalog = tripjackFindCatalogItem(segments, segmentArrayIndex, "MEAL", option.Code);
		if (catalog) {
			updatePick((d) => {
				d.meals = { ...d.meals, [k]: catalog };
			});
		}
	};

	const handleServiceSelect = (
		passengerIndex: number,
		segmentArrayIndex: number,
		service: SpecialServiceOption,
		isChecked: boolean,
	) => {
		const seg = segments[segmentArrayIndex];
		if (!seg) return;
		const k = selKey(passengerIndex, seg.segmentIndex);
		const catalog: TripjackSsrCatalogItem | undefined = tripjackFindCatalogItem(
			segments,
			segmentArrayIndex,
			"SEAT",
			service.Code,
		);
		updatePick((d) => {
			if (isChecked && catalog) {
				d.extraSeatServices = { ...d.extraSeatServices, [k]: catalog };
				d.physicalSeats = { ...d.physicalSeats, [k]: null };
			} else {
				d.extraSeatServices = { ...d.extraSeatServices, [k]: null };
			}
		});
	};

	const onPhysicalSelect = (
		passengerIndex: number,
		segmentIndex: number,
		seat: { code: string; amount: number } | null,
	) => {
		const k = selKey(passengerIndex, segmentIndex);
		updatePick((d) => {
			d.physicalSeats = { ...d.physicalSeats, [k]: seat };
			if (seat) {
				d.extraSeatServices = { ...d.extraSeatServices, [k]: null };
			}
		});
	};

	if (!segments.length || !bookingId.trim()) {
		return null;
	}

	const showSeatAccordion = seatMapLoading || hasSeatMapData || seatMapNote;

	const nothingToShow =
		!hasCatalog && !showSeatAccordion && !hasBaggage && !hasMeals && !hasServices;

	if (nothingToShow) {
		return null;
	}

	if (seatMapLoading && !hasCatalog) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Accordion type="multiple" className="w-full space-y-4" defaultValue={[]}>
				{hasBaggage && (
					<AccordionItem value="baggage" className="border rounded-lg px-4 bg-white shadow-sm">
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-blue-100 p-2 rounded-full">
									<Briefcase className="h-5 w-5 text-blue-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Baggage{" "}
										<span className="text-muted-foreground font-normal">(Optional)</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedBaggage).some(Boolean) ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedBaggage).reduce(
													(acc, curr) => acc + (curr?.Weight || 0),
													0,
												)}
												kg added (₹
												{Object.values(selectedBaggage)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Add extra baggage if needed"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-6">
							<BaggageSelection
								baggageData={baggageData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedBaggage={selectedBaggage}
								onSelect={handleBaggageSelect}
							/>
						</AccordionContent>
					</AccordionItem>
				)}

				{hasMeals && (
					<AccordionItem value="meals" className="border rounded-lg px-4 bg-white shadow-sm">
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-orange-100 p-2 rounded-full">
									<Utensils className="h-5 w-5 text-orange-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Meals{" "}
										<span className="text-muted-foreground font-normal">(Optional)</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedMeals).filter(Boolean).length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedMeals).filter(Boolean).length} meals selected
												(₹
												{Object.values(selectedMeals)
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Pre-book your meals"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-6">
							<MealSelection
								mealData={mealData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedMeals={selectedMeals}
								onSelect={handleMealSelect}
							/>
						</AccordionContent>
					</AccordionItem>
				)}

				{showSeatAccordion && (
					<AccordionItem value="seats" className="border rounded-lg px-4 bg-white shadow-sm">
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-purple-100 p-2 rounded-full">
									<Armchair className="h-5 w-5 text-purple-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Seats{" "}
										<span className="text-muted-foreground font-normal">(Optional)</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal flex items-center gap-2">
										{seatMapLoading && (
											<Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
										)}
										{seatMapNote && !hasSeatMapData ? (
											<span>{seatMapNote}</span>
										) : (
											"Choose your preferred seats"
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							{seatMapLoading && !hasSeatMapData ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
								</div>
							) : seatMap && hasSeatMapData ? (
								<TripjackSeatSelection
									segments={segments}
									seatMap={seatMap}
									adultCount={adultCount}
									childCount={childCount}
									physicalSeats={picks.physicalSeats}
									onPhysicalSelect={onPhysicalSelect}
								/>
							) : (
								<p className="text-sm text-muted-foreground text-center py-6">{seatMapNote}</p>
							)}
						</AccordionContent>
					</AccordionItem>
				)}

				{hasServices && (
					<AccordionItem value="services" className="border rounded-lg px-4 bg-white shadow-sm">
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-4 w-full">
								<div className="bg-yellow-100 p-2 rounded-full">
									<Star className="h-5 w-5 text-yellow-600" />
								</div>
								<div className="flex flex-col items-start flex-1">
									<div className="font-semibold text-base">
										Priority Services{" "}
										<span className="text-muted-foreground font-normal">(Optional)</span>
									</div>
									<div className="text-sm text-muted-foreground font-normal">
										{Object.values(selectedServices).flat().length > 0 ? (
											<span className="text-blue-600 font-medium">
												{Object.values(selectedServices).flat().length} services selected (₹
												{Object.values(selectedServices)
													.flat()
													.reduce((acc, curr) => acc + (curr?.Price || 0), 0)
													.toLocaleString()}
												)
											</span>
										) : (
											"Wheelchair, Priority Check-in, extra seat options, etc."
										)}
									</div>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							<SpecialServiceSelection
								serviceData={specialServicesData}
								passengers={passengers}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								selectedServices={selectedServices}
								onSelect={handleServiceSelect}
							/>
						</AccordionContent>
					</AccordionItem>
				)}
			</Accordion>
		</div>
	);
}
