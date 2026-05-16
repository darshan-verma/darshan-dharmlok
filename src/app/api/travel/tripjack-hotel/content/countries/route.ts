import { NextResponse } from "next/server";
import { fetchTripjackHotelContentCountries } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";

export const maxDuration = 60;

export async function GET() {
	try {
		const result = await fetchTripjackHotelContentCountries();
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack fetch-countries failed",
		);
		return NextResponse.json(
			{
				error: resolved.message,
				...(resolved.providerError ? { providerError: resolved.providerError } : {}),
			},
			{ status: resolved.status },
		);
	}
}
