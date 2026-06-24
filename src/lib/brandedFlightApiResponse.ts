import { NextResponse } from "next/server";
import { sanitizeFlightClientResponse } from "@/lib/dharmlokFlightBranding";

/** JSON response for flight APIs with vendor names scrubbed for clients. */
export function brandedFlightJson(
	data: unknown,
	init?: ResponseInit,
): NextResponse {
	return NextResponse.json(sanitizeFlightClientResponse(data), init);
}
