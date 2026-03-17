import Link from "next/link";
import {
	getFareQuote,
	getFareUpsell,
	getSSR,
} from "@/lib/tboClient";
import { FareUpsellResponse, FlightResult } from "@/types/tbo";
import { XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		apiSource?: string; // "TBO" or "AIRiQ"
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
		apiSource = "TBO",
	} = params;

	const isUpsellAllowed = isUpsellAllowedParam === "true";

	if (!traceId || !resultIndex) {
		return (
			<div className="p-4">
				Missing booking details. Please search for a flight first.
			</div>
		);
	}

	// Route to AIRiQ booking page if using AIRiQ API
	if (apiSource === "AIRiQ") {
		// Import dynamically to avoid circular dependencies
		const { default: AiriqBookingPage } = await import("./airiq-page");
		return (
			<AiriqBookingPage
				traceId={traceId}
				resultIndex={resultIndex}
				returnResultIndex={returnResultIndex}
				adultCount={adultCount}
				childCount={childCount}
				infantCount={infantCount}
				isUpsellAllowed={isUpsellAllowed}
			/>
		);
	}

	// Continue with TBO booking flow (fare rules via API route for consistency)
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
	const fareRulePromise = fetch(`${baseUrl}/api/travel/fare-rules`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			TraceId: traceId,
			ResultIndex: resultIndex,
			EndUserIp: "192.168.1.1",
		}),
	}).then(async (res) => {
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: res.statusText }));
			throw new Error(err.error || "Failed to fetch fare rules");
		}
		return res.json();
	});

	const fareUpsellPromise = isUpsellAllowed
		? getFareUpsell({
				TraceId: traceId,
				ResultIndex: resultIndex,
				EndUserIp: "192.168.1.1",
				...(returnResultIndex && { ReturnResultIndex: returnResultIndex }),
		  }).then((result) => {
				console.log("=== Fare Upsell API Success ===");
				console.log("Raw API response:", JSON.stringify(result, null, 2));
				return result;
		  })
		: Promise.resolve(null);

	const ssrPromise = getSSR({
		TraceId: traceId,
		ResultIndex: resultIndex,
		EndUserIp: "192.168.1.1",
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

	// TBO FareQuote Response.Error / ResponseStatus (doc: 1=Successfull, 2=Failed, 3=InValidRequest, 4=InValidSession, 5=InValidCredentials)
	const responseError = fareQuoteResponse?.Response?.Error;
	const responseStatus = fareQuoteResponse?.Response?.ResponseStatus;
	if (responseError && responseError.ErrorCode !== 0) {
		const msg = responseError.ErrorMessage || "Fare quote failed.";
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
							<XCircle className="h-6 w-6" />
							Fare Quote Unavailable
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-gray-600">{msg}</p>
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
	if (responseStatus !== undefined && responseStatus !== 1) {
		const statusMessages: Record<number, string> = {
			0: "Fare quote request could not be processed.",
			2: "Fare quote failed.",
			3: "Invalid request. Please search again.",
			4: "Your session has expired. Please search again.",
			5: "Invalid credentials.",
		};
		const msg = statusMessages[responseStatus] ?? "Fare quote is unavailable.";
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
							<XCircle className="h-6 w-6" />
							Fare Quote Unavailable
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-gray-600">{msg}</p>
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

	let flightResult: FlightResult = fareQuoteResponse.Response.Results;

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

	// Fetch additional data with error handling for invalid result index
	let fareRules, fareUpsell, ssrResponse;
	try {
		[fareRules, fareUpsell, ssrResponse] = await Promise.all([
			fareRulePromise.catch((e) => {
				console.error("Error fetching fare rules", e);
				return null;
			}),
			fareUpsellPromise.catch((e) => {
				console.error("Error fetching fare upsell", e);
				return null;
			}),
			ssrPromise.catch((e) => {
				console.error("Error fetching SSR", e);
				return null;
			}),
		]);
	} catch (e) {
		console.error("Error fetching additional booking data", e);
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
		// For other errors, continue with null values
		fareRules = null;
		fareUpsell = null;
		ssrResponse = null;
	}
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

	// Price RBD Logic was here, but we can rely on BookingClient logic for display or pass it if needed.
	// But mostly BookingClient uses flightResult.Fare for base calculation + SSRs.
	// We will omit passing priceRBDResponse for now as the new layout uses FlightResult.Fare.

	return (
		<main className="min-h-screen bg-gray-50/50 pb-20">
			<BookingClient
				adultCount={parseInt(adultCount)}
				childCount={parseInt(childCount)}
				infantCount={parseInt(infantCount)}
				traceId={traceId}
				resultIndex={resultIndex}
				flightResult={flightResult}
				upsellOptions={upsellOptions}
				isUpsellAllowed={isUpsellAllowed}
				fareRules={fareRules}
			/>
		</main>
	);
}
