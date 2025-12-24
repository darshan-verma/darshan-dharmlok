import Link from "next/link";
import {
	getFareQuote,
	getFareRules,
	getFareUpsell,
	getPriceRBD,
	getSSR,
} from "@/lib/tboClient";
import { PriceRBDResponse, FareUpsellResponse } from "@/types/tbo";
import {
	Plane,
	CheckCircle2,
	XCircle,
	Clock,
	ScrollText,
	Tag,
	Search,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import BookingClient from "./BookingClient";

interface PageProps {
	searchParams: Promise<{
		traceId: string;
		resultIndex: string;
		returnResultIndex?: string;
		adultCount?: string;
		childCount?: string;
		infantCount?: string;
		isUpsellAllowed?: string;
	}>;
}

export default async function BookingPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const {
		traceId,
		resultIndex,
		returnResultIndex,
		adultCount = "1",
		childCount = "0",
		infantCount = "0",
		isUpsellAllowed: isUpsellAllowedParam,
	} = params;

	const isUpsellAllowed = isUpsellAllowedParam === "true";

	if (!traceId || !resultIndex) {
		return (
			<div className="p-4">
				Missing booking details. Please search for a flight first.
			</div>
		);
	}

	const fareRulePromise = getFareRules({
		TraceId: traceId,
		ResultIndex: resultIndex,
		EndUserIp: "192.168.1.1",
	}).catch((e) => {
		console.error("Error fetching fare rules", e);
		return null;
	});

	const fareUpsellPromise = isUpsellAllowed
		? getFareUpsell({
				TraceId: traceId,
				ResultIndex: resultIndex,
				EndUserIp: "192.168.1.1",
		  })
				.then((result) => {
					console.log("=== Fare Upsell API Success ===");
					console.log("Raw API response:", JSON.stringify(result, null, 2));
					return result;
				})
				.catch((e) => {
					console.error("=== Error fetching fare upsell ===", e);
					return null;
				})
		: Promise.resolve(null);

	const ssrPromise = getSSR({
		TraceId: traceId,
		ResultIndex: resultIndex,
		EndUserIp: "192.168.1.1",
	}).catch((e) => {
		console.error("Error fetching SSR", e);
		return null;
	});

	// Fetch fare quote(s)
	let fareQuoteResponse;
	let returnFareQuoteResponse;
	try {
		fareQuoteResponse = await getFareQuote({
			TraceId: traceId,
			ResultIndex: resultIndex,
			EndUserIp: "192.168.1.1",
		});

		if (returnResultIndex) {
			returnFareQuoteResponse = await getFareQuote({
				TraceId: traceId,
				ResultIndex: returnResultIndex,
				EndUserIp: "192.168.1.1",
			});
		}
	} catch (e) {
		console.error("Error fetching fare quote", e);
		const errorMessage = e instanceof Error ? e.message : String(e);
		if (
			errorMessage.includes("Invalid Outbound Result Index") ||
			errorMessage.includes("Invalid Result Index")
		) {
			return (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
					<Card className="max-w-md w-full">
						<CardHeader>
							<CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
								<XCircle className="h-6 w-6" />
								Session Expired
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center space-y-4">
							<p className="text-gray-600">
								The flight search session has expired. Please search again.
							</p>
							<Button asChild className="w-full">
								<Link href="/travel-portal">
									<Search className="mr-2 h-4 w-4" />
									Search Flights Again
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			);
		}

		return (
			<div className="p-4 text-red-500">
				Error fetching flight details. The flight might no longer be available.
			</div>
		);
	}

	if (!fareQuoteResponse?.Response?.Results) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
							<XCircle className="h-6 w-6" />
							Flight Not Available
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-gray-600">
							The selected flight is no longer available.
						</p>
						<Button asChild className="w-full">
							<Link href="/travel-portal">
								<Search className="mr-2 h-4 w-4" />
								Search Flights Again
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	let flightResult = fareQuoteResponse.Response.Results;

	// Merge return fares if present
	if (returnFareQuoteResponse?.Response?.Results) {
		const returnFlight = returnFareQuoteResponse.Response.Results;
		const f1 = flightResult.Fare;
		const f2 = returnFlight.Fare;

		if (f1 && f2) {
			const combinedFare = {
				...f1,
				BaseFare: Number(f1.BaseFare) + Number(f2.BaseFare),
				Tax: Number(f1.Tax) + Number(f2.Tax),
				YQTax: Number(f1.YQTax) + Number(f2.YQTax),
				AdditionalTxnFeeOfrd:
					Number(f1.AdditionalTxnFeeOfrd) + Number(f2.AdditionalTxnFeeOfrd),
				AdditionalTxnFeePub:
					Number(f1.AdditionalTxnFeePub) + Number(f2.AdditionalTxnFeePub),
				PGCharge: Number(f1.PGCharge) + Number(f2.PGCharge),
				OtherCharges: Number(f1.OtherCharges) + Number(f2.OtherCharges),
				Discount: Number(f1.Discount) + Number(f2.Discount),
				PublishedFare: Number(f1.PublishedFare) + Number(f2.PublishedFare),
				CommissionEarned:
					Number(f1.CommissionEarned) + Number(f2.CommissionEarned),
				PLBEarned: Number(f1.PLBEarned) + Number(f2.PLBEarned),
				IncentiveEarned:
					Number(f1.IncentiveEarned) + Number(f2.IncentiveEarned),
				OfferedFare: Number(f1.OfferedFare) + Number(f2.OfferedFare),
				TdsOnCommission:
					Number(f1.TdsOnCommission) + Number(f2.TdsOnCommission),
				TdsOnPLB: Number(f1.TdsOnPLB) + Number(f2.TdsOnPLB),
				TdsOnIncentive: Number(f1.TdsOnIncentive) + Number(f2.TdsOnIncentive),
				ServiceFee: Number(f1.ServiceFee) + Number(f2.ServiceFee),
				TotalBaggageCharges:
					Number(f1.TotalBaggageCharges) + Number(f2.TotalBaggageCharges),
				TotalMealCharges:
					Number(f1.TotalMealCharges) + Number(f2.TotalMealCharges),
				TotalSeatCharges:
					Number(f1.TotalSeatCharges) + Number(f2.TotalSeatCharges),
				TotalSpecialServiceCharges:
					Number(f1.TotalSpecialServiceCharges) +
					Number(f2.TotalSpecialServiceCharges),
				IGSTAmount: (Number(f1.IGSTAmount) || 0) + (Number(f2.IGSTAmount) || 0),
				CGSTAmount: (Number(f1.CGSTAmount) || 0) + (Number(f2.CGSTAmount) || 0),
				SGSTAmount: (Number(f1.SGSTAmount) || 0) + (Number(f2.SGSTAmount) || 0),
				CessAmount: (Number(f1.CessAmount) || 0) + (Number(f2.CessAmount) || 0),
				AirlineTransFee:
					(Number(f1.AirlineTransFee) || 0) + (Number(f2.AirlineTransFee) || 0),
			};

			flightResult = {
				...flightResult,
				Fare: combinedFare,
				Segments: [...flightResult.Segments, ...returnFlight.Segments],
			};
		}
	}

	// Fetch PriceRBD using mapped segments
	let priceRBDResponse: PriceRBDResponse | null = null;
	try {
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

	const [fareRules, fareUpsell, ssrResponse] = await Promise.all([
		fareRulePromise,
		fareUpsellPromise,
		ssrPromise,
	]);

	// Log the SSR response for debugging
	console.log("=== SSR Debug Info ===");
	console.log("ssrResponse:", JSON.stringify(ssrResponse, null, 2));
	console.log("ssrResponse?.Response:", ssrResponse?.Response);

	// Log the fare rules response for debugging
	console.log("=== Fare Rules Debug Info ===");
	console.log("fareRules:", fareRules);
	console.log("fareRules?.Response:", fareRules?.Response);
	console.log("fareRules?.Response?.Results:", fareRules?.Response?.Results);
	console.log(
		"fareRules?.Response?.FareRules:",
		fareRules?.Response?.FareRules
	);
	console.log(
		"fareRules?.Response?.Results?.MiniFareRules:",
		fareRules?.Response?.Results?.MiniFareRules
	);
	console.log(
		"fareRules?.Response?.Results?.FareRules:",
		fareRules?.Response?.Results?.FareRules
	);

	// Log the fare upsell response for debugging
	if (isUpsellAllowed) {
		console.log("=== Fare Upsell Debug Info ===");
		console.log("isUpsellAllowed:", isUpsellAllowed);
		console.log(
			"fareUpsell full response:",
			JSON.stringify(fareUpsell, null, 2)
		);
		console.log("fareUpsell?.Response:", fareUpsell?.Response);
		console.log(
			"fareUpsell?.Response?.Results:",
			fareUpsell?.Response?.Results
		);
		console.log(
			"Array.isArray(fareUpsell?.Response?.Results):",
			Array.isArray(fareUpsell?.Response?.Results)
		);
	}

	const upsellOptions: FareUpsellResponse["Response"]["Results"] =
		Array.isArray(fareUpsell?.Response?.Results)
			? fareUpsell.Response.Results
			: [];

	return (
		<div className="container mx-auto p-4 space-y-6 max-w-7xl pb-24">
			<h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
				<Plane className="h-8 w-8 text-primary" />
				Flight Booking Details
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				{/* Left Column: Flight Details and Fare Rules */}
				<div className="space-y-6">
					{/* Flight Details */}
					<Card className="shadow-sm">
						<CardHeader className="pb-2 border-b">
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
						<CardContent>
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

							{/* Passenger Details */}
							<div>
								<h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-gray-500" />
									Passenger Details
								</h3>
								<div className="bg-gray-50 rounded-lg p-4 space-y-3">
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										<div className="flex items-center gap-3">
											<div className="bg-blue-100 p-2 rounded-full flex items-center justify-center w-8 h-8">
												<span className="text-sm font-semibold text-blue-800">
													A
												</span>
											</div>
											<div>
												<div className="text-sm font-medium text-gray-900">
													Adults
												</div>
												<div className="text-xs text-gray-600">
													{adultCount} passenger{adultCount !== "1" ? "s" : ""}
												</div>
											</div>
										</div>
										{childCount !== "0" && (
											<div className="flex items-center gap-3">
												<div className="bg-green-100 p-2 rounded-full flex items-center justify-center w-8 h-8">
													<span className="text-sm font-semibold text-green-800">
														C
													</span>
												</div>
												<div>
													<div className="text-sm font-medium text-gray-900">
														Children
													</div>
													<div className="text-xs text-gray-600">
														{childCount} passenger
														{childCount !== "1" ? "s" : ""}
													</div>
												</div>
											</div>
										)}
										{infantCount !== "0" && (
											<div className="flex items-center gap-3">
												<div className="bg-yellow-100 p-2 rounded-full flex items-center justify-center w-8 h-8">
													<span className="text-sm font-semibold text-yellow-800">
														I
													</span>
												</div>
												<div>
													<div className="text-sm font-medium text-gray-900">
														Infants
													</div>
													<div className="text-xs text-gray-600">
														{infantCount} passenger
														{infantCount !== "1" ? "s" : ""}
													</div>
												</div>
											</div>
										)}
									</div>
									<div className="pt-2 border-t border-gray-200">
										<p className="text-xs text-gray-500">
											Passenger names and contact details will be collected
											during the booking process.
										</p>
									</div>
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
							{(() => {
								// Handle different response structures
								const miniFareRules =
									fareRules?.Response?.Results?.MiniFareRules ||
									fareRules?.Response?.MiniFareRules;
								const fareRulesArray =
									fareRules?.Response?.Results?.FareRules ||
									fareRules?.Response?.FareRules;

								if (miniFareRules && miniFareRules.length > 0) {
									return (
										<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
											{miniFareRules.map((ruleGroup, groupIndex) => (
												<div
													key={groupIndex}
													className="bg-orange-50/50 p-4 rounded-lg border border-orange-100"
												>
													<div className="font-medium mb-3 text-orange-900">
														Fare Rules for{" "}
														{ruleGroup[0]?.JourneyPoints || "Route"}
													</div>
													<div className="space-y-3">
														{ruleGroup.map((rule, ruleIndex) => (
															<div
																key={ruleIndex}
																className="bg-white p-3 rounded border border-orange-200"
															>
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<Badge
																			variant="outline"
																			className={`${
																				rule.Type === "Cancellation"
																					? "bg-red-50 text-red-700 border-red-200"
																					: rule.Type === "Reissue"
																					? "bg-blue-50 text-blue-700 border-blue-200"
																					: "bg-gray-50 text-gray-700 border-gray-200"
																			}`}
																		>
																			{rule.Type}
																		</Badge>
																		{rule.OnlineReissueAllowed && (
																			<Badge
																				variant="outline"
																				className="bg-green-50 text-green-700 border-green-200"
																			>
																				Online Allowed
																			</Badge>
																		)}
																	</div>
																	<div className="text-sm text-gray-600">
																		{rule.From}-{rule.To} {rule.Unit}
																	</div>
																</div>
																<div className="text-sm font-medium text-gray-900">
																	{rule.Details}
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									);
								} else if (fareRulesArray && fareRulesArray.length > 0) {
									return (
										<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
											{fareRulesArray.map((rule, index) => (
												<div
													key={index}
													className="bg-orange-50/50 p-4 rounded-lg border border-orange-100"
												>
													<div className="font-medium mb-2 text-orange-900">
														<div className="flex items-center gap-2">
															<span className="text-sm">Airline:</span>
															<span className="text-sm text-gray-700">
																{rule.Airline}
															</span>
														</div>
														<div className="flex items-center gap-2 mt-1">
															<span className="text-sm">Fare Basis Code:</span>
															<span className="text-sm text-gray-700">
																{rule.FareBasisCode}
															</span>
														</div>
														<div className="flex items-center gap-2 mt-1">
															<Badge
																variant="outline"
																className="bg-white text-orange-700 border-orange-200"
															>
																{rule.Origin} {"->"} {rule.Destination}
															</Badge>
														</div>
													</div>
													{rule.FareRuleDetail ? (
														<div
															className="text-sm text-gray-700 fare-rules-content"
															dangerouslySetInnerHTML={{
																__html: rule.FareRuleDetail,
															}}
														/>
													) : (
														<div className="text-sm text-gray-500 italic">
															Detailed fare rules not available for this fare
															basis.
														</div>
													)}
												</div>
											))}
										</div>
									);
								} else if (fareRules === null) {
									return (
										<div className="text-center py-8 text-gray-500">
											<ScrollText className="h-12 w-12 mx-auto mb-3 opacity-20" />
											<p>
												Unable to load fare rules. Please try refreshing the
												page.
											</p>
										</div>
									);
								} else {
									return (
										<div className="text-center py-8 text-gray-500">
											<ScrollText className="h-12 w-12 mx-auto mb-3 opacity-20" />
											<p>No fare rules available for this flight.</p>
										</div>
									);
								}
							})()}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					{/* Passenger Details Form */}
					<BookingClient
						adultCount={parseInt(adultCount)}
						childCount={parseInt(childCount)}
						infantCount={parseInt(infantCount)}
						traceId={traceId}
						resultIndex={resultIndex}
						flightResult={flightResult}
						upsellOptions={upsellOptions}
						isUpsellAllowed={isUpsellAllowed}
					/>

					{/* SSR (Special Service Request) Options - Now handled by BookingClient SSRSelection component below */}
					{/* SSR (Special Service Request) Options - Now handled by BookingClient SSRSelection component below */}

					{/* Price RBD */}
					<Card className="shadow-sm">
						<CardHeader className="pb-2 border-b">
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								<Tag className="h-5 w-5 text-green-600" />
								Price RBD
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4">
							{(() => {
								if (!priceRBDResponse?.Response?.Results) {
									return (
										<div className="text-center py-8 text-gray-500">
											<Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
											<p>No RBD pricing available.</p>
										</div>
									);
								}

								// Handle array of arrays structure
								let priceRBDResult;
								if (Array.isArray(priceRBDResponse.Response.Results)) {
									priceRBDResult = priceRBDResponse.Response.Results[0]?.[0];
								} else {
									priceRBDResult = priceRBDResponse.Response.Results;
								}

								if (!priceRBDResult) {
									return (
										<div className="text-center py-8 text-gray-500">
											<Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
											<p>No RBD pricing data available.</p>
										</div>
									);
								}

								return (
									<div className="space-y-4">
										{priceRBDResult.Fare ? (
											<div className="space-y-3">
												<div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start gap-3">
													<div className="bg-green-100 p-2 rounded-full">
														<Tag className="h-4 w-4 text-green-700" />
													</div>
													<div className="flex-1">
														<h3 className="font-medium text-green-900 mb-2">
															Fare Pricing Details
														</h3>
														<div className="space-y-2 text-sm text-green-800">
															<div className="flex justify-between">
																<span>Base Fare:</span>
																<span className="font-semibold">
																	{priceRBDResult.Fare.Currency}{" "}
																	{priceRBDResult.Fare.BaseFare.toLocaleString()}
																</span>
															</div>
															<div className="flex justify-between">
																<span>Tax:</span>
																<span className="font-semibold">
																	{priceRBDResult.Fare.Currency}{" "}
																	{priceRBDResult.Fare.Tax.toLocaleString()}
																</span>
															</div>
															<div className="flex justify-between pt-2 border-t border-green-200">
																<span className="font-semibold">Total:</span>
																<span className="font-bold text-base">
																	{priceRBDResult.Fare.Currency}{" "}
																	{priceRBDResult.Fare.PublishedFare.toLocaleString()}
																</span>
															</div>
														</div>
													</div>
												</div>
												{priceRBDResult.FareClassification && (
													<div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
														<div className="text-sm">
															<span className="text-gray-600">Fare Type: </span>
															<Badge
																style={{
																	backgroundColor:
																		priceRBDResult.FareClassification.Color,
																}}
															>
																{priceRBDResult.FareClassification.Type}
															</Badge>
														</div>
													</div>
												)}
												{/* Fare Breakdown by Passenger Type */}
												{priceRBDResult.FareBreakdown &&
													priceRBDResult.FareBreakdown.length > 0 && (
														<div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
															<div className="bg-purple-100 p-2 rounded-full w-fit mb-3">
																<Users className="h-4 w-4 text-purple-700" />
															</div>
															<h3 className="font-medium text-purple-900 mb-3">
																Fare Breakdown by Passenger Type
															</h3>
															<div className="space-y-3">
																{priceRBDResult.FareBreakdown.map(
																	(breakdown, index) => {
																		const passengerTypeMap: {
																			[key: number]: string;
																		} = {
																			1: "Adult",
																			2: "Child",
																			3: "Infant",
																		};
																		const passengerType =
																			passengerTypeMap[
																				breakdown.PassengerType
																			] || "Unknown";

																		return (
																			<div
																				key={index}
																				className="bg-white p-3 rounded border border-purple-200"
																			>
																				<div className="flex items-center justify-between mb-2">
																					<div className="flex items-center gap-2">
																						<span className="font-medium text-purple-900">
																							{passengerType}
																						</span>
																						<Badge
																							variant="outline"
																							className="text-purple-700 border-purple-300"
																						>
																							{breakdown.PassengerCount}{" "}
																							passenger
																							{breakdown.PassengerCount > 1
																								? "s"
																								: ""}
																						</Badge>
																					</div>
																					<div className="text-sm text-gray-600">
																						{breakdown.Currency || "INR"}{" "}
																						{breakdown.BaseFare.toLocaleString()}{" "}
																						+ {breakdown.Tax.toLocaleString()}{" "}
																						tax
																					</div>
																				</div>
																				<div className="text-sm text-gray-700">
																					Base Fare:{" "}
																					{breakdown.Currency || "INR"}{" "}
																					{breakdown.BaseFare.toLocaleString()}{" "}
																					| Tax: {breakdown.Currency || "INR"}{" "}
																					{breakdown.Tax.toLocaleString()} |
																					Total: {breakdown.Currency || "INR"}{" "}
																					{(
																						breakdown.BaseFare + breakdown.Tax
																					).toLocaleString()}
																				</div>
																				{breakdown.TaxBreakUp &&
																					breakdown.TaxBreakUp.length > 0 && (
																						<div className="mt-2 text-xs text-gray-600">
																							<span className="font-medium">
																								Tax Breakdown:
																							</span>{" "}
																							{breakdown.TaxBreakUp.map(
																								(tax: {
																									key: string;
																									value: number;
																								}) =>
																									`${tax.key}: ${
																										breakdown.Currency || "INR"
																									} ${tax.value}`
																							).join(", ")}
																						</div>
																					)}
																			</div>
																		);
																	}
																)}
															</div>
														</div>
													)}
											</div>
										) : (
											<div className="bg-gray-50 p-4 rounded-lg border">
												<p className="text-sm text-gray-600">
													Fare information not available in response.
												</p>
											</div>
										)}
									</div>
								);
							})()}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
