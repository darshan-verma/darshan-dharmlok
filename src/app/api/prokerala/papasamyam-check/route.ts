import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaPapasamyamCheckResponse } from "@/types/prokerala";
import {
	PAPASAMYAM_LANGUAGE_CODES,
	validateAyanamsa,
	validateKundliMatchingCoordinates,
	validateKundliMatchingDateTime,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

type PapasamyamLanguageCode = (typeof PAPASAMYAM_LANGUAGE_CODES)[number];

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const girlCoordinatesRaw = searchParams.get("girl_coordinates");
	const girlDobRaw = searchParams.get("girl_dob");
	const boyCoordinatesRaw = searchParams.get("boy_coordinates");
	const boyDobRaw = searchParams.get("boy_dob");
	const laRaw = searchParams.get("la");

	const ayanamsaValidation = validateAyanamsa(ayanamsaRaw);
	if (!ayanamsaValidation.ok) {
		return NextResponse.json(
			{ error: ayanamsaValidation.error, allowed: ayanamsaValidation.allowed },
			{ status: 400 }
		);
	}

	const girlCoordinatesValidation = validateKundliMatchingCoordinates(
		girlCoordinatesRaw,
		"girl_coordinates"
	);
	if (!girlCoordinatesValidation.ok) {
		return NextResponse.json({ error: girlCoordinatesValidation.error }, { status: 400 });
	}

	const girlDobValidation = validateKundliMatchingDateTime(girlDobRaw, "girl_dob");
	if (!girlDobValidation.ok) {
		return NextResponse.json({ error: girlDobValidation.error }, { status: 400 });
	}

	const boyCoordinatesValidation = validateKundliMatchingCoordinates(
		boyCoordinatesRaw,
		"boy_coordinates"
	);
	if (!boyCoordinatesValidation.ok) {
		return NextResponse.json({ error: boyCoordinatesValidation.error }, { status: 400 });
	}

	const boyDobValidation = validateKundliMatchingDateTime(boyDobRaw, "boy_dob");
	if (!boyDobValidation.ok) {
		return NextResponse.json({ error: boyDobValidation.error }, { status: 400 });
	}

	const laValidation = validateLanguage<PapasamyamLanguageCode>(
		laRaw,
		PAPASAMYAM_LANGUAGE_CODES
	);
	if (!laValidation.ok) {
		return NextResponse.json(
			{ error: laValidation.error, allowed: laValidation.allowed },
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		girl_coordinates: girlCoordinatesValidation.value,
		girl_dob: girlDobValidation.value,
		boy_coordinates: boyCoordinatesValidation.value,
		boy_dob: boyDobValidation.value,
		la: laValidation.value ?? "en",
	};

	try {
		const response = await prokeralaFetch<ProkeralaPapasamyamCheckResponse>(
			"astrology/papasamyam-check",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala papasamyam-check API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Papasamyam check request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

