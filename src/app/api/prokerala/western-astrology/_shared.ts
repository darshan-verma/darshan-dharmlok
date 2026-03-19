import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch, prokeralaFetchChart } from "@/lib/prokeralaClient";
import {
	validateAyanamsa,
	validateLanguage,
	validateWesternAspectFilter,
	validateWesternBirthTimeRectification,
	validateWesternCurrentCoordinates,
	validateWesternDateTime,
	validateWesternHouseSystem,
	validateWesternOrb,
	validateWesternProgressionYear,
	validateWesternRelationshipChartType,
	validateWesternSolarReturnYear,
} from "@/app/api/prokerala/_validation";

type JsonObject = Record<string, unknown>;
type StringQuery = Record<string, string>;

type ParseOk = { ok: true; query: StringQuery };
type ParseFail = { ok: false; response: NextResponse };

function validationError(error: string, allowed?: readonly unknown[]): NextResponse {
	if (allowed) {
		return NextResponse.json({ error, allowed }, { status: 400 });
	}
	return NextResponse.json({ error }, { status: 400 });
}

function parseProfileField(
	searchParams: URLSearchParams,
	paramName: "profile" | "primary_profile" | "secondary_profile"
): { ok: true; datetime: string; coordinates: string } | ParseFail {
	const datetimeKey = `${paramName}[datetime]`;
	const coordinatesKey = `${paramName}[coordinates]`;

	const nestedDatetime = searchParams.get(datetimeKey);
	const nestedCoordinates = searchParams.get(coordinatesKey);
	if (
		nestedDatetime != null &&
		nestedDatetime.trim() !== "" &&
		nestedCoordinates != null &&
		nestedCoordinates.trim() !== ""
	) {
		const datetimeValidation = validateWesternDateTime(
			nestedDatetime,
			"transit_datetime"
		);
		if (!datetimeValidation.ok) {
			return {
				ok: false,
				response: validationError(
					`Invalid ${datetimeKey}: ${datetimeValidation.error.replace(
						"transit_datetime",
						datetimeKey
					)}`
				),
			};
		}

		const coordinatesValidation = validateWesternCurrentCoordinates(nestedCoordinates);
		if (!coordinatesValidation.ok) {
			return {
				ok: false,
				response: validationError(
					`Invalid ${coordinatesKey}: ${coordinatesValidation.error.replace(
						"current_coordinates",
						coordinatesKey
					)}`
				),
			};
		}

		return {
			ok: true,
			datetime: datetimeValidation.value,
			coordinates: coordinatesValidation.value,
		};
	}

	const packed = searchParams.get(paramName);
	if (packed == null || packed.trim() === "") {
		return {
			ok: false,
			response: validationError(`Missing required query parameter: ${paramName}`),
		};
	}

	try {
		const parsed = JSON.parse(packed) as { datetime?: unknown; coordinates?: unknown };
		const datetimeRaw = typeof parsed.datetime === "string" ? parsed.datetime : null;
		const coordinatesRaw =
			typeof parsed.coordinates === "string" ? parsed.coordinates : null;

		const datetimeValidation = validateWesternDateTime(datetimeRaw, "transit_datetime");
		if (!datetimeValidation.ok) {
			return {
				ok: false,
				response: validationError(
					`Invalid ${paramName}.datetime: ${datetimeValidation.error.replace(
						"transit_datetime",
						`${paramName}.datetime`
					)}`
				),
			};
		}

		const coordinatesValidation = validateWesternCurrentCoordinates(coordinatesRaw);
		if (!coordinatesValidation.ok) {
			return {
				ok: false,
				response: validationError(
					`Invalid ${paramName}.coordinates: ${coordinatesValidation.error.replace(
						"current_coordinates",
						`${paramName}.coordinates`
					)}`
				),
			};
		}

		return {
			ok: true,
			datetime: datetimeValidation.value,
			coordinates: coordinatesValidation.value,
		};
	} catch {
		return {
			ok: false,
			response: validationError(
				`Invalid ${paramName}: expected JSON like {"datetime":"...","coordinates":"lat,lng"} or bracket params ${datetimeKey} and ${coordinatesKey}`
			),
		};
	}
}

function withOptionalCommon(
	searchParams: URLSearchParams,
	query: StringQuery
): ParseOk | ParseFail {
	const birthRectificationValidation = validateWesternBirthTimeRectification(
		searchParams.get("birth_time_rectification")
	);
	if (!birthRectificationValidation.ok) {
		return { ok: false, response: validationError(birthRectificationValidation.error) };
	}

	const aspectFilterValidation = validateWesternAspectFilter(
		searchParams.get("aspect_filter")
	);
	if (!aspectFilterValidation.ok) {
		return {
			ok: false,
			response: validationError(
				aspectFilterValidation.error,
				aspectFilterValidation.allowed
			),
		};
	}

	const ayanamsaRaw = searchParams.get("ayanamsa");
	if (ayanamsaRaw != null && ayanamsaRaw.trim() !== "") {
		const ayanamsaValidation = validateAyanamsa(ayanamsaRaw);
		if (!ayanamsaValidation.ok) {
			return {
				ok: false,
				response: validationError(ayanamsaValidation.error, ayanamsaValidation.allowed),
			};
		}
		query.ayanamsa = String(ayanamsaValidation.value);
	}

	const laValidation = validateLanguage(searchParams.get("la"), ["en", "hi", "ta", "te", "ml"]);
	if (!laValidation.ok) {
		return { ok: false, response: validationError(laValidation.error, laValidation.allowed) };
	}

	if (birthRectificationValidation.value != null) {
		query.birth_time_rectification = birthRectificationValidation.value;
	}
	if (aspectFilterValidation.value != null) {
		query.aspect_filter = aspectFilterValidation.value;
	}
	if (laValidation.value != null) {
		query.la = laValidation.value;
	}

	return { ok: true, query };
}

export function parseNatalParams(searchParams: URLSearchParams): ParseOk | ParseFail {
	const profileValidation = parseProfileField(searchParams, "profile");
	if (!profileValidation.ok) return profileValidation;
	const houseSystemValidation = validateWesternHouseSystem(
		searchParams.get("house_system")
	);
	if (!houseSystemValidation.ok) {
		return {
			ok: false,
			response: validationError(houseSystemValidation.error, houseSystemValidation.allowed),
		};
	}
	const orbValidation = validateWesternOrb(searchParams.get("orb"));
	if (!orbValidation.ok) {
		return { ok: false, response: validationError(orbValidation.error) };
	}

	return withOptionalCommon(searchParams, {
		"profile[datetime]": profileValidation.datetime,
		"profile[coordinates]": profileValidation.coordinates,
		house_system: houseSystemValidation.value,
		orb: orbValidation.value,
	});
}

export function parseTransitParams(searchParams: URLSearchParams): ParseOk | ParseFail {
	const base = parseNatalParams(searchParams);
	if (!base.ok) return base;

	const transitValidation = validateWesternDateTime(
		searchParams.get("transit_datetime"),
		"transit_datetime"
	);
	if (!transitValidation.ok) {
		return { ok: false, response: validationError(transitValidation.error) };
	}
	const coordinatesValidation = validateWesternCurrentCoordinates(
		searchParams.get("current_coordinates")
	);
	if (!coordinatesValidation.ok) {
		return { ok: false, response: validationError(coordinatesValidation.error) };
	}

	return {
		ok: true,
		query: {
			...base.query,
			transit_datetime: transitValidation.value,
			current_coordinates: coordinatesValidation.value,
		},
	};
}

export function parseProgressionParams(
	searchParams: URLSearchParams
): ParseOk | ParseFail {
	const base = parseNatalParams(searchParams);
	if (!base.ok) return base;

	const progressionYearValidation = validateWesternProgressionYear(
		searchParams.get("progression_year")
	);
	if (!progressionYearValidation.ok) {
		return { ok: false, response: validationError(progressionYearValidation.error) };
	}
	const coordinatesValidation = validateWesternCurrentCoordinates(
		searchParams.get("current_coordinates")
	);
	if (!coordinatesValidation.ok) {
		return { ok: false, response: validationError(coordinatesValidation.error) };
	}

	return {
		ok: true,
		query: {
			...base.query,
			progression_year: progressionYearValidation.value,
			current_coordinates: coordinatesValidation.value,
		},
	};
}

export function parseSolarReturnParams(
	searchParams: URLSearchParams
): ParseOk | ParseFail {
	const base = parseNatalParams(searchParams);
	if (!base.ok) return base;

	const solarReturnYearValidation = validateWesternSolarReturnYear(
		searchParams.get("solar_return_year")
	);
	if (!solarReturnYearValidation.ok) {
		return { ok: false, response: validationError(solarReturnYearValidation.error) };
	}
	const coordinatesValidation = validateWesternCurrentCoordinates(
		searchParams.get("current_coordinates")
	);
	if (!coordinatesValidation.ok) {
		return { ok: false, response: validationError(coordinatesValidation.error) };
	}

	return {
		ok: true,
		query: {
			...base.query,
			solar_return_year: solarReturnYearValidation.value,
			current_coordinates: coordinatesValidation.value,
		},
	};
}

export function parseSynastryParams(searchParams: URLSearchParams): ParseOk | ParseFail {
	const primaryProfileValidation = parseProfileField(searchParams, "primary_profile");
	if (!primaryProfileValidation.ok) return primaryProfileValidation;
	const secondaryProfileValidation = parseProfileField(searchParams, "secondary_profile");
	if (!secondaryProfileValidation.ok) return secondaryProfileValidation;
	const houseSystemValidation = validateWesternHouseSystem(
		searchParams.get("house_system")
	);
	if (!houseSystemValidation.ok) {
		return {
			ok: false,
			response: validationError(houseSystemValidation.error, houseSystemValidation.allowed),
		};
	}
	const chartTypeValidation = validateWesternRelationshipChartType(
		searchParams.get("chart_type")
	);
	if (!chartTypeValidation.ok) {
		return {
			ok: false,
			response: validationError(chartTypeValidation.error, chartTypeValidation.allowed),
		};
	}
	const orbValidation = validateWesternOrb(searchParams.get("orb"));
	if (!orbValidation.ok) {
		return { ok: false, response: validationError(orbValidation.error) };
	}

	return withOptionalCommon(searchParams, {
		"primary_profile[datetime]": primaryProfileValidation.datetime,
		"primary_profile[coordinates]": primaryProfileValidation.coordinates,
		"secondary_profile[datetime]": secondaryProfileValidation.datetime,
		"secondary_profile[coordinates]": secondaryProfileValidation.coordinates,
		house_system: houseSystemValidation.value,
		chart_type: chartTypeValidation.value,
		orb: orbValidation.value,
	});
}

export function parseCompositeParams(searchParams: URLSearchParams): ParseOk | ParseFail {
	const base = parseSynastryParams(searchParams);
	if (!base.ok) return base;

	const transitRaw = searchParams.get("transit_datetime");
	const coordinatesRaw = searchParams.get("current_coordinates");
	const transitValidation = validateWesternDateTime(transitRaw, "transit_datetime");
	if (!transitValidation.ok) {
		return { ok: false, response: validationError(transitValidation.error) };
	}
	const coordinatesValidation = validateWesternCurrentCoordinates(coordinatesRaw);
	if (!coordinatesValidation.ok) {
		return { ok: false, response: validationError(coordinatesValidation.error) };
	}
	return {
		ok: true,
		query: {
			...base.query,
			transit_datetime: transitValidation.value,
			current_coordinates: coordinatesValidation.value,
		},
	};
}

export async function westernProxyGet<TResponse>(
	upstreamPath: string,
	query: StringQuery,
	errorLabel: string
): Promise<NextResponse<TResponse | JsonObject>> {
	try {
		const response = await prokeralaFetch<TResponse>(upstreamPath, { query });
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Prokerala ${upstreamPath} API error:`, error);
		return NextResponse.json(
			{
				ok: false,
				error: `${errorLabel} request failed`,
				details: message,
			},
			{ status: 500 }
		);
	}
}

export async function westernProxyChart(
	upstreamPath: string,
	query: StringQuery,
	errorLabel: string
): Promise<Response | NextResponse<JsonObject>> {
	try {
		const svg = await prokeralaFetchChart(upstreamPath, { query });
		return new Response(svg, {
			status: 200,
			headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Prokerala ${upstreamPath} API error:`, error);
		return NextResponse.json(
			{
				ok: false,
				error: `${errorLabel} request failed`,
				details: message,
			},
			{ status: 500 }
		);
	}
}

export function getSearchParams(request: NextRequest): URLSearchParams {
	return new URL(request.url).searchParams;
}
