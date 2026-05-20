#!/usr/bin/env node
/**
 * TripJack UAT certification test runner.
 * Search + review for all cases; book flow for CERT-* when --book-flow is passed.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_PATH = join(ROOT, "scripts/uat-raw-results.json");

// ─── .env loader ─────────────────────────────────────────────────────────────
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
	const t = line.trim();
	if (!t || t.startsWith("#")) continue;
	const eq = t.indexOf("=");
	if (eq < 0) continue;
	const k = t.slice(0, eq).trim();
	let v = t.slice(eq + 1).trim();
	if (
		(v.startsWith('"') && v.endsWith('"')) ||
		(v.startsWith("'") && v.endsWith("'"))
	) {
		v = v.slice(1, -1);
	}
	if (!process.env[k]) process.env[k] = v;
}

function requireEnv(name) {
	const v = process.env[name]?.trim();
	if (!v) throw new Error(`Missing required environment variable: ${name}`);
	return v;
}

const API_KEY = requireEnv("TRIPJACK_API_KEY");
const FMS_BASE = (
	process.env.TRIPJACK_FMS_API_URL ||
	process.env.TRIPJACK_STATIC_API_URL ||
	process.env.TRIPJACK_API_URL ||
	""
).replace(/\/$/, "");
const OMS_BASE = (
	process.env.TRIPJACK_OMS_API_URL ||
	process.env.TRIPJACK_STATIC_API_URL ||
	process.env.TRIPJACK_API_URL ||
	""
).replace(/\/$/, "");

if (!FMS_BASE) {
	throw new Error(
		"Missing FMS base URL: set TRIPJACK_FMS_API_URL, TRIPJACK_STATIC_API_URL, or TRIPJACK_API_URL",
	);
}
if (!OMS_BASE) {
	throw new Error(
		"Missing OMS base URL: set TRIPJACK_OMS_API_URL, TRIPJACK_STATIC_API_URL, or TRIPJACK_API_URL",
	);
}

// ─── Travel dates (shared across run for report header) ────────────────────
function travelDate(daysFromNow) {
	const x = new Date();
	x.setDate(x.getDate() + daysFromNow);
	return x.toISOString().slice(0, 10);
}

const OUTBOUND_DATE = travelDate(45);
const RETURN_DATE = travelDate(52);

function mcLegDate(baseOffset, legIndex) {
	return travelDate(baseOffset + legIndex * 4);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
	const opts = {
		bookFlow: false,
		only: null,
		patch: false,
		delay: 2000,
	};
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--book-flow") opts.bookFlow = true;
		else if (a === "--patch") opts.patch = true;
		else if (a === "--only") opts.only = (argv[++i] || "").split(",").filter(Boolean);
		else if (a === "--delay") opts.delay = Number(argv[++i]) || 2000;
	}
	return opts;
}

const CLI = parseArgs(process.argv);
/** Unique per process run — avoids TripJack duplicate-booking on repeated UAT runs. */
const UAT_RUN_TAG = Date.now().toString(36).toUpperCase().slice(-6);

// ─── Test case definitions (from docs/TripJack-UAT-testing.md) ───────────────
/** @type {Array<{
 *   id: string;
 *   description: string;
 *   journeyType: "ONEWAY"|"RETURN"|"MULTICITY";
 *   sector: Array<{ from: string; to: string }>;
 *   pax: { ADULT: number; CHILD: number; INFANT: number };
 *   flightType: "DIRECT"|"CONNECTING";
 *   certArea: string|null;
 *   bookFlow: boolean;
 * }>} */
const TEST_CASES = [
	// Oneway (8)
	{ id: "OW-1", description: "Oneway DEL-BOM 1A Direct", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "OW-2", description: "Oneway DEL-BOM 1A Connecting", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "OW-3", description: "Oneway DEL-DXB 2A 2C Direct", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "DXB" }], pax: { ADULT: 2, CHILD: 2, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "OW-4", description: "Oneway BOM-SIN 2A 2C Connecting", journeyType: "ONEWAY", sector: [{ from: "BOM", to: "SIN" }], pax: { ADULT: 2, CHILD: 2, INFANT: 0 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "OW-5", description: "Oneway MAA-DMK 3A 2C Direct", journeyType: "ONEWAY", sector: [{ from: "MAA", to: "DMK" }], pax: { ADULT: 3, CHILD: 2, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "OW-6", description: "Oneway DXB-BKK 5A 3C 2I Direct", journeyType: "ONEWAY", sector: [{ from: "DXB", to: "BKK" }], pax: { ADULT: 5, CHILD: 3, INFANT: 2 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "OW-7", description: "Oneway DXB-BKK 5A 3C 2I Connecting", journeyType: "ONEWAY", sector: [{ from: "DXB", to: "BKK" }], pax: { ADULT: 5, CHILD: 3, INFANT: 2 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "OW-8", description: "Oneway BOM-MAA 5A 4C 3I Direct", journeyType: "ONEWAY", sector: [{ from: "BOM", to: "MAA" }], pax: { ADULT: 5, CHILD: 4, INFANT: 3 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	// Return (10)
	{ id: "RT-1", description: "Dom Return DEL-BOM 1A Direct", journeyType: "RETURN", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-2", description: "Dom Return DEL-BOM 1A Connecting", journeyType: "RETURN", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "RT-3", description: "Return DEL-DXB 2A 2C Direct", journeyType: "RETURN", sector: [{ from: "DEL", to: "DXB" }], pax: { ADULT: 2, CHILD: 2, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-4", description: "Return BOM-SIN 2A 2C Connecting", journeyType: "RETURN", sector: [{ from: "BOM", to: "SIN" }], pax: { ADULT: 2, CHILD: 2, INFANT: 0 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "RT-5", description: "Return MAA-DMK 3A 2C Direct", journeyType: "RETURN", sector: [{ from: "MAA", to: "DMK" }], pax: { ADULT: 3, CHILD: 2, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-6", description: "Return DXB-BKK 5A 3C 2I Direct", journeyType: "RETURN", sector: [{ from: "DXB", to: "BKK" }], pax: { ADULT: 5, CHILD: 3, INFANT: 2 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-7", description: "Return DXB-BKK 5A 3C 2I Connecting", journeyType: "RETURN", sector: [{ from: "DXB", to: "BKK" }], pax: { ADULT: 5, CHILD: 3, INFANT: 2 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "RT-8", description: "Return BOM-MAA 5A 4C 3I Direct", journeyType: "RETURN", sector: [{ from: "BOM", to: "MAA" }], pax: { ADULT: 5, CHILD: 4, INFANT: 3 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-9", description: "Dom Return DEL-BOM 3A 2C Direct", journeyType: "RETURN", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 3, CHILD: 2, INFANT: 0 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "RT-10", description: "Dom Return DEL-BOM 5A 3C 2I Connecting", journeyType: "RETURN", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 5, CHILD: 3, INFANT: 2 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	// Multicity (4)
	{ id: "MC-1", description: "Domestic Multicity 5A 3C Connecting", journeyType: "MULTICITY", sector: [{ from: "DEL", to: "BOM" }, { from: "BOM", to: "BLR" }, { from: "BLR", to: "DEL" }], pax: { ADULT: 5, CHILD: 3, INFANT: 0 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	{ id: "MC-2", description: "Domestic Multicity 5A 4C 1I Direct", journeyType: "MULTICITY", sector: [{ from: "DEL", to: "BOM" }, { from: "BOM", to: "GOI" }], pax: { ADULT: 5, CHILD: 4, INFANT: 1 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "MC-3", description: "Intl Multicity 4A 2C 2I Direct", journeyType: "MULTICITY", sector: [{ from: "DEL", to: "DXB" }, { from: "DXB", to: "BKK" }], pax: { ADULT: 4, CHILD: 2, INFANT: 2 }, flightType: "DIRECT", certArea: null, bookFlow: false },
	{ id: "MC-4", description: "Intl Multicity 4A 2C 2I Connecting", journeyType: "MULTICITY", sector: [{ from: "DEL", to: "DXB" }, { from: "DXB", to: "BKK" }], pax: { ADULT: 4, CHILD: 2, INFANT: 2 }, flightType: "CONNECTING", certArea: null, bookFlow: false },
	// Certification areas (8 — 6 mandatory + 2 optional per UAT doc)
	{ id: "CERT-PUBLISHED", description: "Certification Published Fares", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "PUBLISHED", bookFlow: false },
	{ id: "CERT-SPECIAL-RETURN", description: "Certification Special Return", journeyType: "RETURN", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "SPECIAL_RETURN", bookFlow: false },
	{ id: "CERT-PASSPORT", description: "Certification Passport Cases", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "DXB" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "PASSPORT", bookFlow: false },
	{ id: "CERT-GST", description: "Certification With GST", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "GST", bookFlow: false },
	{ id: "CERT-NO-GST", description: "Certification Without GST", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "NO_GST", bookFlow: false },
	{ id: "CERT-SSR", description: "Certification With SSR", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "SSR", bookFlow: false },
	{ id: "CERT-STUDENT", description: "Certification Student Fare (optional)", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "STUDENT", bookFlow: false },
	{ id: "CERT-SENIOR", description: "Certification Senior Citizen Fare (optional)", journeyType: "ONEWAY", sector: [{ from: "DEL", to: "BOM" }], pax: { ADULT: 1, CHILD: 0, INFANT: 0 }, flightType: "DIRECT", certArea: "SENIOR", bookFlow: false },
];

// ─── Results persistence ───────────────────────────────────────────────────
function loadResultsFile() {
	if (!existsSync(RESULTS_PATH)) {
		return {
			meta: {
				outboundDate: OUTBOUND_DATE,
				returnDate: RETURN_DATE,
				fmsBaseUrl: FMS_BASE,
				omsBaseUrl: OMS_BASE,
				bookFlow: CLI.bookFlow,
		runTag: UAT_RUN_TAG,
			},
			cases: [],
		};
	}
	const raw = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
	if (Array.isArray(raw)) {
		return {
			meta: {
				outboundDate: OUTBOUND_DATE,
				returnDate: RETURN_DATE,
				fmsBaseUrl: FMS_BASE,
				omsBaseUrl: OMS_BASE,
				bookFlow: CLI.bookFlow,
		runTag: UAT_RUN_TAG,
			},
			cases: raw,
		};
	}
	return raw;
}

function saveResultsFile(data) {
	writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2));
}

function upsertCase(data, caseResult) {
	const idx = data.cases.findIndex((c) => c.id === caseResult.id);
	if (idx >= 0) data.cases[idx] = caseResult;
	else data.cases.push(caseResult);
	data.meta = {
		...data.meta,
		outboundDate: OUTBOUND_DATE,
		returnDate: RETURN_DATE,
		fmsBaseUrl: FMS_BASE,
		omsBaseUrl: OMS_BASE,
		bookFlow: CLI.bookFlow,
		runTag: UAT_RUN_TAG,
		lastRunAt: new Date().toISOString(),
	};
	saveResultsFile(data);
}

function emptyStep() {
	return { req: {}, res: {}, status: 0, ms: 0 };
}

function sectorLabel(sector) {
	return sector.map((s) => `${s.from}-${s.to}`).join(" / ");
}

function paxLabel(pax) {
	let s = `${pax.ADULT}A`;
	if (pax.CHILD) s += `-${pax.CHILD}C`;
	if (pax.INFANT) s += `-${pax.INFANT}I`;
	return s;
}

function buildSearchModifiers(flightType, certArea) {
	const mods = {};
	if (flightType === "DIRECT") {
		mods.isDirectFlight = true;
		mods.isConnectingFlight = false;
	} else if (flightType === "CONNECTING") {
		mods.isDirectFlight = false;
		mods.isConnectingFlight = true;
	}
	if (certArea === "STUDENT") mods.pft = "STUDENT";
	if (certArea === "SENIOR") mods.pft = "SENIOR_CITIZEN";
	return Object.keys(mods).length ? mods : undefined;
}

function buildSearchRequest(testCase) {
	const { journeyType, sector, pax, flightType, certArea } = testCase;
	const routeInfos = [];

	if (journeyType === "RETURN") {
		routeInfos.push({
			fromCityOrAirport: { code: sector[0].from },
			toCityOrAirport: { code: sector[0].to },
			travelDate: OUTBOUND_DATE,
		});
		routeInfos.push({
			fromCityOrAirport: { code: sector[0].to },
			toCityOrAirport: { code: sector[0].from },
			travelDate: RETURN_DATE,
		});
	} else if (journeyType === "MULTICITY") {
		sector.forEach((leg, i) => {
			routeInfos.push({
				fromCityOrAirport: { code: leg.from },
				toCityOrAirport: { code: leg.to },
				travelDate: mcLegDate(45, i),
			});
		});
	} else {
		routeInfos.push({
			fromCityOrAirport: { code: sector[0].from },
			toCityOrAirport: { code: sector[0].to },
			travelDate: OUTBOUND_DATE,
		});
	}

	const searchQuery = {
		cabinClass: "ECONOMY",
		paxInfo: {
			ADULT: String(pax.ADULT),
			CHILD: String(pax.CHILD),
			INFANT: String(pax.INFANT),
		},
		routeInfos,
	};
	const mods = buildSearchModifiers(flightType, certArea);
	if (mods) searchQuery.searchModifiers = mods;

	return { searchQuery };
}

function countInventory(searchRes) {
	const ti = searchRes?.searchResult?.tripInfos || {};
	return {
		onward: Array.isArray(ti.ONWARD) ? ti.ONWARD.length : 0,
		return: Array.isArray(ti.RETURN) ? ti.RETURN.length : 0,
		combo: Array.isArray(ti.COMBO) ? ti.COMBO.length : 0,
	};
}

function totalInventory(counts) {
	return counts.onward + counts.return + counts.combo;
}

function normalizeMsri(msri) {
	if (!Array.isArray(msri)) return [];
	return msri.map((x) => String(x));
}

function specialReturnPairable(o, r) {
	const oSr = o.fareIdentifier === "SPECIAL_RETURN";
	const rSr = r.fareIdentifier === "SPECIAL_RETURN";
	if (oSr !== rSr) return false;
	if (!oSr) return true;

	const oMsri = normalizeMsri(o.msri);
	const rMsri = normalizeMsri(r.msri);
	const oSri = o.sri ? String(o.sri).trim() : "";
	const rSri = r.sri ? String(r.sri).trim() : "";

	const case1O = !oSri && oMsri.length === 0;
	const case1R = !rSri && rMsri.length === 0;
	const case2O = !!oSri && oMsri.length > 0;
	const case2R = !!rSri && rMsri.length > 0;

	if (case1O && case1R) return o.airline === r.airline;
	if (case2O && case2R) return oMsri.includes(rSri) && rMsri.includes(oSri);
	return false;
}

function totalPax(pax) {
	return (pax?.ADULT || 0) + (pax?.CHILD || 0) + (pax?.INFANT || 0);
}

/** Seats required for sR checks — infants are lap-held and do not consume a seat. */
function seatedPax(pax) {
	return (pax?.ADULT || 0) + (pax?.CHILD || 0);
}

function tripRouteCodes(trip) {
	const segs = trip.sI || [];
	if (!segs.length) return null;
	return {
		from: (segs[0]?.da?.code || "").toUpperCase(),
		to: (segs[segs.length - 1]?.aa?.code || "").toUpperCase(),
	};
}

function tripIsConnecting(trip) {
	const segs = trip.sI || [];
	if (segs.length > 1) return true;
	return (segs[0]?.stops ?? 0) > 0;
}

function tripMatchesRoute(trip, from, to) {
	const route = tripRouteCodes(trip);
	if (!route) return false;
	return route.from === from.toUpperCase() && route.to === to.toUpperCase();
}

function filterTripsByFlightType(trips, flightType) {
	if (flightType === "DIRECT") {
		return (trips || []).filter((t) => !tripIsConnecting(t));
	}
	if (flightType === "CONNECTING") {
		return (trips || []).filter((t) => tripIsConnecting(t));
	}
	return trips || [];
}

function filterTripsForLeg(trips, from, to, flightType) {
	return filterTripsByFlightType(
		(trips || []).filter((t) => tripMatchesRoute(t, from, to)),
		flightType,
	);
}

function filterTripsForReturnCombo(trips, sector, flightType) {
	const from = (sector[0]?.from || "").toUpperCase();
	const to = (sector[0]?.to || "").toUpperCase();
	const filtered = (trips || []).filter((trip) => {
		const segs = trip.sI || [];
		if (!segs.length) return false;
		const firstFrom = (segs[0]?.da?.code || "").toUpperCase();
		const lastTo = (segs[segs.length - 1]?.aa?.code || "").toUpperCase();
		return firstFrom === from && lastTo === from;
	});
	const matched = filtered.length ? filtered : trips || [];
	return filterTripsByFlightType(matched, flightType);
}

function seatsRemainingFromPriceList(pl) {
	const fd = pl?.fd;
	if (!fd || typeof fd !== "object") return undefined;
	for (const key of ["ADULT", "CHILD", "INFANT"]) {
		const sR = fd[key]?.sR;
		if (typeof sR === "number") return sR;
	}
	return undefined;
}

function extractPriceEntries(trips) {
	const out = [];
	for (const trip of trips || []) {
		const airline = trip.sI?.[0]?.fD?.aI?.code || "";
		for (const pl of trip.totalPriceList || []) {
			if (pl?.id) {
				out.push({
					priceId: pl.id,
					fareIdentifier: pl.fareIdentifier,
					sri: pl.sri,
					msri: pl.msri,
					airline,
					seatsRemaining: seatsRemainingFromPriceList(pl),
				});
			}
		}
	}
	return out;
}

/** Pick first priceId with enough seats (sR); falls back if sR is absent on all fares. */
function firstPriceId(trips, preferFareIdentifier, minSeats = 1) {
	const entries = extractPriceEntries(trips);
	const withSeats = entries.filter(
		(e) => e.seatsRemaining == null || e.seatsRemaining >= minSeats,
	);
	const pool = withSeats.length ? withSeats : entries;

	if (preferFareIdentifier) {
		const match = pool.find((e) => e.fareIdentifier === preferFareIdentifier);
		if (match) return match.priceId;
	}
	return pool[0]?.priceId || null;
}

function pickSpecialReturnPriceIds(searchRes, minSeats = 1) {
	const ti = searchRes?.searchResult?.tripInfos || {};
	const onwardEntries = extractPriceEntries(ti.ONWARD).filter(
		(e) => e.seatsRemaining == null || e.seatsRemaining >= minSeats,
	);
	const returnEntries = extractPriceEntries(ti.RETURN).filter(
		(e) => e.seatsRemaining == null || e.seatsRemaining >= minSeats,
	);

	for (const o of onwardEntries) {
		if (o.fareIdentifier !== "SPECIAL_RETURN") continue;
		for (const r of returnEntries) {
			if (r.fareIdentifier !== "SPECIAL_RETURN") continue;
			if (specialReturnPairable(o, r)) {
				return [o.priceId, r.priceId];
			}
		}
	}
	return null;
}

function groupOnwardByRoutes(trips, routes) {
	const buckets = new Map();
	for (const trip of trips || []) {
		const segs = trip.sI || [];
		if (!segs.length) continue;
		const from = (segs[0]?.da?.code || "").toUpperCase();
		const to = (segs[segs.length - 1]?.aa?.code || "").toUpperCase();
		const key = `${from}-${to}`;
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key).push(trip);
	}
	if (routes.length >= 2) {
		return routes.map((r) => {
			const key = `${r.from.toUpperCase()}-${r.to.toUpperCase()}`;
			return buckets.get(key) || [];
		});
	}
	return [...buckets.values()];
}

function pickReviewPriceIds(testCase, searchRes) {
	const ti = searchRes?.searchResult?.tripInfos || {};
	const preferFare =
		testCase.certArea === "PUBLISHED" ? "PUBLISHED" : undefined;
	const minSeats = seatedPax(testCase.pax);
	const sector = testCase.sector || [];
	const outbound = sector[0];

	if (testCase.certArea === "SPECIAL_RETURN") {
		const sr = pickSpecialReturnPriceIds(searchRes, minSeats);
		if (sr) return sr;
	}

	if (testCase.journeyType === "RETURN") {
		const onwardTrips = outbound
			? filterTripsForLeg(ti.ONWARD, outbound.from, outbound.to, testCase.flightType)
			: filterTripsByFlightType(ti.ONWARD, testCase.flightType);
		const returnTrips = outbound
			? filterTripsForLeg(
					ti.RETURN,
					outbound.to,
					outbound.from,
					testCase.flightType,
				)
			: filterTripsByFlightType(ti.RETURN, testCase.flightType);
		const comboTrips = filterTripsForReturnCombo(
			ti.COMBO,
			sector,
			testCase.flightType,
		);

		// Domestic return: separate ONWARD + RETURN buckets (TripJack doc)
		if (onwardTrips.length > 0 && returnTrips.length > 0) {
			const onwardId = firstPriceId(onwardTrips, preferFare, minSeats);
			const returnId = firstPriceId(returnTrips, preferFare, minSeats);
			if (onwardId && returnId) return [onwardId, returnId];
		}

		// International return: single COMBO priceId
		if (comboTrips.length > 0) {
			const id = firstPriceId(comboTrips, preferFare, minSeats);
			if (id) return [id];
		}

		const onwardId = firstPriceId(onwardTrips, preferFare, minSeats);
		const returnId = firstPriceId(returnTrips, preferFare, minSeats);
		if (onwardId && returnId) return [onwardId, returnId];
		if (onwardId) return [onwardId];
		return null;
	}

	if (testCase.journeyType === "MULTICITY") {
		if (ti.COMBO?.length) {
			const comboTrips = filterTripsByFlightType(ti.COMBO, testCase.flightType);
			const id = firstPriceId(comboTrips, preferFare, minSeats);
			return id ? [id] : null;
		}
		const legGroups = groupOnwardByRoutes(ti.ONWARD, sector).map((trips, i) => {
			const leg = sector[i];
			return leg
				? filterTripsForLeg(trips, leg.from, leg.to, testCase.flightType)
				: filterTripsByFlightType(trips, testCase.flightType);
		});
		const ids = legGroups
			.map((trips) => firstPriceId(trips, preferFare, minSeats))
			.filter(Boolean);
		return ids.length ? ids : null;
	}

	const onwardTrips = outbound
		? filterTripsForLeg(ti.ONWARD, outbound.from, outbound.to, testCase.flightType)
		: filterTripsByFlightType(ti.ONWARD, testCase.flightType);
	const comboTrips = filterTripsByFlightType(ti.COMBO, testCase.flightType);
	const returnTrips = outbound
		? filterTripsForLeg(ti.RETURN, outbound.from, outbound.to, testCase.flightType)
		: filterTripsByFlightType(ti.RETURN, testCase.flightType);

	const id =
		firstPriceId(onwardTrips, preferFare, minSeats) ||
		firstPriceId(comboTrips, preferFare, minSeats) ||
		firstPriceId(returnTrips, preferFare, minSeats);
	return id ? [id] : null;
}

function hasSpecialReturnFare(searchRes) {
	const ti = searchRes?.searchResult?.tripInfos || {};
	for (const bucket of [ti.ONWARD, ti.RETURN, ti.COMBO]) {
		for (const trip of bucket || []) {
			for (const pl of trip.totalPriceList || []) {
				if (pl?.fareIdentifier === "SPECIAL_RETURN") return true;
			}
		}
	}
	return false;
}

async function apiCall(base, endpoint, body, retried = false) {
	const start = Date.now();
	const res = await fetch(`${base}${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json", apikey: API_KEY },
		body: JSON.stringify(body),
	});
	const ms = Date.now() - start;
	let json = {};
	try {
		json = await res.json();
	} catch {
		json = {};
	}

	if (res.status === 429 && !retried) {
		console.warn("  HTTP 429 — waiting 30s before retry…");
		await sleep(30000);
		return apiCall(base, endpoint, body, true);
	}

	return { status: res.status, ms, json, rateLimited: res.status === 429 };
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function flatSegmentsFromReview(reviewRes) {
	const tripInfos = reviewRes?.tripInfos;
	const legs = Array.isArray(tripInfos)
		? tripInfos.filter((t) => Array.isArray(t?.sI) && t.sI.length)
		: [
				...(tripInfos?.ONWARD?.[0]?.sI ? [tripInfos.ONWARD[0]] : []),
				...(tripInfos?.RETURN?.[0]?.sI ? [tripInfos.RETURN[0]] : []),
				...(tripInfos?.COMBO || []).filter((t) => Array.isArray(t?.sI)),
			];
	const out = [];
	for (const leg of legs) {
		for (const seg of leg.sI || []) {
			if (seg?.id) out.push({ id: seg.id, ssrInfo: seg.ssrInfo });
		}
	}
	return out;
}

function parseFareAmount(raw) {
	if (typeof raw === "number" && Number.isFinite(raw)) return raw;
	const n = parseFloat(String(raw ?? ""));
	return Number.isFinite(n) ? n : 0;
}

/** TripJack review uses `fC` (camelCase); some typings use `fc`. */
function fareComponentFromReview(reviewRes) {
	const td = reviewRes?.totalPriceInfo?.totalFareDetail;
	return td?.fC ?? td?.fc ?? null;
}

function reviewOrderAmount(reviewRes, extra = 0) {
	const fc = fareComponentFromReview(reviewRes);
	const base = parseFareAmount(fc?.TF ?? fc?.NF ?? fc?.BF);
	return Math.round((base + extra) * 100) / 100;
}

function certContactInfo(testCaseId) {
	const slug = testCaseId.toLowerCase().replace(/[^a-z0-9]/g, "");
	const digits = String(
		[...`${testCaseId}${UAT_RUN_TAG}`].reduce(
			(h, c) => (h * 31 + c.charCodeAt(0)) % 100000000,
			0,
		),
	).padStart(8, "0");
	return {
		email: `uat-${slug}-${UAT_RUN_TAG.toLowerCase()}@test.example.com`,
		emergencyEmail: `uat-emerg-${slug}-${UAT_RUN_TAG.toLowerCase()}@test.example.com`,
		phone: `+9195${digits.slice(0, 8)}`,
		lastName: `${slug.slice(0, 10)}${UAT_RUN_TAG}`.toUpperCase(),
		runTag: UAT_RUN_TAG,
	};
}

function certTravellerSuffix(testCaseId, index = 0) {
	return String(
		[...`${testCaseId}${UAT_RUN_TAG}${index}`].reduce(
			(h, c) => (h * 31 + c.charCodeAt(0)) % 10000000,
			0,
		),
	).padStart(7, "0");
}

function buildTravellers(pax, certArea, testCaseId) {
	const travellers = [];
	const passportCerts = ["PASSPORT", "STUDENT", "SENIOR"];
	const needPassport = passportCerts.includes(certArea);
	const needDi = certArea === "STUDENT" || certArea === "SENIOR";
	const contact = certContactInfo(testCaseId);

	const add = (pt, title, fn, ln, dob, index = 0) => {
		const t = {
			ti: title,
			fN: fn,
			lN: ln,
			pt,
			// TODO: `gd` (gender) is used in TripjackBookingClient but not listed in
			// TripJack-flight-api-doc.md book travellerInfo table — kept for parity.
			gd: "MALE",
			dob,
		};
		if (needPassport) {
			t.pNum = `Z${certTravellerSuffix(testCaseId, index)}`;
			t.eD = "2030-12-31";
			t.pNat = "IN";
			t.pid = "2015-01-01";
		}
		if (needDi) {
			// API validates as documentId — alphanumeric only, no hyphens.
			const suffix = certTravellerSuffix(testCaseId, index);
			t.di = certArea === "STUDENT" ? `STU${suffix}` : `SRC${suffix}`;
		}
		travellers.push(t);
	};

	for (let i = 0; i < pax.ADULT; i++) {
		const dob =
			certArea === "SENIOR"
				? "1960-01-15"
				: certArea === "STUDENT"
					? "2004-06-01"
					: "1990-01-15";
		add(
			"ADULT",
			certArea === "SENIOR" ? "Mr" : "Mr",
			"UAT",
			i === 0 ? contact.lastName : `${contact.lastName}${i + 1}`,
			dob,
			i,
		);
	}
	for (let i = 0; i < pax.CHILD; i++) {
		add(
			"CHILD",
			"Master",
			"UAT",
			i === 0 ? `Child${contact.lastName}` : `Child${contact.lastName}${i + 1}`,
			"2016-03-20",
			pax.ADULT + i,
		);
	}
	for (let i = 0; i < pax.INFANT; i++) {
		add(
			"INFANT",
			"Master",
			"UAT",
			i === 0 ? `Infant${contact.lastName}` : `Infant${contact.lastName}${i + 1}`,
			"2024-08-10",
			pax.ADULT + pax.CHILD + i,
		);
	}
	return travellers;
}

function pickSsrForTraveller(segments) {
	const mealSeg = segments.find((s) => s.ssrInfo?.MEAL?.length);
	const bagSeg = segments.find((s) => s.ssrInfo?.BAGGAGE?.length);
	const out = {};
	if (mealSeg?.ssrInfo?.MEAL?.[0]) {
		out.ssrMealInfos = [{ key: mealSeg.id, code: mealSeg.ssrInfo.MEAL[0].code }];
	}
	if (bagSeg?.ssrInfo?.BAGGAGE?.[0]) {
		out.ssrBaggageInfos = [{ key: bagSeg.id, code: bagSeg.ssrInfo.BAGGAGE[0].code }];
	}
	return out;
}

function ssrExtrasFromSelection(segments, ssr) {
	let total = 0;
	for (const pick of ssr.ssrMealInfos || []) {
		const seg = segments.find((s) => s.id === pick.key);
		const item = seg?.ssrInfo?.MEAL?.find((m) => m.code === pick.code);
		total += parseFareAmount(item?.amount);
	}
	for (const pick of ssr.ssrBaggageInfos || []) {
		const seg = segments.find((s) => s.id === pick.key);
		const item = seg?.ssrInfo?.BAGGAGE?.find((b) => b.code === pick.code);
		total += parseFareAmount(item?.amount);
	}
	return total;
}

async function fetchOrderAmount(bookingId) {
	const detCall = await apiCall(OMS_BASE, "/oms/v1/booking-details", { bookingId });
	if (detCall.status < 200 || detCall.status >= 300) return 0;
	const raw = detCall.json?.order?.amount;
	return parseFareAmount(raw);
}

/** Hold bookings may sit in PENDING briefly before ON_HOLD is ready for confirm-book. */
async function waitForHoldReady(bookingId, maxMs = 45000) {
	const start = Date.now();
	let last = null;
	while (Date.now() - start < maxMs) {
		const detCall = await apiCall(OMS_BASE, "/oms/v1/booking-details", { bookingId });
		last = detCall;
		if (detCall.status < 200 || detCall.status >= 300) {
			await sleep(2000);
			continue;
		}
		const status = String(detCall.json?.order?.status ?? "").toUpperCase();
		if (status === "ON_HOLD" || status === "SUCCESS") {
			return {
				status,
				amount: parseFareAmount(detCall.json?.order?.amount),
				detCall,
			};
		}
		await sleep(2500);
	}
	return last
		? {
				status: String(last.json?.order?.status ?? ""),
				amount: parseFareAmount(last.json?.order?.amount),
				detCall: last,
			}
		: null;
}

async function pickMandatorySeats(bookingId, segments, seatedTravellers) {
	const seatCall = await apiCall(FMS_BASE, "/fms/v1/seat", { bookingId });
	if (seatCall.status < 200 || seatCall.status >= 300 || tripjackApiError(seatCall.json)) {
		return { seatExtras: 0, seatByTraveller: [], seatCall };
	}

	const tripSeat = seatCall.json?.tripSeatMap?.tripSeat || {};
	const seatByTraveller = Array.from({ length: seatedTravellers }, () => []);
	const usedCodes = new Set();
	let seatExtras = 0;

	for (const seg of segments) {
		const list = tripSeat[seg.id]?.sInfo || [];
		for (let p = 0; p < seatedTravellers; p++) {
			const seat = list.find((s) => {
				if (s.isBooked) return false;
				const code = s.code || s.seatNo;
				return code && !usedCodes.has(code);
			});
			if (!seat) continue;
			const code = seat.code || seat.seatNo;
			usedCodes.add(code);
			seatByTraveller[p].push({ key: seg.id, code });
			seatExtras += parseFareAmount(seat.amount);
		}
	}

	return { seatExtras, seatByTraveller, seatCall };
}

function buildBookRequest(reviewRes, testCase, opts = {}) {
	const { seatByTraveller = [], seatExtras = 0, ssrExtras = 0 } = opts;
	const bookingId = reviewRes.bookingId;
	const amount = reviewOrderAmount(reviewRes, seatExtras + ssrExtras);
	const travellers = buildTravellers(testCase.pax, testCase.certArea, testCase.id);
	const segments = flatSegmentsFromReview(reviewRes);
	const contact = certContactInfo(testCase.id);

	for (let p = 0; p < travellers.length; p++) {
		const seats = seatByTraveller[p];
		if (seats?.length) travellers[p].ssrSeatInfos = seats;
	}

	if (testCase.certArea === "SSR") {
		const ssr = pickSsrForTraveller(segments);
		if (travellers[0]) Object.assign(travellers[0], ssr);
	}

	const body = {
		bookingId,
		travellerInfo: travellers,
		deliveryInfo: {
			emails: [contact.email],
			contacts: [contact.phone],
		},
		contactInfo: {
			emails: [contact.emergencyEmail],
			contacts: [contact.phone],
			ecn: `UAT ${contact.lastName}`,
		},
	};

	if (testCase.certArea === "GST") {
		// TODO: API doc Request Payload table lists gstNumber; prose + existing code use gstNum.
		body.gstInfo = {
			gstNum: "07AABCU9603R1ZM",
			registeredName: "Test GST Company Pvt Ltd",
			email: `gst-${contact.email}`,
			mobile: contact.phone,
			address: "123 Test Street New Delhi",
		};
	}
	// NO_GST: explicitly omit gstInfo

	const useHold = reviewRes?.conditions?.isBA === true;
	if (!useHold) {
		body.paymentInfos = [{ amount }];
	}

	return { body, amount, useHold };
}

function extractPnrFromBookingDetails(res) {
	const travellers =
		res?.itemInfos?.AIR?.travellerInfos || res?.travellerInfos || [];
	for (const t of travellers) {
		if (!t?.pnrDetails) continue;
		const pnr = Object.values(t.pnrDetails).find(
			(x) => typeof x === "string" && x.trim(),
		);
		if (typeof pnr === "string") return pnr;
	}
	return "";
}

function reviewSucceeded(reviewRes, httpStatus) {
	if (httpStatus < 200 || httpStatus >= 300) return false;
	if (reviewRes?.errors?.length) return false;
	if (!reviewRes?.bookingId) return false;
	if (reviewRes?.status?.success === false) return false;
	return true;
}

/** TripJack often returns HTTP 200 with errors in the JSON body (e.g. Access Denied). */
function tripjackApiError(res) {
	if (!res || typeof res !== "object") return null;
	if (res.status?.success === false || (Array.isArray(res.errors) && res.errors.length)) {
		const e = res.errors?.[0];
		const msg = e?.message || res.status?.message || "TripJack API error";
		const code = e?.errCode || res.status?.httpStatus;
		return { message: msg, code };
	}
	return null;
}

async function runCase(testCase, resultsData) {
	const result = {
		id: testCase.id,
		description: testCase.description,
		sector: sectorLabel(testCase.sector),
		pax: paxLabel(testCase.pax),
		journeyType: testCase.journeyType,
		flightType: testCase.flightType,
		certArea: testCase.certArea,
		hasSpecialReturn: false,
		search: { ...emptyStep(), inventory: { onward: 0, return: 0, combo: 0 } },
		review: emptyStep(),
		book: { ...emptyStep(), bookingId: "" },
		confirmBook: { ...emptyStep(), pnr: "", confirmationNumber: "" },
		bookingDetails: emptyStep(),
		certStatus: "PENDING",
	};

	console.log(`\n▶ ${testCase.id} — ${testCase.description}`);

	// SEARCH
	const searchReq = buildSearchRequest(testCase);
	const searchCall = await apiCall(FMS_BASE, "/fms/v1/air-search-all", searchReq);
	result.search.req = searchReq;
	result.search.res = searchCall.json;
	result.search.status = searchCall.status;
	result.search.ms = searchCall.ms;
	result.search.inventory = countInventory(searchCall.json);
	result.hasSpecialReturn = hasSpecialReturnFare(searchCall.json);

	if (searchCall.rateLimited) {
		result.certStatus = "RATE_LIMITED";
		upsertCase(resultsData, result);
		console.log("  RATE_LIMITED (HTTP 429)");
		return result;
	}

	if (searchCall.status < 200 || searchCall.status >= 300) {
		result.certStatus = "FAILED";
		upsertCase(resultsData, result);
		console.log(`  FAILED search HTTP ${searchCall.status}`);
		return result;
	}

	const searchApiErr = tripjackApiError(searchCall.json);
	if (searchApiErr) {
		result.certStatus = "FAILED";
		result.apiError = searchApiErr;
		upsertCase(resultsData, result);
		console.log(`  FAILED search — ${searchApiErr.message} (code ${searchApiErr.code})`);
		return result;
	}

	if (totalInventory(result.search.inventory) === 0) {
		result.certStatus = "NO_INVENTORY";
		upsertCase(resultsData, result);
		console.log("  NO_INVENTORY");
		return result;
	}

	// REVIEW
	const priceIds = pickReviewPriceIds(testCase, searchCall.json);
	if (!priceIds?.length) {
		result.certStatus = "NO_INVENTORY";
		upsertCase(resultsData, result);
		console.log("  NO_INVENTORY (no priceId)");
		return result;
	}

	const reviewReq = { priceIds };
	const reviewCall = await apiCall(FMS_BASE, "/fms/v1/review", reviewReq);
	result.review.req = reviewReq;
	result.review.res = reviewCall.json;
	result.review.status = reviewCall.status;
	result.review.ms = reviewCall.ms;

	if (reviewCall.rateLimited) {
		result.certStatus = "RATE_LIMITED";
		upsertCase(resultsData, result);
		console.log("  RATE_LIMITED (HTTP 429)");
		return result;
	}

	if (!reviewSucceeded(reviewCall.json, reviewCall.status)) {
		result.certStatus = "FAILED";
		upsertCase(resultsData, result);
		console.log(`  FAILED review HTTP ${reviewCall.status}`);
		return result;
	}

	if (testCase.certArea === "SSR") {
		const segs = flatSegmentsFromReview(reviewCall.json);
		const hasMeal = segs.some((s) => s.ssrInfo?.MEAL?.length);
		const hasBag = segs.some((s) => s.ssrInfo?.BAGGAGE?.length);
		if (!hasMeal || !hasBag) {
			console.warn(
				`  WARN: CERT-SSR review missing ssrInfo MEAL=${hasMeal} BAGGAGE=${hasBag}`,
			);
		}
	}

	const runBook =
		CLI.bookFlow && testCase.certArea != null;

	if (!runBook) {
		result.certStatus = "PASS";
		upsertCase(resultsData, result);
		console.log(`  PASS (search+review, ${result.search.ms + result.review.ms}ms)`);
		return result;
	}

	// BOOK
	const segments = flatSegmentsFromReview(reviewCall.json);
	const seatedTravellers = seatedPax(testCase.pax);
	const needSeats = reviewCall.json?.conditions?.isa === true;
	let seatByTraveller = [];
	let seatExtras = 0;

	if (needSeats) {
		const picked = await pickMandatorySeats(
			reviewCall.json.bookingId,
			segments,
			seatedTravellers,
		);
		seatByTraveller = picked.seatByTraveller;
		seatExtras = picked.seatExtras;
		if (picked.seatCall) {
			result.seatMap = {
				req: { bookingId: reviewCall.json.bookingId },
				res: picked.seatCall.json,
				status: picked.seatCall.status,
				ms: picked.seatCall.ms,
			};
		}
		const assigned =
			seatByTraveller.length >= seatedTravellers &&
			seatByTraveller.every((rows) => rows.length >= segments.length);
		if (!assigned) {
			result.certStatus = "FAILED";
			upsertCase(resultsData, result);
			console.log("  FAILED book — mandatory seat selection (empty seat map)");
			return result;
		}
	}

	let ssrExtras = 0;
	if (testCase.certArea === "SSR") {
		const ssr = pickSsrForTraveller(segments);
		ssrExtras = ssrExtrasFromSelection(segments, ssr);
	}

	const { body: bookReq, amount, useHold } = buildBookRequest(
		reviewCall.json,
		testCase,
		{ seatByTraveller, seatExtras, ssrExtras },
	);
	let payAmount = amount;
	if (payAmount <= 0) {
		result.certStatus = "FAILED";
		upsertCase(resultsData, result);
		console.log("  FAILED book — could not resolve order amount from review");
		return result;
	}
	const bookCall = await apiCall(OMS_BASE, "/oms/v1/air/book", bookReq);
	result.book.req = bookReq;
	result.book.res = bookCall.json;
	result.book.status = bookCall.status;
	result.book.ms = bookCall.ms;
	result.book.bookingId = bookCall.json?.bookingId || reviewCall.json.bookingId || "";

	if (bookCall.rateLimited) {
		result.certStatus = "RATE_LIMITED";
		upsertCase(resultsData, result);
		return result;
	}

	if (bookCall.status < 200 || bookCall.status >= 300 || bookCall.json?.errors?.length) {
		result.certStatus = "FAILED";
		upsertCase(resultsData, result);
		const errMsg = bookCall.json?.errors?.[0]?.message || `HTTP ${bookCall.status}`;
		console.log(`  FAILED book — ${errMsg}`);
		return result;
	}

	const bookingId = result.book.bookingId;

	if (useHold) {
		const fvCall = await apiCall(OMS_BASE, "/oms/v1/air/fare-validate", {
			bookingId,
		});
		result.fareValidate = {
			req: { bookingId },
			res: fvCall.json,
			status: fvCall.status,
			ms: fvCall.ms,
		};
		if (fvCall.rateLimited || fvCall.status < 200 || fvCall.status >= 300) {
			result.certStatus = "FAILED";
			upsertCase(resultsData, result);
			console.log("  FAILED fare-validate");
			return result;
		}
		const fvErr = tripjackApiError(fvCall.json);
		if (fvErr) {
			result.certStatus = "FAILED";
			upsertCase(resultsData, result);
			console.log(`  FAILED fare-validate — ${fvErr.message}`);
			return result;
		}
		const fvFc = fareComponentFromReview(fvCall.json);
		if (fvFc) {
			const fvAmount = reviewOrderAmount(fvCall.json, seatExtras + ssrExtras);
			if (fvAmount > 0) payAmount = fvAmount;
		}
		const orderAmt = await fetchOrderAmount(bookingId);
		if (orderAmt > 0) payAmount = orderAmt;
		const holdReady = await waitForHoldReady(bookingId);
		if (holdReady?.amount > 0) payAmount = holdReady.amount;
	}

	// CONFIRM-BOOK (hold path) or instant book already paid
	if (useHold) {
		const confirmReq = { bookingId, paymentInfos: [{ amount: payAmount }] };
		let confirmCall = await apiCall(
			OMS_BASE,
			"/oms/v1/air/confirm-book",
			confirmReq,
		);
		const errCode = String(confirmCall.json?.errors?.[0]?.errCode ?? "");
		if (
			(confirmCall.status < 200 ||
				confirmCall.status >= 300 ||
				confirmCall.json?.errors?.length) &&
			errCode === "2520"
		) {
			await sleep(5000);
			const holdReady = await waitForHoldReady(bookingId, 30000);
			if (holdReady?.amount > 0) {
				payAmount = holdReady.amount;
				confirmReq.paymentInfos = [{ amount: payAmount }];
			}
			confirmCall = await apiCall(
				OMS_BASE,
				"/oms/v1/air/confirm-book",
				confirmReq,
			);
		}
		result.confirmBook.req = confirmReq;
		result.confirmBook.res = confirmCall.json;
		result.confirmBook.status = confirmCall.status;
		result.confirmBook.ms = confirmCall.ms;
		result.confirmBook.confirmationNumber =
			confirmCall.json?.bookingId || bookingId;

		if (
			confirmCall.rateLimited ||
			confirmCall.status < 200 ||
			confirmCall.status >= 300 ||
			confirmCall.json?.errors?.length
		) {
			// Fall through to booking-details — hold bookings may already have a PNR.
			result.confirmBook.pnrHint = "confirm-book failed; checking booking-details";
		}
	} else {
		result.confirmBook.confirmationNumber = bookingId;
		result.confirmBook.status = bookCall.status;
		result.confirmBook.ms = 0;
		result.confirmBook.req = { note: "Instant book — payment included in book request" };
		result.confirmBook.res = bookCall.json;
	}

	// BOOKING-DETAILS
	const detReq = { bookingId };
	const detCall = await apiCall(OMS_BASE, "/oms/v1/booking-details", detReq);
	result.bookingDetails.req = detReq;
	result.bookingDetails.res = detCall.json;
	result.bookingDetails.status = detCall.status;
	result.bookingDetails.ms = detCall.ms;

	const pnr = extractPnrFromBookingDetails(detCall.json);
	result.confirmBook.pnr = pnr;

	if (pnr) {
		result.certStatus = "PASS";
		console.log(`  PASS book flow — PNR ${pnr}`);
	} else {
		result.certStatus = "FAILED";
		console.log("  FAILED — no PNR in booking-details");
	}

	upsertCase(resultsData, result);
	return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────
let casesToRun = [...TEST_CASES];
if (CLI.only?.length) {
	casesToRun = casesToRun.filter((c) => CLI.only.includes(c.id));
}

const resultsData = loadResultsFile();

if (CLI.patch) {
	const passed = new Set(
		resultsData.cases.filter((c) => c.certStatus === "PASS").map((c) => c.id),
	);
	casesToRun = casesToRun.filter((c) => !passed.has(c.id));
}

const estMs = casesToRun.length * (CLI.delay + 8000);
console.log("TripJack UAT runner");
console.log(`  FMS: ${FMS_BASE}`);
console.log(`  OMS: ${OMS_BASE}`);
console.log(`  Outbound date: ${OUTBOUND_DATE}`);
console.log(`  Return date: ${RETURN_DATE}`);
console.log(`  Cases to run: ${casesToRun.length} / ${TEST_CASES.length}`);
console.log(`  Book flow: ${CLI.bookFlow ? "yes (CERT-* only)" : "no"}`);
if (CLI.bookFlow) console.log(`  Run tag: ${UAT_RUN_TAG}`);
console.log(
	`  Estimated time: ~${Math.ceil(estMs / 60000)} min (${casesToRun.length} × ~${Math.round((CLI.delay + 8000) / 1000)}s)`,
);

for (let i = 0; i < casesToRun.length; i++) {
	const tc = casesToRun[i];
	try {
		await runCase(tc, resultsData);
	} catch (err) {
		console.error(`  ERROR ${tc.id}:`, err.message);
		upsertCase(resultsData, {
			id: tc.id,
			description: tc.description,
			sector: sectorLabel(tc.sector),
			pax: paxLabel(tc.pax),
			journeyType: tc.journeyType,
			flightType: tc.flightType,
			certArea: tc.certArea,
			search: emptyStep(),
			review: emptyStep(),
			book: { ...emptyStep(), bookingId: "" },
			confirmBook: { ...emptyStep(), pnr: "", confirmationNumber: "" },
			certStatus: "FAILED",
			error: err.message,
		});
	}
	if (i < casesToRun.length - 1) await sleep(CLI.delay);
}

console.log(`\nDone. Results: ${RESULTS_PATH}`);
