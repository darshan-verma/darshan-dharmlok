import { NextRequest, NextResponse } from "next/server";
import { getTripjackHotelStaticDetail } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const hid = body.hid;

	if (!hid || typeof hid !== "string") {
		return NextResponse.json({ error: "hid is required" }, { status: 400 });
	}

	try {
		const { data, providerCoreMissing } = await getTripjackHotelStaticDetail(hid);

		if (process.env.NODE_ENV === "development") {
			const sample =
				process.env.TRIPJACK_DEBUG_STATIC === "1"
					? JSON.stringify(data).slice(0, 4000)
					: null;
			console.log(
				"[tripjack static-detail]",
				JSON.stringify({
					hid,
					providerCoreMissing,
					topKeys: Object.keys(data),
					hasImages: Array.isArray(data.images) ? data.images.length : 0,
					hasLocale: Boolean(data.locale),
					nameLen: data.name?.length ?? 0,
				}),
			);
			if (sample) console.log("[tripjack static-detail] sample payload:", sample);
		}

		return NextResponse.json({
			success: true,
			data,
			meta: { incompleteStatic: providerCoreMissing },
		});
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel static detail request failed",
		);
		return NextResponse.json(
			{
				success: false,
				error: resolved.message,
				...(resolved.providerError
					? { providerError: resolved.providerError }
					: {}),
			},
			{ status: resolved.status },
		);
	}
}
