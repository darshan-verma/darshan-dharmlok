"use client";

import Link from "next/link";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import { TrendingUp } from "lucide-react";
import type { FlightResult, FlightSegmentDetail } from "@/types/tbo";

interface Props {
	upsellOptions: FlightResult[];
	isUpsellAllowed: boolean;
	traceId: string;
	returnResultIndex?: string | null;
	adultCount?: string | number;
	childCount?: string | number;
	infantCount?: string | number;
	fallbackFareCurrency?: string | null;
}

export default function FareUpsellList({
	upsellOptions,
	isUpsellAllowed,
	traceId,
	returnResultIndex,
	adultCount = "1",
	childCount = "0",
	infantCount = "0",
	fallbackFareCurrency = "INR",
}: Props) {
	if (!isUpsellAllowed) {
		return (
			<div className="text-center py-8 text-gray-500">
				<TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
				<p>Upsell options are not available for this selection.</p>
			</div>
		);
	}

	if (!upsellOptions || upsellOptions.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				<p>No upsell options found.</p>
			</div>
		);
	}

	return (
		<div className="w-full overflow-hidden">
			<div className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-4 px-6 pb-6 items-stretch">
				{upsellOptions.map((deal) => {
					const segments = Array.isArray(deal.Segments)
						? deal.Segments.flatMap((g) => (Array.isArray(g) ? g : [g]))
						: [];

					const firstSegment = segments[0] || null;
					const lastSegment = segments[segments.length - 1] || null;
					const stops = Math.max(0, segments.length - 1);

					// try compute duration in minutes from first dep to last arr
					let totalDuration: number | null = null;
					try {
						if (
							firstSegment?.Origin?.DepTime &&
							lastSegment?.Destination?.ArrTime
						) {
							const d1 = new Date(firstSegment.Origin.DepTime);
							const d2 = new Date(lastSegment.Destination.ArrTime);
							totalDuration = Math.round((d2.getTime() - d1.getTime()) / 60000);
						}
					} catch (_e) {
						totalDuration = null;
					}

					const priceVal =
						deal?.Fare?.PublishedFare ?? deal?.Fare?.OfferedFare ?? null;

					const upsellParams = new URLSearchParams({
						traceId,
						resultIndex: String(deal.ResultIndex),
						adultCount: String(adultCount),
						childCount: String(childCount),
						infantCount: String(infantCount),
					});

					if (isUpsellAllowed) {
						upsellParams.set("isUpsellAllowed", "true");
					}

					if (returnResultIndex) {
						upsellParams.set("returnResultIndex", String(returnResultIndex));
					}

					const href = `/travel-portal/book?${upsellParams.toString()}`;

					return (
						<div
							key={`${deal.ResultIndex}-${deal.ValidatingAirlineCode}`}
							className="snap-start flex-shrink-0"
							style={{
								// Try to fit 3 cards: use calc split of available space but cap to 420px
								flex: "0 0 min(420px, calc((100% - 3rem) / 3))",
								minWidth: "260px",
								maxWidth: "420px",
							}}
						>
							<Card className="h-full border border-gray-200 bg-white">
								<CardContent className="p-4 flex flex-col h-full justify-between">
									<div>
										<div className="flex items-start justify-between gap-2 mb-2">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded flex items-center justify-center overflow-hidden bg-white">
													<AirlineLogo
														airlineCode={
															firstSegment?.Airline?.AirlineCode || ""
														}
														airlineName={
															firstSegment?.Airline?.AirlineName || ""
														}
														size="md"
													/>
												</div>
												<div>
													<div className="text-sm font-semibold text-gray-900">
														{firstSegment?.Airline?.AirlineName ||
															"Upsell Fare"}
													</div>
													<div className="text-xs text-gray-500">
														{firstSegment?.Airline?.AirlineCode || ""} •{" "}
														{deal.ValidatingAirlineCode || ""}
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm text-gray-600">
													{stops === 0
														? "Non-stop"
														: `${stops} stop${stops > 1 ? "s" : ""}`}
												</div>
												<div className="text-xs mt-1 text-gray-500">
													{deal.IsLCC
														? "LCC"
														: deal.IsRefundable
														? "Refundable"
														: "Non-refundable"}
												</div>
											</div>
										</div>

										<div className="flex items-center justify-between mb-3">
											<div>
												<div className="text-lg font-semibold text-gray-900">
													{firstSegment?.Origin?.Airport?.CityCode || "--"}
												</div>
												<div className="text-xs text-gray-500">
													{firstSegment?.Origin?.DepTime
														? new Date(
																firstSegment.Origin.DepTime
														  ).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
														  })
														: "--"}
												</div>
											</div>
											<div className="text-center text-gray-500 text-xs">
												<div className="font-medium text-gray-700">
													{totalDuration ? `${totalDuration}m` : "--"}
												</div>
												<div className="h-px w-12 bg-gray-200 mx-auto my-1" />
												<div className="text-[10px]">Duration</div>
											</div>
											<div className="text-right">
												<div className="text-lg font-semibold text-gray-900">
													{lastSegment?.Destination?.Airport?.CityCode || "--"}
												</div>
												<div className="text-xs text-gray-500">
													{lastSegment?.Destination?.ArrTime
														? new Date(
																lastSegment.Destination.ArrTime
														  ).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
														  })
														: "--"}
												</div>
											</div>
										</div>

										<div className="text-sm text-gray-600 mb-3">
											Class: {firstSegment?.Airline?.FareClass || "-"} •
											Baggage: {firstSegment?.Baggage || "--"}
										</div>

										<div className="text-sm text-gray-700 mb-3">
											{segments
												.slice(0, 3)
												.map((seg: FlightSegmentDetail, idx: number) => (
													<div
														key={idx}
														className="flex items-center justify-between text-xs text-gray-600"
													>
														<div>
															{seg.Origin?.Airport?.CityCode ||
																seg.Origin?.Airport?.CityName ||
																"--"}{" "}
															→{" "}
															{seg.Destination?.Airport?.CityCode ||
																seg.Destination?.Airport?.CityName ||
																"--"}
														</div>
														<div className="ml-2">
															{seg.Airline?.AirlineCode}-
															{seg.Airline?.FlightNumber || ""}
														</div>
													</div>
												))}
										</div>
									</div>

									<div>
										<div className="flex items-center justify-between mb-2">
											<div className="text-sm text-gray-600">Per itinerary</div>
											<div className="text-right">
												<div className="text-lg font-bold text-gray-900">
													{deal.Fare?.Currency || fallbackFareCurrency}{" "}
													{priceVal !== null
														? Number(priceVal).toLocaleString()
														: "--"}
												</div>
												<div className="text-xs text-gray-500">
													Base:{" "}
													{deal.Fare?.BaseFare ? `${deal.Fare.BaseFare}` : "-"}{" "}
													• Tax: {deal.Fare?.Tax ? `${deal.Fare.Tax}` : "-"}
												</div>
											</div>
										</div>

										<div className="flex gap-2">
											<Button asChild variant="secondary" className="flex-1">
												<Link href={href} prefetch={false}>
													View Deal
												</Link>
											</Button>
										</div>
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
