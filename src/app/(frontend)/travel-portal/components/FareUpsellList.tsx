"use client";

import Link from "next/link";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import { TrendingUp } from "lucide-react";
import type { FlightResult } from "@/types/tbo";

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
			<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-6 pb-6 items-stretch">
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
							className="snap-start flex-shrink-0 w-[85%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
						>
							<Card className="h-full border border-gray-200 bg-white">
								<CardContent className="p-3 flex flex-col h-full justify-between">
									<div className="space-y-3">
										{/* Top Info: Airline & Stops */}
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-center gap-2">
												<div className="h-8 w-8 rounded flex items-center justify-center overflow-hidden bg-white border border-gray-100 flex-shrink-0">
													<AirlineLogo
														airlineCode={
															firstSegment?.Airline?.AirlineCode || ""
														}
														airlineName={
															firstSegment?.Airline?.AirlineName || ""
														}
														size="sm"
													/>
												</div>
												<div className="min-w-0">
													<div className="text-sm font-semibold text-gray-900 truncate">
														{firstSegment?.Airline?.AirlineName}
													</div>
													<div className="text-[10px] text-gray-500">
														{firstSegment?.Airline?.AirlineCode} •{" "}
														{deal.ValidatingAirlineCode}
													</div>
												</div>
											</div>
											<div className="text-right flex-shrink-0">
												{deal.IsRefundable ? (
													<span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-sm border border-green-100 block mb-0.5">
														Refundable
													</span>
												) : (
													<span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-medium rounded-sm border border-red-100 block mb-0.5">
														Non-Ref
													</span>
												)}
												<div className="text-[10px] text-gray-500">
													{stops === 0
														? "Non-stop"
														: `${stops} stop${stops > 1 ? "s" : ""}`}
												</div>
											</div>
										</div>

										{/* Times & Route */}
										<div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
											<div>
												<div className="text-base font-bold text-gray-900 leading-none">
													{firstSegment?.Origin?.Airport?.CityCode || "--"}
												</div>
												<div className="text-[10px] text-gray-500 mt-1">
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
											<div className="flex-1 px-2 text-center">
												<div className="text-[10px] font-medium text-gray-500 mb-0.5">
													{totalDuration ? `${totalDuration}m` : "--"}
												</div>
												<div className="flex items-center gap-1 w-full opacity-30">
													<div className="h-px bg-current flex-1"></div>
													<div className="h-1 w-1 rounded-full bg-current"></div>
													<div className="h-px bg-current flex-1"></div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-base font-bold text-gray-900 leading-none">
													{lastSegment?.Destination?.Airport?.CityCode || "--"}
												</div>
												<div className="text-[10px] text-gray-500 mt-1">
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

										{/* Class & Baggage Info */}
										<div className="border-t border-dashed pt-2 space-y-1.5">
											<div className="flex items-center justify-between text-[11px] text-gray-600">
												<span className="flex items-center gap-1.5">
													<span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
														Class {firstSegment?.Airline?.FareClass || "-"}
													</span>
												</span>
												<span className="text-gray-400">|</span>
												<span className="font-medium text-gray-700">
													{deal.ValidatingAirlineCode}
												</span>
											</div>

											<div className="grid grid-cols-2 gap-2 mt-2">
												{/* Check-in Baggage */}
												<div className="flex flex-col gap-0.5 p-1.5 bg-gray-50 rounded border border-gray-100">
													<span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">
														Check-in
													</span>
													<span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
															className="w-3 h-3 text-gray-500"
														>
															<path d="M6 20h0a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4h0" />
															<rect width="20" height="14" x="2" y="6" rx="2" />
														</svg>
														{firstSegment?.Baggage || "--"}
													</span>
												</div>

												{/* Cabin Baggage */}
												<div className="flex flex-col gap-0.5 p-1.5 bg-gray-50 rounded border border-gray-100">
													<span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">
														Cabin
													</span>
													<span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
															className="w-3 h-3 text-gray-500"
														>
															<rect width="16" height="20" x="4" y="2" rx="2" />
															<path d="M9 22v-4h6v4" />
															<path d="M8 6h.01" />
															<path d="M16 20h.01" />
														</svg>
														{firstSegment?.CabinBaggage || "7 Kg"}
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Bottom: Price & Action */}
									<div className="mt-3 pt-3 border-t border-gray-100">
										<div className="flex items-end justify-between mb-3">
											<div className="text-[10px] text-gray-500">
												Per Person
											</div>
											<div className="text-right">
												<div className="text-lg font-bold text-gray-900 leading-none">
													{deal.Fare?.Currency || fallbackFareCurrency}{" "}
													{priceVal !== null
														? Number(priceVal).toLocaleString()
														: "--"}
												</div>
											</div>
										</div>

										<Button
											asChild
											size="sm"
											className="w-full bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
										>
											<Link href={href} prefetch={false}>
												Select Deal
											</Link>
										</Button>
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
