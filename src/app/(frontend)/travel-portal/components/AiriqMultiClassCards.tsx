"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import { TrendingUp, Loader2 } from "lucide-react";
import type { FlightResult } from "@/types/tbo";
import type {
	AiriqGetMultiClassAvailDetail,
	AiriqGetMultiClassClass,
	AiriqGetMultiClassFareResponse,
} from "@/types/airiq";
import { toast } from "@/lib/toast";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";

export type MulticlassCardItem = AiriqGetMultiClassClass & {
	origin: string;
	destination: string;
	carrierCode: string;
	flightNumber: string;
};

interface AiriqMultiClassCardsProps {
	flight: FlightResult;
	traceId: string;
	resultIndex: string;
	returnFlight?: FlightResult | null;
	adultCount: number;
	childCount: number;
	infantCount: number;
	/** Doc §17: Availability (search) Trackid — not Pricing Trackid. */
	availabilityTrackid?: string | null;
	onSelectFare?: (response: AiriqGetMultiClassFareResponse) => void;
}

export default function AiriqMultiClassCards({
	flight,
	traceId,
	resultIndex,
	returnFlight,
	adultCount,
	childCount,
	infantCount,
	availabilityTrackid,
	onSelectFare,
}: AiriqMultiClassCardsProps) {
	const [loading, setLoading] = useState(true);
	const [classes, setClasses] = useState<MulticlassCardItem[]>([]);
	const [priceLoading, setPriceLoading] = useState<string | null>(null);
	const [priceByClass, setPriceByClass] = useState<Record<string, { grossAmount: number; currency: string; response: AiriqGetMultiClassFareResponse }>>({});
	const [error, setError] = useState<string | null>(null);

	const segments = Array.isArray(flight.Segments)
		? flight.Segments.flatMap((g) => (Array.isArray(g) ? g : [g]))
		: [];
	const firstSegment = segments[0] || null;

	useEffect(() => {
		if (!availabilityTrackid) {
			setLoading(false);
			setClasses([]);
			return;
		}
		let cancelled = false;
		async function fetchMultiClass() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/travel/airiq/multi-class", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						traceId,
						resultIndex,
						flight,
						returnFlight: returnFlight || null,
						adultCount,
						childCount,
						infantCount,
					}),
				});
				const data = await res.json();
				if (cancelled) return;
				if (!res.ok) {
					setError(data.error || "Failed to load fare classes");
					setClasses([]);
					return;
				}
				const details: AiriqGetMultiClassAvailDetail[] = data.AvailDetails || [];
				if (!details.length) {
					setClasses([]);
					return;
				}
				const flat: MulticlassCardItem[] = [];
				for (const d of details) {
					for (const c of d.Classes || []) {
						flat.push({
							...c,
							origin: d.Origin,
							destination: d.Destination,
							carrierCode: d.CarrierCode,
							flightNumber: d.FlightNumber,
						});
					}
				}
				setClasses(flat);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load fare classes");
					setClasses([]);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchMultiClass();
		return () => {
			cancelled = true;
		};
	}, [traceId, resultIndex, flight, returnFlight, adultCount, childCount, infantCount, availabilityTrackid]);

	const handleGetPrice = async (item: MulticlassCardItem) => {
		const key = `${item.Class}-${item.Seats}`;
		if (priceByClass[key]) return;
		setPriceLoading(key);
		try {
			const res = await fetch("/api/travel/airiq/multi-class-fare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					traceId,
					resultIndex,
					flight,
					returnFlight: returnFlight || null,
					adultCount,
					childCount,
					infantCount,
					classFare: [{ AirlineClass: item.Class, SeatAvailFlag: item.Seats }],
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Failed to get fare");
				return;
			}
			const totalGross = (data.Fares?.[0]?.Faredescription || []).reduce(
				(sum: number, p: { GrossAmount?: string }) => sum + Number(p.GrossAmount || 0),
				0
			);
			const currency = data.Fares?.[0]?.Currency || "INR";
			setPriceByClass((prev) => ({
				...prev,
				[key]: {
					grossAmount: totalGross,
					currency,
					response: data,
				},
			}));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to get fare");
		} finally {
			setPriceLoading(null);
		}
	};

	const handleBookThisFare = (item: MulticlassCardItem) => {
		const key = `${item.Class}-${item.Seats}`;
		const payload = priceByClass[key];
		if (payload?.response && onSelectFare) {
			onSelectFare(payload.response);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8 gap-2 text-gray-500">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span>Loading fare classes...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-6 text-gray-500">
				<p>{error}</p>
			</div>
		);
	}

	if (!classes.length) {
		return (
			<div className="text-center py-8 text-gray-500">
				<TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
				<p>No other fare classes available for this flight.</p>
			</div>
		);
	}

	return (
		<div className="w-full overflow-hidden">
			<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-6 pb-6 items-stretch">
				{classes.map((item) => {
					const key = `${item.Class}-${item.Seats}`;
					const priceInfo = priceByClass[key];
					const isLoading = priceLoading === key;
					return (
						<div
							key={key}
							className="snap-start flex-shrink-0 w-[85%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
						>
							<Card className="h-full border border-gray-200 bg-white">
								<CardContent className="p-3 flex flex-col h-full justify-between">
									<div className="space-y-3">
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-center gap-2">
												<div className="h-8 w-8 rounded flex items-center justify-center overflow-hidden bg-white border border-gray-100 flex-shrink-0">
													<AirlineLogo
														airlineCode={item.carrierCode || firstSegment?.Airline?.AirlineCode || ""}
														airlineName={firstSegment?.Airline?.AirlineName || ""}
														size="sm"
													/>
												</div>
												<div className="min-w-0">
													<div className="text-sm font-semibold text-gray-900 truncate">
														{firstSegment?.Airline?.AirlineName || item.carrierCode}
													</div>
													<div className="text-[10px] text-gray-500">
														{item.flightNumber}
													</div>
												</div>
											</div>
										</div>
										<div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
											<div>
												<div className="text-base font-bold text-gray-900 leading-none">
													{item.origin}
												</div>
												<div className="text-[10px] text-gray-500 mt-1">—</div>
											</div>
											<div className="flex-1 px-2 text-center">
												<div className="flex items-center gap-1 w-full opacity-30">
													<div className="h-px bg-current flex-1" />
													<div className="h-1 w-1 rounded-full bg-current" />
													<div className="h-px bg-current flex-1" />
												</div>
											</div>
											<div className="text-right">
												<div className="text-base font-bold text-gray-900 leading-none">
													{item.destination}
												</div>
												<div className="text-[10px] text-gray-500 mt-1">—</div>
											</div>
										</div>
										<div className="border-t border-dashed pt-2 space-y-1.5">
											<div className="flex items-center justify-between text-[11px] text-gray-600">
												<span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
													{item.Cabin} • {item.Class}
												</span>
												<span className="text-gray-500">{item.Seats} seats</span>
											</div>
											<div className="text-[10px] text-gray-400">
												Fare basis: {item.FareBasisCode}
											</div>
										</div>
									</div>
									<div className="mt-3 pt-3 border-t border-gray-100">
										{priceInfo ? (
											<>
												<div className="flex items-end justify-between mb-3">
													<div className="text-[10px] text-gray-500">Total</div>
													<div className="text-lg font-bold text-gray-900 leading-none">
														{priceInfo.currency}{" "}
														{formatTravelPriceInr(priceInfo.grossAmount)}
													</div>
												</div>
												{onSelectFare && (
													<Button
														size="sm"
														className="w-full bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
														onClick={() => handleBookThisFare(item)}
													>
														Book this fare
													</Button>
												)}
											</>
										) : (
											<Button
												size="sm"
												className="w-full bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
												onClick={() => handleGetPrice(item)}
												disabled={isLoading}
											>
												{isLoading ? (
													<>
														<Loader2 className="h-3 w-3 mr-1.5 animate-spin inline" />
														Getting price...
													</>
												) : (
													"Get price"
												)}
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					);
				})}
			</div>
		</div>
	);
}
