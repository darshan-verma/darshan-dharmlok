"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, MapPinned } from "lucide-react";
import CabSearchForm, {
	type CabSearchData,
} from "@/components/travel-portal/CabSearchForm";
import CabQuoteCard from "@/components/travel-portal/CabQuoteCard";
import { Card } from "@/components/ui/card";
import type { TripjackQuoteResponseData } from "@/types/tripjack";

interface CabQuotesApiResponse {
	success: boolean;
	message?: string;
	data?: TripjackQuoteResponseData;
	error?: string;
	providerError?: unknown;
}

function formatTripjackDateTime(value: string) {
	return value.replace("T", " ");
}

function parseSearchData(
	searchParams: URLSearchParams | ReturnType<typeof useSearchParams>,
) {
	const origin = searchParams.get("origin");
	const destination = searchParams.get("destination");
	const pickupDateTime = searchParams.get("pickupDateTime");
	const journeyType = searchParams.get("journeyType");
	const tripType = searchParams.get("tripType");
	const passengers = searchParams.get("passengers");
	const returnDateTime = searchParams.get("returnDateTime");

	if (!origin || !destination || !pickupDateTime || !journeyType || !tripType) {
		return null;
	}

	try {
		return {
			journeyType: journeyType as CabSearchData["journeyType"],
			tripType: tripType as CabSearchData["tripType"],
			pickupDateTime,
			returnDateTime: returnDateTime || undefined,
			origin: JSON.parse(origin) as CabSearchData["origin"],
			destination: JSON.parse(destination) as CabSearchData["destination"],
			passengers: Number(passengers || "1"),
		};
	} catch {
		return null;
	}
}

function buildSearchParams(data: CabSearchData) {
	const nextSearchParams = new URLSearchParams();
	nextSearchParams.set("journeyType", data.journeyType);
	nextSearchParams.set("tripType", data.tripType);
	nextSearchParams.set("pickupDateTime", data.pickupDateTime);
	nextSearchParams.set("passengers", String(data.passengers));
	nextSearchParams.set("origin", JSON.stringify(data.origin));
	nextSearchParams.set("destination", JSON.stringify(data.destination));

	if (data.returnDateTime) {
		nextSearchParams.set("returnDateTime", data.returnDateTime);
	}

	return nextSearchParams;
}

export default function CabSearch() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchData, setSearchData] = useState<CabSearchData | null>(null);
	const [results, setResults] = useState<TripjackQuoteResponseData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const loadedSearchRef = useRef<string | null>(null);

	async function executeSearch(nextSearchData: CabSearchData) {
		if (!nextSearchData.origin || !nextSearchData.destination) {
			setError("Pickup and drop locations are required.");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSearchData(nextSearchData);

		try {
			const response = await fetch("/api/travel/cabs/quotes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					origin: nextSearchData.origin,
					destination: nextSearchData.destination,
					tripType: nextSearchData.tripType,
					journeyType: nextSearchData.journeyType,
					pickupDate: formatTripjackDateTime(nextSearchData.pickupDateTime),
					returnDate: nextSearchData.returnDateTime
						? formatTripjackDateTime(nextSearchData.returnDateTime)
						: undefined,
					passengers: nextSearchData.passengers,
					quoteFilter: {
						paxCount: nextSearchData.passengers,
					},
				}),
			});

			const payload = (await response.json()) as CabQuotesApiResponse;

			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.error || "Unable to fetch cab quotes");
			}

			setResults(payload.data);
		} catch (requestError) {
			setResults(null);
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to fetch cab quotes",
			);
		} finally {
			setIsLoading(false);
		}
	}

	function handleSearch(nextSearchData: CabSearchData) {
		const nextQuery = buildSearchParams(nextSearchData).toString();
		setSearchData(nextSearchData);

		if (nextQuery === searchParams.toString()) {
			void executeSearch(nextSearchData);
			return;
		}

		router.replace(`/travel-portal/cab-search?${nextQuery}`);
	}

	useEffect(() => {
		const parsed = parseSearchData(searchParams);
		if (!parsed) {
			return;
		}

		const signature = JSON.stringify(parsed);
		if (loadedSearchRef.current === signature) {
			return;
		}

		loadedSearchRef.current = signature;
		void executeSearch(parsed);
	}, [searchParams]);

	const totalQuotes =
		results?.quotesInfo?.reduce(
			(count, group) => count + group.quotes.length,
			0,
		) || 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl space-y-8">
				<div>
					<h1 className="text-3xl font-semibold text-gray-900">Cab Search</h1>
					<p className="mt-2 max-w-2xl text-sm text-gray-600">
						TripJack cab search is now wired into Dharmlok Travels for quotes.
						Location lookup, coordinate resolution and fare search all run
						through the local cabs API routes.
					</p>
				</div>

				<Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-sm sm:p-6">
					<CabSearchForm
						initialValues={searchData || undefined}
						onSearch={handleSearch}
						submitLabel={isLoading ? "Searching..." : "Search Cabs"}
					/>
				</Card>

				{error && (
					<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						<div className="flex items-start gap-2">
							<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
							<div>{error}</div>
						</div>
					</div>
				)}

				{isLoading && (
					<div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-gray-600">
						<Loader2 className="h-5 w-5 animate-spin" />
						Fetching TripJack cab quotes...
					</div>
				)}

				{results && !isLoading && (
					<>
						<div className="flex flex-col gap-4 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
							<div>
								<div className="flex items-center gap-2 text-sm font-medium text-amber-700">
									<MapPinned className="h-4 w-4" />
									{results.routeDetails.origin.displayAddress}
									<span className="text-gray-400">to</span>
									{results.routeDetails.destination.displayAddress}
								</div>
								<div className="mt-2 text-2xl font-semibold text-gray-900">
									{totalQuotes} quote{totalQuotes !== 1 ? "s" : ""} found
								</div>
								<div className="mt-1 text-sm text-gray-600">
									{results.journeyInfo.journeyType} •{" "}
									{results.journeyInfo.tripType}
									{results.journeyInfo.distance
										? ` • ${results.journeyInfo.distance}`
										: ""}
									{typeof results.journeyInfo.duration === "number"
										? ` • ${results.journeyInfo.duration} mins`
										: ""}
								</div>
							</div>
							<div className="text-sm text-gray-500">
								Pickup:{" "}
								{new Date(results.journeyInfo.pickupDateTime).toLocaleString()}
							</div>
						</div>

						<div className="space-y-4">
							{results.quotesInfo.map((group) =>
								group.quotes.map((quote) => (
									<CabQuoteCard
										key={`${group.label}-${quote.quoteChildId}`}
										group={group}
										quote={quote}
										journeyInfo={results.journeyInfo}
										routeDetails={results.routeDetails}
										passengers={searchData?.passengers ?? 1}
									/>
								)),
							)}
						</div>
					</>
				)}

				{!isLoading && !results && !error && (
					<div className="rounded-2xl border border-dashed border-amber-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
						Search for an airport transfer, local ride, rental or outstation cab
						to load TripJack quotes here.
					</div>
				)}
			</div>
		</div>
	);
}
