import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetchPost } from "@/lib/prokeralaClient";
import type {
	ProkeralaReportRequestBody,
	ProkeralaReportResponse,
} from "@/types/prokerala";
import {
	PROKERALA_REPORT_COMPATIBILITY_MODULE_CODES,
	PROKERALA_REPORT_PERSONAL_MODULE_CODES,
	validateLanguage,
	validateReportAntardasha,
	validateReportChartStyle,
	validateReportChartType,
	validateReportCompatibilitySystem,
	validateReportHouseId,
	validateReportHouseSystemId,
	validateReportPeriodType,
	validateReportPlanetAshtakavarga,
	validateReportPlanetId,
	validateReportPratyantardasha,
	validateReportTemplateStyle,
	validateReportTransitPlanetId,
	validateReportYearLength,
} from "@/app/api/prokerala/_validation";

type JsonObject = Record<string, unknown>;
type EndpointKind = "personal" | "compatibility";

const REPORT_LANGUAGE_CODES = ["en", "hi", "ml", "ta", "te"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validationError(error: string, allowed?: readonly unknown[]): NextResponse {
	if (allowed) {
		return NextResponse.json({ error, allowed }, { status: 400 });
	}
	return NextResponse.json({ error }, { status: 400 });
}

function toStringOrNull(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const v = value.trim();
	return v === "" ? null : v;
}

function extractModules(options: Record<string, unknown>): unknown[] {
	const modules: unknown[] = [];
	if (Array.isArray(options.modules)) {
		modules.push(...options.modules);
	}
	if (isRecord(options.report) && Array.isArray(options.report.modules)) {
		modules.push(...options.report.modules);
	}
	return modules;
}

function validateModuleCode(
	moduleCode: string,
	kind: EndpointKind
): { ok: true } | { ok: false; response: NextResponse } {
	const normalized = moduleCode.trim().toLowerCase();
	if (kind === "personal") {
		if (!PROKERALA_REPORT_PERSONAL_MODULE_CODES.includes(normalized as never)) {
			return {
				ok: false,
				response: validationError(
					"Invalid report module code",
					PROKERALA_REPORT_PERSONAL_MODULE_CODES
				),
			};
		}
		return { ok: true };
	}

	if (
		!PROKERALA_REPORT_COMPATIBILITY_MODULE_CODES.includes(normalized as never)
	) {
		return {
			ok: false,
			response: validationError(
				"Invalid report module code",
				PROKERALA_REPORT_COMPATIBILITY_MODULE_CODES
			),
		};
	}
	return { ok: true };
}

function validateKnownOption(
	field: string,
	value: unknown
): { ok: true } | { ok: false; response: NextResponse } {
	const asString = typeof value === "string" ? value : null;
	switch (field) {
		case "chart_style": {
			const v = validateReportChartStyle(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "house_system": {
			const v = validateReportHouseSystemId(value as number | string | null);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "planet": {
			const v = validateReportPlanetId(value as number | string | null);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "house": {
			const v = validateReportHouseId(value as number | string | null);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "year_length": {
			const v = validateReportYearLength(value as number | string | null);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "antardasha": {
			const v = validateReportAntardasha(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "pratyantardasha": {
			const v = validateReportPratyantardasha(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "planet_ashtakavarga": {
			const v = validateReportPlanetAshtakavarga(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "period_type": {
			const v = validateReportPeriodType(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "transit_planet": {
			const v = validateReportTransitPlanetId(value as number | string | null);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "compatibility_system": {
			const v = validateReportCompatibilitySystem(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "chart_type": {
			const v = validateReportChartType(asString);
			return v.ok ? { ok: true } : { ok: false, response: validationError(v.error, v.allowed) };
		}
		case "year": {
			const year = typeof value === "number" ? String(value) : asString;
			if (!year || !/^\d{4}$/.test(year)) {
				return { ok: false, response: validationError("Invalid year: expected YYYY format") };
			}
			return { ok: true };
		}
		case "footer": {
			if (typeof value !== "string") {
				return { ok: false, response: validationError("Invalid footer: expected string") };
			}
			return { ok: true };
		}
		default:
			return { ok: true };
	}
}

function walkAndValidateKnownOptions(
	value: unknown
): { ok: true } | { ok: false; response: NextResponse } {
	if (Array.isArray(value)) {
		for (const item of value) {
			const nested = walkAndValidateKnownOptions(item);
			if (!nested.ok) return nested;
		}
		return { ok: true };
	}
	if (!isRecord(value)) return { ok: true };

	for (const [key, child] of Object.entries(value)) {
		const known = validateKnownOption(key, child);
		if (!known.ok) return known;
		const nested = walkAndValidateKnownOptions(child);
		if (!nested.ok) return nested;
	}
	return { ok: true };
}

export async function parseReportRequestBody(
	request: NextRequest,
	kind: EndpointKind
): Promise<{ ok: true; body: ProkeralaReportRequestBody } | { ok: false; response: NextResponse }> {
	let parsed: unknown;
	try {
		parsed = await request.json();
	} catch {
		return {
			ok: false,
			response: validationError("Invalid body: expected JSON object with input and options"),
		};
	}

	if (!isRecord(parsed)) {
		return {
			ok: false,
			response: validationError("Invalid body: expected a JSON object"),
		};
	}

	if (!isRecord(parsed.input)) {
		return {
			ok: false,
			response: validationError("Invalid body: input must be an object"),
		};
	}
	if (!isRecord(parsed.options)) {
		return {
			ok: false,
			response: validationError("Invalid body: options must be an object"),
		};
	}

	const options = parsed.options;
	const modules = extractModules(options);
	for (const moduleEntry of modules) {
		if (typeof moduleEntry === "string") {
			const codeValidation = validateModuleCode(moduleEntry, kind);
			if (!codeValidation.ok) return codeValidation;
			continue;
		}
		if (isRecord(moduleEntry)) {
			const code = toStringOrNull(moduleEntry.code);
			if (!code) {
				return {
					ok: false,
					response: validationError(
						"Invalid modules entry: each module object must contain non-empty string code"
					),
				};
			}
			const codeValidation = validateModuleCode(code, kind);
			if (!codeValidation.ok) return codeValidation;
			if (
				Object.prototype.hasOwnProperty.call(moduleEntry, "options") &&
				!isRecord(moduleEntry.options)
			) {
				return {
					ok: false,
					response: validationError(
						"Invalid modules entry: module options must be an object when provided"
					),
				};
			}
			continue;
		}
		return {
			ok: false,
			response: validationError(
				"Invalid modules entry: expected string code or object with code/options"
			),
		};
	}

	if (isRecord(options.report)) {
		const la = toStringOrNull(options.report.la);
		if (la) {
			const laValidation = validateLanguage(la, REPORT_LANGUAGE_CODES);
			if (!laValidation.ok) {
				return {
					ok: false,
					response: validationError(laValidation.error, laValidation.allowed),
				};
			}
		}
	}

	if (isRecord(options.template) && options.template.style != null) {
		const styleValidation = validateReportTemplateStyle(
			typeof options.template.style === "string" ? options.template.style : null
		);
		if (!styleValidation.ok) {
			return {
				ok: false,
				response: validationError(styleValidation.error, styleValidation.allowed),
			};
		}
	}

	const knownOptionValidation = walkAndValidateKnownOptions(options);
	if (!knownOptionValidation.ok) return knownOptionValidation;

	return {
		ok: true,
		body: {
			input: parsed.input,
			options,
		},
	};
}

export async function reportProxyPost(
	upstreamPath: string,
	body: ProkeralaReportRequestBody,
	errorLabel: string
): Promise<NextResponse<ProkeralaReportResponse | JsonObject>> {
	try {
		const response = await prokeralaFetchPost<ProkeralaReportResponse>(upstreamPath, {
			body,
		});
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
