import { getAirline, validateAirlineCode } from "@/lib/reference-data";

/** Lookup airline by IATA code (server-only JSON). */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const code = (searchParams.get("code") ?? "").trim();
	if (!code) {
		return Response.json({ valid: false });
	}
	const airline = getAirline(code);
	return Response.json({
		valid: validateAirlineCode(code),
		code: code.toUpperCase(),
		name: airline?.name ?? code.toUpperCase(),
		isLcc: airline?.isLcc ?? false,
	});
}
