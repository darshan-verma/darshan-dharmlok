import {
	getFareQuote,
	getFareRules,
	getFareUpsell,
	getPriceRBD,
} from "@/lib/tboClient";
import { PriceRBDResponse } from "@/types/tbo";
import {
	Plane,
	CheckCircle2,
	XCircle,
	CreditCard,
	IndianRupee,
	Clock,
	ScrollText,
	TrendingUp,
	Tag,
	ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PageProps {
	searchParams: Promise<{
		traceId: string;
		resultIndex: string;
		adultCount?: string;
		childCount?: string;
		infantCount?: string;
	}>;
}

export default async function BookingPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const {
		traceId,
		resultIndex,
		adultCount = "1",
		childCount = "0",
		infantCount = "0",
	} = params;

	if (!traceId || !resultIndex) {
		return (
			<div className="p-4">
				Missing booking details. Please search for a flight first.
			</div>
		);
	}

	// 1. Fetch FareQuote, FareRule, FareUpsell
	// We need FareQuote first to get the flight object for PriceRBD
	// But we can start FareRule and FareUpsell in parallel

	const fareRulePromise = getFareRules({
		TraceId: traceId,
		ResultIndex: resultIndex,
		EndUserIp: "192.168.1.1",
	}).catch((e) => {
		console.error("Error fetching fare rules", e);
		return null;
	});

	const fareUpsellPromise = getFareUpsell({
		TraceId: traceId,
		ResultIndex: resultIndex,
		EndUserIp: "192.168.1.1",
	}).catch((e) => {
		console.error("Error fetching fare upsell", e);
		return null;
	});

	let fareQuoteResponse;
	try {
		fareQuoteResponse = await getFareQuote({
			TraceId: traceId,
			ResultIndex: resultIndex,
			EndUserIp: "192.168.1.1",
		});
	} catch (e) {
		console.error("Error fetching fare quote", e);
		return (
			<div className="p-4 text-red-500">
				Error fetching flight details. The flight might no longer be available.
			</div>
		);
	}

	if (!fareQuoteResponse?.Response?.Results) {
		return <div className="p-4 text-red-500">Flight no longer available.</div>;
	}

	const flightResult = fareQuoteResponse.Response.Results;

	// 2. Fetch PriceRBD using flight details
	let priceRBDResponse: PriceRBDResponse | null = null;
	try {
		// Map flightResult to match PriceRBD expectation (adding TripIndicator and SegmentIndicator)
		const mappedSegments = flightResult.Segments.map((group, groupIndex) =>
			group.map((segment, segIndex) => ({
				TripIndicator: groupIndex + 1,
				SegmentIndicator: segIndex + 1,
				Airline: {
					...segment.Airline,
					OperatingCarrier: segment.Airline.AirlineCode,
				},
			}))
		);

		const airSearchResultItem = {
			ResultIndex: flightResult.ResultIndex,
			Source: flightResult.Source,
			IsLCC: flightResult.IsLCC,
			IsRefundable: flightResult.IsRefundable,
			AirlineRemark: flightResult.AirlineRemark,
			Segments: mappedSegments,
		};

		priceRBDResponse = await getPriceRBD({
			TraceId: traceId,
			EndUserIp: "192.168.1.1",
			AdultCount: adultCount,
			ChildCount: childCount,
			InfantCount: infantCount,
			AirSearchResult: [airSearchResultItem],
		});
	} catch (e) {
		console.error("Error fetching PriceRBD", e);
	}

	const [fareRules, fareUpsell] = await Promise.all([
		fareRulePromise,
		fareUpsellPromise,
	]);

	return (
		<div className="container mx-auto p-4 space-y-8 max-w-7xl">
			<h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
				<Plane className="h-8 w-8 text-primary" />
				Flight Booking Details
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Flight Details */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							<Plane className="h-5 w-5 text-blue-600" />
							Flight Details
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-6">
						<div className="flex justify-between items-start">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium text-gray-900 text-lg">
										{flightResult.AirlineCode}
									</span>
									<Badge variant={flightResult.IsLCC ? "secondary" : "default"}>
										{flightResult.IsLCC ? "LCC" : "Full Service"}
									</Badge>
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-600">
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
							</div>
						</div>

						<div>
							<h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
								<CreditCard className="h-4 w-4 text-gray-500" />
								Fare Breakdown
							</h3>
							<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2 border border-gray-100">
								<div className="flex justify-between text-gray-600">
									<span>Base Fare</span>
									<span className="font-medium text-gray-900">
										{flightResult.Fare.Currency} {flightResult.Fare.BaseFare}
									</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Tax & Charges</span>
									<span className="font-medium text-gray-900">
										{flightResult.Fare.Currency} {flightResult.Fare.Tax}
									</span>
								</div>
								<Separator className="my-2" />
								<div className="flex justify-between font-bold text-lg text-primary">
									<span>Total Amount</span>
									<span className="flex items-center">
										<IndianRupee className="h-4 w-4 mr-1" />
										{flightResult.Fare.PublishedFare}
									</span>
								</div>
							</div>
						</div>

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
												{/* Timeline dot */}
												<div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white" />

												<div className="mb-6 last:mb-0">
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-2">
															<span className="font-bold text-lg">
																{segment.Origin.Airport.CityCode}
															</span>
															<ArrowRight className="h-4 w-4 text-gray-400" />
															<span className="font-bold text-lg">
																{segment.Destination.Airport.CityCode}
															</span>
														</div>
														<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
															{segment.Duration}m
														</div>
													</div>

													<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
														<Plane className="h-3 w-3" />
														<span>{segment.Airline.AirlineName}</span>
														<span className="text-gray-400">•</span>
														<span>
															{segment.Airline.AirlineCode}-
															{segment.Airline.FlightNumber}
														</span>
													</div>

													<div className="grid grid-cols-2 gap-4 text-sm">
														<div>
															<div className="text-gray-500 text-xs mb-1">
																Departure
															</div>
															<div className="font-medium">
																{new Date(
																	segment.Origin.DepTime
																).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</div>
															<div className="text-gray-500 text-xs">
																{new Date(
																	segment.Origin.DepTime
																).toLocaleDateString()}
															</div>
														</div>
														<div>
															<div className="text-gray-500 text-xs mb-1">
																Arrival
															</div>
															<div className="font-medium">
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

				{/* Fare Rules */}
				<Card className="shadow-sm h-fit">
					<CardHeader className="pb-2 border-b">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							<ScrollText className="h-5 w-5 text-orange-600" />
							Fare Rules
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4">
						{fareRules?.Response?.FareRules ? (
							<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
								{fareRules.Response.FareRules.map((rule, index) => (
									<div
										key={index}
										className="bg-orange-50/50 p-4 rounded-lg border border-orange-100"
									>
										<div className="font-medium mb-2 text-orange-900 flex items-center gap-2">
											<Badge
												variant="outline"
												className="bg-white text-orange-700 border-orange-200"
											>
												{rule.Origin} → {rule.Destination}
											</Badge>
											<span className="text-sm text-gray-500">
												({rule.Airline})
											</span>
										</div>
										<div
											className="text-sm text-gray-700 fare-rules-content"
											dangerouslySetInnerHTML={{ __html: rule.FareRuleDetail }}
										/>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<ScrollText className="h-12 w-12 mx-auto mb-3 opacity-20" />
								<p>No fare rules available.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Fare Upsell */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-purple-600" />
							Fare Upsell Options
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4">
						{fareUpsell?.Response?.Results ? (
							<div className="space-y-4">
								{/* TODO: Better visualization of upsell options */}
								<pre className="text-xs bg-gray-50 p-4 rounded-lg border overflow-auto max-h-60 font-mono text-gray-600">
									{JSON.stringify(fareUpsell.Response.Results, null, 2)}
								</pre>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
								<p>No upsell options available.</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Price RBD */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							<Tag className="h-5 w-5 text-green-600" />
							Price RBD
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4">
						{priceRBDResponse?.Response?.Results ? (
							<div className="space-y-4">
								<div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start gap-3">
									<div className="bg-green-100 p-2 rounded-full">
										<Tag className="h-4 w-4 text-green-700" />
									</div>
									<div>
										<h3 className="font-medium text-green-900">
											Updated Pricing Available
										</h3>
										<div className="mt-2 text-sm text-green-800">
											<div className="flex items-center gap-2">
												<span>New Total:</span>
												<span className="font-bold text-lg">
													{priceRBDResponse.Response.Results.Fare.Currency}{" "}
													{priceRBDResponse.Response.Results.Fare.PublishedFare}
												</span>
											</div>
										</div>
									</div>
								</div>
								<pre className="text-xs bg-gray-50 p-4 rounded-lg border overflow-auto max-h-60 font-mono text-gray-600">
									{JSON.stringify(priceRBDResponse.Response.Results, null, 2)}
								</pre>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
								<p>No RBD pricing available.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
