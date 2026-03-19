import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaNakshatraPoruthamResponse } from "@/types/prokerala";
import {
	validateNakshatraId,
	validateNakshatraPada,
} from "@/app/api/prokerala/_validation";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const girlNakshatraRaw = searchParams.get("girl_nakshatra");
	const girlNakshatraPadaRaw = searchParams.get("girl_nakshatra_pada");
	const boyNakshatraRaw = searchParams.get("boy_nakshatra");
	const boyNakshatraPadaRaw = searchParams.get("boy_nakshatra_pada");

	const girlNakshatraValidation = validateNakshatraId(
		girlNakshatraRaw,
		"girl_nakshatra"
	);
	if (!girlNakshatraValidation.ok) {
		return NextResponse.json({ error: girlNakshatraValidation.error }, { status: 400 });
	}

	const girlNakshatraPadaValidation = validateNakshatraPada(
		girlNakshatraPadaRaw,
		"girl_nakshatra_pada"
	);
	if (!girlNakshatraPadaValidation.ok) {
		return NextResponse.json(
			{ error: girlNakshatraPadaValidation.error },
			{ status: 400 }
		);
	}

	const boyNakshatraValidation = validateNakshatraId(
		boyNakshatraRaw,
		"boy_nakshatra"
	);
	if (!boyNakshatraValidation.ok) {
		return NextResponse.json({ error: boyNakshatraValidation.error }, { status: 400 });
	}

	const boyNakshatraPadaValidation = validateNakshatraPada(
		boyNakshatraPadaRaw,
		"boy_nakshatra_pada"
	);
	if (!boyNakshatraPadaValidation.ok) {
		return NextResponse.json(
			{ error: boyNakshatraPadaValidation.error },
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		girl_nakshatra: String(girlNakshatraValidation.value),
		girl_nakshatra_pada: String(girlNakshatraPadaValidation.value),
		boy_nakshatra: String(boyNakshatraValidation.value),
		boy_nakshatra_pada: String(boyNakshatraPadaValidation.value),
	};

	try {
		const response = await prokeralaFetch<ProkeralaNakshatraPoruthamResponse>(
			"astrology/nakshatra-porutham",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala nakshatra-porutham API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Nakshatra porutham request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
