"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
// Tabs replaced by shared FareUpsellList UI
import FareUpsellList from "./FareUpsellList";
import { Loader2 } from "lucide-react";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import type { FlightResult } from "@/types/tbo";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";
import { tboSeparateReturnResultIndex } from "@/lib/tboFlightSearch";

interface FareUpsellRequestBody {
	TraceId: string;
	ResultIndex: string;
	EndUserIp: string;
	ReturnResultIndex?: string;
	AdultCount?: number;
	ChildCount?: number;
	InfantCount?: number;
}

interface UpsellModalProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	traceId: string;
	resultIndex: string;
	returnResultIndex?: string | null;
	journeyType?: number | string; // 1=one-way, 2=return, 3=multicity, 5=special return
	adultCount?: number;
	childCount?: number;
	infantCount?: number;
	flight?: FlightResult | null;
	preloadedUpsell?: FlightResult[] | null; // Preloaded upsell data
}

export default function UpsellModal({
	open,
	onOpenChange,
	traceId,
	resultIndex,
	returnResultIndex,
	journeyType = 1,
	adultCount,
	childCount,
	infantCount,
	flight = null,
	preloadedUpsell = null,
}: UpsellModalProps) {
	const [loading, setLoading] = useState(false);
	const [upsellResults, setUpsellResults] = useState<FlightResult[] | null>(
		null
	);
	const [rawResponse, setRawResponse] = useState<any | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
	const [showDebug, setShowDebug] = useState(false);

	useEffect(() => {
		if (!open) return;
		let mounted = true;

		// Capture snapshot when fare rules/upsell modal opens
		if (flight) {
			captureAndSendSnapshot(
				{
					flightResult: flight,
					upsellOptions: preloadedUpsell || [],
					traceId,
					resultIndex,
				},
				{
					page: "flight_results", // Fare rules shown on results page
					user: {},
					booking: {
						type: "flight",
						traceId,
						resultIndex,
					},
				}
			).catch(() => {
				// Silently fail - don't block user flow
			});
		}

		// If we have preloaded data, use it immediately
		if (preloadedUpsell !== null) {
			setUpsellResults(preloadedUpsell);
			setLoading(false);
			return;
		}

		// Otherwise, fetch the data
		async function fetchUpsell() {
			setLoading(true);
			try {
				// EndUserIp can be empty string; server will ignore if not required
				const body: FareUpsellRequestBody = {
					TraceId: traceId,
					ResultIndex: resultIndex,
					EndUserIp: "",
				};
				const pairedReturn = tboSeparateReturnResultIndex(
					resultIndex,
					returnResultIndex ?? undefined,
					String(journeyType),
				);
				if (pairedReturn) {
					body.ReturnResultIndex = pairedReturn;
				}
				if (typeof adultCount !== "undefined") body.AdultCount = adultCount;
				if (typeof childCount !== "undefined") body.ChildCount = childCount;
				if (typeof infantCount !== "undefined") body.InfantCount = infantCount;

				// Call server-side proxy route so we don't run server-only TBO client in the browser
				const response = await fetch("/api/travel/fare-upsell", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				const json = await response.json();
				if (!mounted) return;
				if (!response.ok || !json?.success) {
					// Save raw response/error for debugging
					setRawResponse(json || { error: "Failed to fetch upsell" });
					setUpsellResults([]);
				} else {
					const res = json.data;
					setRawResponse(res);
					const results = res?.Response?.Results || [];
					console.log("FareUpsell response:", res);
					setUpsellResults(results);
				}
			} catch (e) {
				console.error("Failed to fetch upsell:", e);
				setRawResponse(e);
				setUpsellResults([]);
			} finally {
				if (mounted) setLoading(false);
			}
		}
		fetchUpsell();
		return () => {
			mounted = false;
		};
	}, [
		open,
		traceId,
		resultIndex,
		returnResultIndex,
		journeyType,
		adultCount,
		childCount,
		infantCount,
		preloadedUpsell,
		flight,
	]);

	// No upsell for multicity
	if (journeyType === 3) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[60vw] w-full max-w-[60vw] max-h-[60vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Flight Details and Fare Options available for you!
					</DialogTitle>
					{flight && flight.Segments && flight.Segments[0] && (
						<div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							{/* Route Info */}
							<div className="flex items-center gap-3">
								<div className="bg-white p-2 rounded-full shadow-sm border">
									<AirlineLogo
										airlineCode={flight.Segments[0][0]?.Airline?.AirlineCode}
										airlineName={flight.Segments[0][0]?.Airline?.AirlineName}
										size="md"
									/>
								</div>
								<div>
									<div className="flex items-center gap-2 text-lg font-bold text-slate-800">
										<span>{flight.Segments[0][0]?.Origin?.Airport?.CityCode}</span>
										<span className="text-slate-400">→</span>
										<span>
											{
												flight.Segments[0][flight.Segments[0].length - 1]
													?.Destination?.Airport?.CityCode
											}
										</span>
									</div>
									<div className="text-sm text-slate-500 font-medium">
										{flight.Segments[0][0]?.Airline?.AirlineName}
										<span className="mx-2">•</span>
										{flight.Segments[0][0]?.Airline?.AirlineCode}-
										{flight.Segments[0][0]?.Airline?.FlightNumber}
									</div>
								</div>
							</div>

							{/* Date Info */}
							<div className="text-left sm:text-right">
								<div className="text-sm font-semibold text-slate-700">
									{new Date(flight.Segments[0][0]?.Origin?.DepTime).toLocaleDateString(
										"en-IN",
										{
											weekday: "short",
											day: "numeric",
											month: "short",
											year: "numeric",
										}
									)}
								</div>
								<div className="text-xs text-slate-500">
									Departs{" "}
									{new Date(flight.Segments[0][0]?.Origin?.DepTime).toLocaleTimeString(
										"en-IN",
										{
											hour: "2-digit",
											minute: "2-digit",
										}
									)}
								</div>
							</div>
						</div>
					)}
				</DialogHeader>

				<div className="mt-4 overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center p-6">
							<Loader2 className="h-6 w-6 animate-spin text-gray-500" />
						</div>
					) : !upsellResults || upsellResults.length === 0 ? (
						<div className="p-6 text-center text-gray-600">
							<div>No upsell options available.</div>
							<div className="mt-3 text-xs text-gray-500">
								If you believe upsells should be available, toggle debug to
								inspect the API response.
							</div>
							<div className="mt-3">
								<button
									className="text-xs text-blue-600 underline"
									onClick={() => setShowDebug((s) => !s)}
								>
									{showDebug ? "Hide debug" : "Show debug response"}
								</button>
							</div>
							{showDebug && (
								<div className="mt-3 text-left bg-gray-50 p-3 rounded border text-xs overflow-auto max-h-48">
									<div className="font-medium mb-2">Request Params</div>
									<pre className="whitespace-pre-wrap">
										{JSON.stringify(
											{
												TraceId: traceId,
												ResultIndex: resultIndex,
												ReturnResultIndex: returnResultIndex,
												journeyType,
												adultCount,
												childCount,
												infantCount,
											},
											null,
											2
										)}
									</pre>
									<div className="font-medium mt-2 mb-2">Raw Response</div>
									<pre className="whitespace-pre-wrap">
										{JSON.stringify(rawResponse, null, 2)}
									</pre>
								</div>
							)}
						</div>
					) : (
						<div className="mt-4">
							<FareUpsellList
								upsellOptions={upsellResults || []}
								isUpsellAllowed={true}
								traceId={traceId}
								returnResultIndex={returnResultIndex}
								journeyType={journeyType}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								fallbackFareCurrency={undefined}
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
