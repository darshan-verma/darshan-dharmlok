/**
 * Prokerala integration healthcheck (server-only).
 * GET /api/prokerala/healthcheck
 *
 * Calls a minimal Prokerala v2 endpoint to verify credentials and token auth.
 * Does not expose secrets; returns only success status and a small response summary.
 */

import { NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";

export async function GET() {
	try {
		// Use a minimal kundli request (fixed params) to verify token and API access
		const data = await prokeralaFetch<Record<string, unknown>>(
			"astrology/kundli",
			{
				query: {
					ayanamsa: "1",
					coordinates: "23.1765,75.7885",
					datetime: "2026-01-01T10:50:40+00:00", // Sandbox only allows Jan 1
				},
			}
		);

		const dataKeys = data && typeof data === "object" ? Object.keys(data) : [];
		return NextResponse.json({
			ok: true,
			message: "Prokerala API connection and auth verified.",
			responseKeys: dataKeys,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala healthcheck error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Prokerala healthcheck failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
