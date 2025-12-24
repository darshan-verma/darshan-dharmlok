"use client";

import { Plane, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import type { FlightResult } from "@/types/tbo";

interface FlightDetailsProps {
	flightResult: FlightResult;
}

export default function FlightDetails({ flightResult }: FlightDetailsProps) {
	return (
		<Card className="shadow-sm border-blue-200">
			<CardHeader className="pb-3 border-b bg-blue-50/30">
				<CardTitle className="text-xl font-semibold flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Plane className="h-5 w-5 text-blue-600" />
						Flight Details
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-900 text-lg">
							{flightResult.AirlineCode}
						</span>
						<Badge variant={flightResult.IsLCC ? "secondary" : "default"}>
							{flightResult.IsLCC ? "LCC" : "Full Service"}
						</Badge>
						{flightResult.IsRefundable ? (
							<Badge
								variant="outline"
								className="text-green-600 border-green-200 bg-green-50"
							>
								<CheckCircle2 className="h-3 w-3 mr-1" /> Refundable
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-red-600 border-red-200 bg-red-50"
							>
								<XCircle className="h-3 w-3 mr-1" /> Non-Refundable
							</Badge>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-4">
				<div>
					<h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
						<Clock className="h-4 w-4 text-gray-500" />
						Itinerary
					</h3>
					<div className="space-y-4">
						{flightResult.Segments.map((segmentGroup, groupIndex) => (
							<div
								key={groupIndex}
								className="border rounded-lg p-4 space-y-4 bg-white"
							>
								{segmentGroup.map((segment, segIndex) => (
									<div
										key={segIndex}
										className="relative pl-4 border-l-2 border-blue-100 last:border-l-0 last:pl-0 last:ml-[1px]"
									>
										<div className="mb-6 last:mb-0">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2 text-sm text-gray-600">
													<div className="h-6 w-6 rounded flex items-center justify-center overflow-hidden bg-gray-50">
														<AirlineLogo
															airlineCode={segment.Airline.AirlineCode}
															airlineName={segment.Airline.AirlineName}
															size="sm"
														/>
													</div>
													<span>{segment.Airline.AirlineName}</span>
													<span className="text-gray-400">•</span>
													<span className="font-medium">
														{segment.Airline.AirlineCode}-
														{segment.Airline.FlightNumber}
													</span>
												</div>
												<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
													{segment.Duration}m
												</div>
											</div>

											<div className="flex justify-between items-center mb-4">
												<div className="text-left">
													<div className="text-sm font-medium text-gray-900">
														{segment.Origin.Airport.AirportName}
													</div>
													<div className="text-xs text-gray-500">
														{segment.Origin.Airport.CityName} (
														{segment.Origin.Airport.CityCode})
													</div>
												</div>
												<div className="text-right">
													<div className="text-sm font-medium text-gray-900">
														{segment.Destination.Airport.AirportName}
													</div>
													<div className="text-xs text-gray-500">
														{segment.Destination.Airport.CityName} (
														{segment.Destination.Airport.CityCode})
													</div>
												</div>
											</div>

											<div className="flex justify-between items-start">
												<div className="text-left">
													<div className="text-gray-500 text-xs mb-1">
														Departure
													</div>
													<div className="font-medium text-lg">
														{new Date(segment.Origin.DepTime).toLocaleTimeString(
															[],
															{
																hour: "2-digit",
																minute: "2-digit",
															}
														)}
													</div>
													<div className="text-gray-500 text-xs">
														{new Date(segment.Origin.DepTime).toLocaleDateString()}
													</div>
												</div>
												<div className="text-right">
													<div className="text-gray-500 text-xs mb-1">
														Arrival
													</div>
													<div className="font-medium text-lg">
														{new Date(
															segment.Destination.ArrTime
														).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</div>
													<div className="text-gray-500 text-xs">
														{new Date(
															segment.Destination.ArrTime
														).toLocaleDateString()}
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
