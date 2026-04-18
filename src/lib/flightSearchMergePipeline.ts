import { calculateNetPayable } from "@/lib/tboFareCalculations";
import {
	capMergedResultsByLeg,
	countFlightsBySource,
	mergeAndCapRoundTrip,
} from "@/lib/flightSearchMerge";
import type { FlightResult, FlightSearchResponse } from "@/types/tbo";

export interface MergedFlightSearchResponse {
	Response: {
		TraceId: string;
		Results: FlightSearchResponse["Response"]["Results"];
		TboResults: FlightSearchResponse["Response"]["Results"];
		AiriqResults: FlightSearchResponse["Response"]["Results"];
		TripjackResults: FlightSearchResponse["Response"]["Results"];
		Error?: unknown;
	};
}

/**
 * Race a promise against a timeout. The underlying work keeps running if the timeout fires.
 */
export function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	_label?: string,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const t = setTimeout(() => {
			reject(new Error(_label ? `${_label} timeout` : "timeout"));
		}, ms);
		promise.then(
			(v) => {
				clearTimeout(t);
				resolve(v);
			},
			(e) => {
				clearTimeout(t);
				reject(e);
			},
		);
	});
}

export function mergeProviderResponses(
	tboFlights: FlightSearchResponse | null,
	airiqFlights: FlightSearchResponse | null,
	tripjackFlights: FlightSearchResponse | null,
	journeyType: string,
): {
	mergedResults: MergedFlightSearchResponse;
	preMergeFlat: FlightResult[];
	preCounts: ReturnType<typeof countFlightsBySource>;
	tboFlightCount: number;
	airiqFlightCount: number;
	tripjackFlightCount: number;
	totalFlightOptions: number;
} {
	const mergedResults: MergedFlightSearchResponse = {
		Response: {
			TraceId:
				tboFlights?.Response?.TraceId ||
				airiqFlights?.Response?.TraceId ||
				tripjackFlights?.Response?.TraceId ||
				"",
			Results: [],
			TboResults: tboFlights?.Response?.Results || [],
			AiriqResults: airiqFlights?.Response?.Results || [],
			TripjackResults: tripjackFlights?.Response?.Results || [],
			Error:
				(tboFlights as { Response?: { Error?: unknown } })?.Response?.Error ||
				(airiqFlights as { Response?: { Error?: unknown } })?.Response?.Error,
		},
	};

	if (
		tboFlights?.Response?.Results &&
		Array.isArray(tboFlights.Response.Results)
	) {
		mergedResults.Response.Results = [...tboFlights.Response.Results];
	}

	if (
		airiqFlights?.Response?.Results &&
		Array.isArray(airiqFlights.Response.Results)
	) {
		if (mergedResults.Response.Results.length === 0) {
			mergedResults.Response.Results = [...airiqFlights.Response.Results];
		} else {
			for (let i = 0; i < airiqFlights.Response.Results.length; i++) {
				if (mergedResults.Response.Results[i]) {
					mergedResults.Response.Results[i] = [
						...mergedResults.Response.Results[i],
						...airiqFlights.Response.Results[i],
					];
				} else {
					mergedResults.Response.Results[i] =
						airiqFlights.Response.Results[i];
				}
			}
		}
	}

	if (
		tripjackFlights?.Response?.Results &&
		Array.isArray(tripjackFlights.Response.Results)
	) {
		if (mergedResults.Response.Results.length === 0) {
			mergedResults.Response.Results = [...tripjackFlights.Response.Results];
		} else {
			for (let i = 0; i < tripjackFlights.Response.Results.length; i++) {
				if (mergedResults.Response.Results[i]) {
					mergedResults.Response.Results[i] = [
						...mergedResults.Response.Results[i],
						...tripjackFlights.Response.Results[i],
					];
				} else {
					mergedResults.Response.Results[i] =
						tripjackFlights.Response.Results[i];
				}
			}
		}
	}

	const preMergeFlat: FlightResult[] = [];
	if (mergedResults?.Response?.Results) {
		for (const resultArray of mergedResults.Response.Results) {
			if (resultArray && Array.isArray(resultArray)) {
				preMergeFlat.push(...(resultArray as FlightResult[]));
			}
		}
	}
	const preCounts = countFlightsBySource(preMergeFlat);

	if (mergedResults?.Response?.Results?.length) {
		if (journeyType === "2") {
			const paired = mergeAndCapRoundTrip(
				mergedResults.Response.Results as FlightResult[][],
			);
			mergedResults.Response.Results = [paired];
		} else {
			mergedResults.Response.Results = capMergedResultsByLeg(
				mergedResults.Response.Results as FlightResult[][],
			);
		}
	}

	if (mergedResults?.Response?.Results) {
		for (const resultArray of mergedResults.Response.Results) {
			if (resultArray && Array.isArray(resultArray)) {
				for (const flight of resultArray) {
					if (flight?.Fare && !flight.Fare.NetPayable) {
						flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
					}
				}
			}
		}
	}

	let tboFlightCount = 0;
	let airiqFlightCount = 0;
	let tripjackFlightCount = 0;
	let totalFlightOptions = 0;

	if (mergedResults?.Response?.Results) {
		const flat: FlightResult[] = [];
		for (const resultArray of mergedResults.Response.Results) {
			if (resultArray && Array.isArray(resultArray)) {
				flat.push(...(resultArray as FlightResult[]));
			}
		}
		const post = countFlightsBySource(flat);
		tboFlightCount = post.tbo;
		airiqFlightCount = post.airiq;
		tripjackFlightCount = post.tripjack;
		totalFlightOptions = flat.length;
	}

	return {
		mergedResults,
		preMergeFlat,
		preCounts,
		tboFlightCount,
		airiqFlightCount,
		tripjackFlightCount,
		totalFlightOptions,
	};
}
