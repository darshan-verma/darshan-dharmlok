/**
 * Doc-aligned unified hotel search contract (multi-supplier).
 * Live listing rows are also returned as {@link import("./hotelApi").HotelResult} for UI compatibility.
 */

import type { HotelResult } from "@/types/hotelApi";

export type UnifiedSearchMode = "tbo" | "tripjack" | "all";

export type UnifiedHotelSearchRoom = {
	adults: number;
	children?: number;
	childAge?: number[];
};

export type UnifiedHotelSearchRequest = {
	/** TBO city code from autocomplete (primary until Destination backfill is complete) */
	cityCode?: string;
	/** Canonical destination label — resolved via Destination + SupplierCityMapping when populated */
	destination?: string;
	checkIn: string;
	checkOut: string;
	rooms: UnifiedHotelSearchRoom[];
	/** TripJack nationality `countryId` */
	nationality?: string;
	/** TBO guest nationality ISO-2, default IN */
	guestNationality?: string;
	mode?: UnifiedSearchMode;
	/** When true, apply name+city dedupe across suppliers */
	dedupe?: boolean;
};

export type UnifiedSupplierError = {
	code: string;
	message: string;
};

export type UnifiedHotelSearchResponse = {
	success: boolean;
	mode: UnifiedSearchMode;
	hotels: HotelResult[];
	errors: {
		tbo?: UnifiedSupplierError;
		tripjack?: UnifiedSupplierError;
	};
	tripjackCorrelationId?: string;
	/** Echo resolved TBO city for client cache keys */
	cityCode?: string;
	/** Present on HTTP 500 from route handler */
	error?: string;
};
