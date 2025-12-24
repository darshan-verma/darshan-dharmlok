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
	journeyType?: number; // 1=one-way,2=roundtrip,3=multicity
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
				// include returnResultIndex when provided (some APIs expect pairing for round-trip)
				if (typeof returnResultIndex !== "undefined" && returnResultIndex) {
					body.ReturnResultIndex = returnResultIndex;
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
		adultCount,
		childCount,
		infantCount,
		preloadedUpsell,
	]);

	// No upsell for multicity
	if (journeyType === 3) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[96vw] max-w-none">
				<DialogHeader>
					<DialogTitle>
						Flight Details and Fare Options available for you!
					</DialogTitle>
					{flight && (
						<div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
							<div className="flex items-center gap-2">
								{flight?.Segments && flight.Segments[0] && (
									<AirlineLogo
										airlineCode={
											flight.Segments[0][0]?.Airline?.AirlineCode || ""
										}
										airlineName={
											flight.Segments[0][0]?.Airline?.AirlineName || ""
										}
										size="sm"
									/>
								)}
								<div>
									<div className="font-medium">{flight.AirlineCode || ""}</div>
									<div className="text-xs text-gray-500">
										{flight.Segments &&
											flight.Segments[0] &&
											`${
												flight.Segments[0][0]?.Origin?.Airport?.CityCode || "--"
											} → ${
												flight.Segments[0][flight.Segments[0].length - 1]
													?.Destination?.Airport?.CityCode || "--"
											}`}
									</div>
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
