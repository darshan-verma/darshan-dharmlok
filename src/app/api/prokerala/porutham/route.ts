import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaPoruthamResponse } from "@/types/prokerala";
import {
	PORUTHAM_LANGUAGE_CODES,
	PORUTHAM_SYSTEMS,
	type PoruthamSystem,
	validateAyanamsa,
	validateKundliMatchingCoordinates,
	validateKundliMatchingDateTime,
	validateLanguage,
	validatePoruthamSystem,
} from "@/app/api/prokerala/_validation";

type PoruthamLanguageCode = (typeof PORUTHAM_LANGUAGE_CODES)[number];

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const girlCoordinatesRaw = searchParams.get("girl_coordinates");
	const girlDobRaw = searchParams.get("girl_dob");
	const boyCoordinatesRaw = searchParams.get("boy_coordinates");
	const boyDobRaw = searchParams.get("boy_dob");
	const systemRaw = searchParams.get("system");
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

	const systemValidation = validatePoruthamSystem(systemRaw);
	if (!systemValidation.ok) {
		return NextResponse.json(
			{ error: systemValidation.error, allowed: systemValidation.allowed },
			{ status: 400 }
		);
	}

	const laValidation = validateLanguage<PoruthamLanguageCode>(
		laRaw,
		PORUTHAM_LANGUAGE_CODES
	);
	if (!laValidation.ok) {
		return NextResponse.json(
			{ error: laValidation.error, allowed: laValidation.allowed },
			{ status: 400 }
		);
	}

	const system: PoruthamSystem = systemValidation.value;
	if (!PORUTHAM_SYSTEMS.includes(system)) {
		return NextResponse.json(
			{ error: "Invalid system", allowed: PORUTHAM_SYSTEMS },
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		girl_coordinates: girlCoordinatesValidation.value,
		girl_dob: girlDobValidation.value,
		boy_coordinates: boyCoordinatesValidation.value,
		boy_dob: boyDobValidation.value,
		system,
		la: laValidation.value ?? "en",
	};

	try {
		const response = await prokeralaFetch<ProkeralaPoruthamResponse>(
			"astrology/porutham",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala porutham API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Porutham request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

