import { searchAirports } from "@/lib/reference-data";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = (searchParams.get("q") ?? "").trim();
	if (q.length < 2) {
		return Response.json([]);
	}
	return Response.json(searchAirports(q));
}
