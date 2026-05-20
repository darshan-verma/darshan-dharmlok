#!/usr/bin/env node
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const API_KEY = process.env.TRIPJACK_API_KEY;
const BASE = "https://apitest.tripjack.com";

function td(d) {
	const x = new Date();
	x.setDate(x.getDate() + d);
	return x.toISOString().slice(0, 10);
}

async function search(name, payload) {
	await new Promise((r) => setTimeout(r, 4000));
	const res = await fetch(`${BASE}/fms/v1/air-search-all`, {
		method: "POST",
		headers: { "Content-Type": "application/json", apikey: API_KEY },
		body: JSON.stringify(payload),
	});
	const j = await res.json().catch(() => ({}));
	const ti = j?.searchResult?.tripInfos;
	const keys = ti ? Object.keys(ti) : [];
	let total = 0;
	if (ti) {
		for (const k of keys) {
			if (Array.isArray(ti[k])) total += ti[k].length;
		}
	}
	console.log(name, "http", res.status, "keys", keys.join(","), "count", total);
	if (total === 0) {
		console.log("body sample:", JSON.stringify(j).slice(0, 1200));
	} else {
		console.log(JSON.stringify(j.searchResult.tripInfos, null, 2).slice(0, 800));
	}
	return { status: res.status, total, j };
}

// Original MC-1 spec
await search("MC1-original", {
	searchQuery: {
		cabinClass: "ECONOMY",
		paxInfo: { ADULT: "5", CHILD: "3" },
		routeInfos: [
			{ fromCityOrAirport: { code: "DEL" }, toCityOrAirport: { code: "BOM" }, travelDate: td(75) },
			{ fromCityOrAirport: { code: "BOM" }, toCityOrAirport: { code: "BLR" }, travelDate: td(79) },
			{ fromCityOrAirport: { code: "BLR" }, toCityOrAirport: { code: "DEL" }, travelDate: td(83) },
		],
		searchModifiers: { isDirectFlight: false, isConnectingFlight: true },
	},
});

// 2-leg domestic multicity (cert minimum)
await search("MC1-2leg", {
	searchQuery: {
		cabinClass: "ECONOMY",
		paxInfo: { ADULT: "5", CHILD: "3" },
		routeInfos: [
			{ fromCityOrAirport: { code: "DEL" }, toCityOrAirport: { code: "BOM" }, travelDate: td(75) },
			{ fromCityOrAirport: { code: "BOM" }, toCityOrAirport: { code: "DEL" }, travelDate: td(82) },
		],
	},
});

await search("MC2-original", {
	searchQuery: {
		cabinClass: "ECONOMY",
		paxInfo: { ADULT: "5", CHILD: "4", INFANT: "1" },
		routeInfos: [
			{ fromCityOrAirport: { code: "DEL" }, toCityOrAirport: { code: "BOM" }, travelDate: td(75) },
			{ fromCityOrAirport: { code: "BOM" }, toCityOrAirport: { code: "GOI" }, travelDate: td(79) },
		],
		searchModifiers: { isDirectFlight: true, isConnectingFlight: false },
	},
});

await search("MC3-original", {
	searchQuery: {
		cabinClass: "ECONOMY",
		paxInfo: { ADULT: "4", CHILD: "2", INFANT: "2" },
		routeInfos: [
			{ fromCityOrAirport: { code: "DEL" }, toCityOrAirport: { code: "DXB" }, travelDate: td(75) },
			{ fromCityOrAirport: { code: "DXB" }, toCityOrAirport: { code: "BKK" }, travelDate: td(80) },
		],
		searchModifiers: { isDirectFlight: true, isConnectingFlight: false },
	},
});
