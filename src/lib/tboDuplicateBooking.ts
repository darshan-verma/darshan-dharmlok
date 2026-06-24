import { createHash } from "crypto";
import type { FlightResult, TboBookPassenger } from "@/types/tbo";

/** TBO: Non-LCC duplicate bookings blocked for 24h from first Book (even if cancelled/released). */
export const TBO_NON_LCC_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface TboDuplicateBookingLeg {
	origin: string;
	destination: string;
	/** Local departure date YYYY-MM-DD */
	departureDate: string;
	airlineCode: string;
	flightNumber: string;
}

export interface TboDuplicateBookingPassenger {
	title: string;
	firstName: string;
	lastName: string;
}

export interface TboDuplicateBookingCriteria {
	legs: TboDuplicateBookingLeg[];
	passengers: TboDuplicateBookingPassenger[];
}

export interface TboDuplicateBookingHit {
	fingerprint: string;
	pnr: string;
	bookingId: number | null;
	bookedAt: Date;
}

function normalizeNamePart(value: string): string {
	return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeFlightNumber(value: string): string {
	return String(value || "").trim().toUpperCase();
}

function departureDateFromIso(iso: string | undefined): string {
	if (!iso?.trim()) return "";
	const d = iso.trim();
	if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
	const parsed = new Date(d);
	if (Number.isNaN(parsed.getTime())) return "";
	return parsed.toISOString().slice(0, 10);
}

export function extractDuplicateLegsFromFlight(
	flightResult: Pick<FlightResult, "Segments">,
): TboDuplicateBookingLeg[] {
	const legs: TboDuplicateBookingLeg[] = [];
	for (const journey of flightResult.Segments || []) {
		if (!Array.isArray(journey)) continue;
		for (const seg of journey) {
			const origin = seg?.Origin?.Airport?.AirportCode?.trim().toUpperCase();
			const destination = seg?.Destination?.Airport?.AirportCode?.trim().toUpperCase();
			const depTime =
				seg?.Origin?.DepTime ||
				seg?.DepartureTime ||
				seg?.Destination?.ArrTime;
			const airlineCode = seg?.Airline?.AirlineCode?.trim().toUpperCase();
			const flightNumber = normalizeFlightNumber(seg?.Airline?.FlightNumber || "");
			const departureDate = departureDateFromIso(depTime);
			if (!origin || !destination || !departureDate || !airlineCode || !flightNumber) {
				continue;
			}
			legs.push({
				origin,
				destination,
				departureDate,
				airlineCode,
				flightNumber,
			});
		}
	}
	return legs;
}

export function extractDuplicatePassengers(
	passengers: Array<Pick<TboBookPassenger, "Title" | "FirstName" | "LastName">>,
): TboDuplicateBookingPassenger[] {
	return passengers
		.map((p) => ({
			title: normalizeNamePart(p.Title || ""),
			firstName: normalizeNamePart(p.FirstName || ""),
			lastName: normalizeNamePart(p.LastName || ""),
		}))
		.filter((p) => p.title && p.firstName && p.lastName)
		.sort((a, b) => {
			const ak = `${a.title}|${a.firstName}|${a.lastName}`;
			const bk = `${b.title}|${b.firstName}|${b.lastName}`;
			return ak.localeCompare(bk);
		});
}

export function buildDuplicateCriteriaFromFlight(
	flightResult: Pick<FlightResult, "Segments">,
	passengers: Array<Pick<TboBookPassenger, "Title" | "FirstName" | "LastName">>,
): TboDuplicateBookingCriteria | null {
	const legs = extractDuplicateLegsFromFlight(flightResult);
	const pax = extractDuplicatePassengers(passengers);
	if (legs.length === 0 || pax.length === 0) return null;
	return { legs, passengers: pax };
}

export function fingerprintDuplicateCriteria(
	criteria: TboDuplicateBookingCriteria,
): string {
	const canonical = JSON.stringify({
		legs: criteria.legs.map((leg) => ({
			o: leg.origin,
			d: leg.destination,
			dt: leg.departureDate,
			ac: leg.airlineCode,
			fn: leg.flightNumber,
		})),
		pax: criteria.passengers.map((p) => ({
			t: p.title,
			f: p.firstName,
			l: p.lastName,
		})),
	});
	return createHash("sha256").update(canonical).digest("hex");
}

export function isTboDuplicateBookingError(message: unknown): boolean {
	const s = String(message || "").toLowerCase();
	return (
		s.includes("already done") ||
		s.includes("already booking") ||
		s.includes("duplicate booking") ||
		s.includes("booking is already")
	);
}

export function parseDuplicateBookingPnrFromError(message: unknown): string | null {
	const m = String(message || "").match(/PNR\s+([A-Z0-9]{5,8})/i);
	return m?.[1]?.toUpperCase() || null;
}

export function formatTboDuplicateBookingError(pnr: string): string {
	const normalized = pnr.trim().toUpperCase();
	return `Booking is already done for the same criteria for PNR ${normalized}`;
}

export function duplicateBookingExpiresAt(bookedAt: Date): Date {
	return new Date(bookedAt.getTime() + TBO_NON_LCC_DUPLICATE_WINDOW_MS);
}

export function isDuplicateGuardPayload(
	value: unknown,
): value is TboDuplicateBookingCriteria {
	if (!value || typeof value !== "object") return false;
	const v = value as TboDuplicateBookingCriteria;
	if (!Array.isArray(v.legs) || !Array.isArray(v.passengers)) return false;
	if (v.legs.length === 0 || v.passengers.length === 0) return false;
	return v.legs.every(
		(leg) =>
			typeof leg.origin === "string" &&
			typeof leg.destination === "string" &&
			typeof leg.departureDate === "string" &&
			typeof leg.airlineCode === "string" &&
			typeof leg.flightNumber === "string",
	);
}
