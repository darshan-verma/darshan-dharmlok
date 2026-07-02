import airports from "@/data/airports.json";

type AirportRow = {
	code: string;
	name: string;
	city: string;
	country: string;
	countryCode: string;
};

export type CountryOption = { code: string; name: string };

let cached: CountryOption[] | null = null;

/** Deduped ISO alpha-2 country list derived from the airport dataset. */
function buildCountries(): CountryOption[] {
	if (cached) return cached;
	const byCode = new Map<string, string>();
	for (const a of airports as AirportRow[]) {
		const code = (a.countryCode || "").trim().toUpperCase();
		const name = (a.country || "").trim();
		if (code.length !== 2 || !name) continue;
		if (!byCode.has(code)) byCode.set(code, name);
	}
	cached = [...byCode.entries()]
		.map(([code, name]) => ({ code, name }))
		.sort((a, b) => a.name.localeCompare(b.name));
	return cached;
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = (searchParams.get("q") ?? "").trim().toLowerCase();
	const all = buildCountries();
	if (!q) return Response.json(all);
	const filtered = all.filter(
		(c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
	);
	return Response.json(filtered);
}
