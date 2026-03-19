import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetchPost } from "@/lib/prokeralaClient";
import type { ProkeralaBatchCompatibilityResponse } from "@/types/prokerala";

const COMPATIBILITY_SYSTEMS = ["kerala", "tamil", "guna-milan"] as const;
type CompatibilitySystem = (typeof COMPATIBILITY_SYSTEMS)[number];

type BatchProfile = Record<string, unknown>;

interface BatchCompatibilityBody {
	profile: BatchProfile;
	match_profiles: BatchProfile[];
	compatibility_system: CompatibilitySystem;
	[key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompatibilitySystem(value: unknown): value is CompatibilitySystem {
	return (
		typeof value === "string" &&
		COMPATIBILITY_SYSTEMS.includes(value as CompatibilitySystem)
	);
}

function parseTextHtmlJsonBody(raw: string): { ok: true; value: unknown } | {
	ok: false;
	error: string;
} {
	try {
		return { ok: true, value: JSON.parse(raw) };
	} catch {
		return {
			ok: false,
			error:
				"Invalid body: expected JSON string in request text (Content-Type: text/html).",
		};
	}
}

export async function POST(request: NextRequest) {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("text/html")) {
		return NextResponse.json(
			{
				error:
					"Invalid Content-Type: expected text/html with JSON string body.",
			},
			{ status: 400 }
		);
	}

	const raw = await request.text();
	const parsed = parseTextHtmlJsonBody(raw);
	if (!parsed.ok) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	if (!isRecord(parsed.value)) {
		return NextResponse.json(
			{ error: "Invalid body: expected a JSON object." },
			{ status: 400 }
		);
	}

	const { profile, match_profiles, compatibility_system } = parsed.value;

	if (!isRecord(profile)) {
		return NextResponse.json(
			{ error: "Invalid body: profile must be an object." },
			{ status: 400 }
		);
	}

	if (!Array.isArray(match_profiles)) {
		return NextResponse.json(
			{ error: "Invalid body: match_profiles must be an array." },
			{ status: 400 }
		);
	}

	if (match_profiles.length < 1 || match_profiles.length > 500) {
		return NextResponse.json(
			{
				error:
					"Invalid body: match_profiles length must be between 1 and 500.",
			},
			{ status: 400 }
		);
	}

	if (!isCompatibilitySystem(compatibility_system)) {
		return NextResponse.json(
			{
				error: "Invalid compatibility_system",
				allowed: COMPATIBILITY_SYSTEMS,
			},
			{ status: 400 }
		);
	}

	const body: BatchCompatibilityBody = {
		profile: profile as BatchProfile,
		match_profiles: match_profiles as BatchProfile[],
		compatibility_system,
	};

	try {
		const response = await prokeralaFetchPost<ProkeralaBatchCompatibilityResponse>(
			"astrology/batch-compatibility",
			{ body }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala batch-compatibility API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Batch compatibility request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

