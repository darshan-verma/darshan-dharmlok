#!/usr/bin/env node
/**
 * Generates docs/TripJack-UAT-test-results.md from scripts/uat-raw-results.json
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_PATH = join(ROOT, "scripts/uat-raw-results.json");
const REPORT_PATH = join(ROOT, "docs/TripJack-UAT-test-results.md");

if (!existsSync(RESULTS_PATH)) {
	console.error(`No results file at ${RESULTS_PATH}. Run npm run uat:run first.`);
	process.exit(1);
}

const raw = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
const cases = Array.isArray(raw) ? raw : raw.cases || [];
const meta = raw.meta || {};

function formatExecDate() {
	const d = new Date();
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function truncateSearchRes(res) {
	if (!res || typeof res !== "object") return res;
	const copy = JSON.parse(JSON.stringify(res));
	const ti = copy?.searchResult?.tripInfos;
	if (!ti) return copy;
	for (const key of ["ONWARD", "RETURN", "COMBO"]) {
		if (Array.isArray(ti[key]) && ti[key].length > 2) {
			ti[key] = ti[key].slice(0, 2);
		}
	}
	return copy;
}

function truncateReviewRes(res) {
	if (!res || typeof res !== "object") return res;
	const copy = JSON.parse(JSON.stringify(res));
	if (Array.isArray(copy.tripInfos) && copy.tripInfos.length > 2) {
		copy.tripInfos = copy.tripInfos.slice(0, 2);
	}
	return copy;
}

function jsonBlock(obj) {
	return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
}

function statusCounts() {
	const counts = { PASS: 0, NO_INVENTORY: 0, RATE_LIMITED: 0, FAILED: 0, PENDING: 0 };
	for (const c of cases) {
		const s = c.certStatus || "PENDING";
		counts[s] = (counts[s] || 0) + 1;
	}
	counts.Total = cases.length;
	return counts;
}

function inventoryStr(c) {
	const inv = c.search?.inventory || {};
	return `${inv.onward ?? 0}/${inv.return ?? 0}/${inv.combo ?? 0}`;
}

function httpMs(c) {
	const s = c.search?.status ?? "-";
	const ms = (c.search?.ms ?? 0) + (c.review?.ms ?? 0);
	return `${s} / ${ms}`;
}

const CERT_AREAS = [
	{ area: "Published Fares", id: "CERT-PUBLISHED", certArea: "PUBLISHED" },
	{ area: "Special Return", id: "CERT-SPECIAL-RETURN", certArea: "SPECIAL_RETURN" },
	{ area: "Passport Cases", id: "CERT-PASSPORT", certArea: "PASSPORT" },
	{ area: "With GST", id: "CERT-GST", certArea: "GST" },
	{ area: "Without GST", id: "CERT-NO-GST", certArea: "NO_GST" },
	{ area: "With SSR", id: "CERT-SSR", certArea: "SSR" },
	{ area: "Student Fare (optional)", id: "CERT-STUDENT", certArea: "STUDENT" },
	{ area: "Senior Citizen (optional)", id: "CERT-SENIOR", certArea: "SENIOR" },
];

function certResult(certArea, testId) {
	const c = cases.find((x) => x.id === testId || x.certArea === certArea);
	if (!c) return { result: "PENDING", notes: "Case not yet executed" };

	const bookFlowRan = meta.bookFlow === true && c.book?.req && Object.keys(c.book.req).length > 0;

	if (!bookFlowRan) {
		return { result: "PENDING", notes: "Book flow not yet executed" };
	}

	const pnr = c.confirmBook?.pnr || "";
	if (c.certStatus === "PASS" && pnr) {
		return {
			result: "PASS",
			notes: `PNR ${pnr}, confirmation ${c.confirmBook?.confirmationNumber || c.book?.bookingId || ""}`,
		};
	}
	if (c.certStatus === "NO_INVENTORY") {
		return { result: "NO_INVENTORY", notes: "API returned HTTP 200 with zero inventory for this sector and date." };
	}
	if (c.certStatus === "RATE_LIMITED") {
		return { result: "RATE_LIMITED", notes: "HTTP 429 from API" };
	}
	return {
		result: c.certStatus || "FAILED",
		notes: c.confirmBook?.res?.errors?.[0]?.message || c.book?.res?.errors?.[0]?.message || "",
	};
}

const counts = statusCounts();
const bookFlowRan = meta.bookFlow === true;
const certWithConfirmation = cases.filter(
	(c) =>
		c.certArea &&
		c.confirmBook?.pnr &&
		c.confirmBook?.confirmationNumber,
);

let md = "";

md += `# TripJack UAT Test Results\n\n`;
md += `Execution Date: ${formatExecDate()}\n`;
md += `Environment: ${meta.fmsBaseUrl || "(unknown)"} (FMS), ${meta.omsBaseUrl || "(unknown)"} (OMS)\n`;
md += `Travel dates: outbound ${meta.outboundDate || "—"}, return ${meta.returnDate || "—"}\n\n`;

md += `## Summary\n\n`;
md += `| Status | Count |\n|--------|-------|\n`;
for (const k of ["PASS", "NO_INVENTORY", "RATE_LIMITED", "FAILED", "PENDING", "Total"]) {
	md += `| ${k} | ${counts[k] ?? 0} |\n`;
}
md += `\n`;

md += `## Mandatory Certification Areas\n\n`;
md += `| Area | Test ID | Result | Notes |\n|------|---------|--------|-------|\n`;
for (const row of CERT_AREAS) {
	const { result, notes } = certResult(row.certArea, row.id);
	md += `| ${row.area} | ${row.id} | ${result} | ${notes.replace(/\|/g, "\\|")} |\n`;
}
md += `\n`;

md += `## Oneway Matrix\n\n`;
md += `| S.No | Sector | Pax | Flight type | Status | Flights (O/R/C) | HTTP | ms |\n`;
md += `|------|--------|-----|-------------|--------|-----------------|------|----|\n`;
let sn = 0;
for (const c of cases.filter((x) => x.journeyType === "ONEWAY" && !x.certArea)) {
	sn++;
	md += `| ${sn} | ${c.sector} | ${c.pax} | ${c.flightType} | ${c.certStatus} | ${inventoryStr(c)} | ${c.search?.status ?? "-"} | ${(c.search?.ms ?? 0) + (c.review?.ms ?? 0)} |\n`;
}
md += `\n`;

md += `## Return Matrix\n\n`;
md += `| S.No | Sector | Pax | Flight type | Status | Flights (O/R/C) | SPECIAL_RETURN | HTTP | ms |\n`;
md += `|------|--------|-----|-------------|--------|-----------------|----------------|------|----|\n`;
sn = 0;
for (const c of cases.filter((x) => x.journeyType === "RETURN" && !x.certArea)) {
	sn++;
	const sr = c.hasSpecialReturn ? "Yes" : "No";
	md += `| ${sn} | ${c.sector} | ${c.pax} | ${c.flightType} | ${c.certStatus} | ${inventoryStr(c)} | ${sr} | ${c.search?.status ?? "-"} | ${(c.search?.ms ?? 0) + (c.review?.ms ?? 0)} |\n`;
}
md += `\n`;

md += `## Multicity Matrix\n\n`;
md += `| S.No | Routes | Pax | Flight type | Status | Flights (O/R/C) | HTTP | ms | Notes |\n`;
md += `|------|--------|-----|-------------|--------|-----------------|------|----|-------|\n`;
sn = 0;
for (const c of cases.filter((x) => x.journeyType === "MULTICITY")) {
	sn++;
	let notes = "";
	if (c.certStatus === "NO_INVENTORY") {
		notes = "No inventory for this sector/date. Retry with alternate dates.";
	}
	md += `| ${sn} | ${c.sector} | ${c.pax} | ${c.flightType} | ${c.certStatus} | ${inventoryStr(c)} | ${c.search?.status ?? "-"} | ${(c.search?.ms ?? 0) + (c.review?.ms ?? 0)} | ${notes} |\n`;
}
md += `\n`;

md += `## Booking Certification Note\n\n`;
md += `TripJack certification requires completed bookings with confirmation numbers (search → review → book → confirm-book) plus JSON for book, confirm-book, fare-rule, seat, and amendment APIs where implemented.\n\n`;

	if (bookFlowRan && certWithConfirmation.length) {
	md += `Certification cases with confirmation numbers:\n\n`;
	for (const c of certWithConfirmation) {
		md += `- **${c.id}**: PNR \`${c.confirmBook.pnr}\`, confirmation \`${c.confirmBook.confirmationNumber}\`, bookingId \`${c.book?.bookingId || ""}\`\n`;
	}
} else if (bookFlowRan) {
	const certAttempts = cases.filter((c) => c.certArea && c.book?.req && Object.keys(c.book.req).length > 0);
	const failed = certAttempts.filter((c) => c.certStatus !== "PASS" || !c.confirmBook?.pnr);
	md += `Book flow was executed for ${certAttempts.length} certification case(s). ${certWithConfirmation.length} completed with PNR.\n\n`;
	if (failed.length) {
		md += `Cases that did not complete booking:\n\n`;
		for (const c of failed) {
			const err =
				c.confirmBook?.res?.errors?.[0]?.message ||
				c.book?.res?.errors?.[0]?.message ||
				c.certStatus ||
				"unknown";
			md += `- **${c.id}**: ${err}\n`;
		}
	}
} else {
	md += `Book flow not yet executed. Re-run with \`--book-flow\` flag after confirming search inventory is available.\n`;
}
md += `\n`;

md += `## Detailed Logs\n\n`;

for (const c of cases) {
	md += `### ${c.id} — ${c.description || c.sector}\n\n`;
	md += `- Status: ${c.certStatus}\n`;
	md += `- HTTP: ${httpMs(c)}\n`;
	const inv = c.search?.inventory || {};
	md += `- Inventory: onward=${inv.onward ?? 0}, return=${inv.return ?? 0}, combo=${inv.combo ?? 0}\n\n`;

	if (c.certStatus === "NO_INVENTORY") {
		md += `API returned HTTP 200 with zero inventory for this sector and date.\n\n`;
	}

	if (c.search?.req && Object.keys(c.search.req).length) {
		md += `<details><summary>Search request</summary>\n\n${jsonBlock(c.search.req)}\n\n</details>\n\n`;
	}
	if (c.search?.res && Object.keys(c.search.res).length) {
		md += `<details><summary>Search response (truncated to first 2 results)</summary>\n\n${jsonBlock(truncateSearchRes(c.search.res))}\n\n</details>\n\n`;
	}
	if (c.review?.req && Object.keys(c.review.req).length) {
		md += `<details><summary>Review request</summary>\n\n${jsonBlock(c.review.req)}\n\n</details>\n\n`;
	}
	if (c.review?.res && Object.keys(c.review.res).length) {
		md += `<details><summary>Review response</summary>\n\n${jsonBlock(truncateReviewRes(c.review.res))}\n\n</details>\n\n`;
	}

	const bookRan = c.book?.req && Object.keys(c.book.req).length > 0 && !c.book.req.note;
	if (bookRan) {
		md += `<details><summary>Book request</summary>\n\n${jsonBlock(c.book.req)}\n\n</details>\n\n`;
		md += `<details><summary>Book response</summary>\n\n${jsonBlock(c.book.res)}\n\n</details>\n\n`;
	}
	if (c.confirmBook?.req && Object.keys(c.confirmBook.req).length && !c.confirmBook.req.note) {
		md += `<details><summary>Confirm-book request</summary>\n\n${jsonBlock(c.confirmBook.req)}\n\n</details>\n\n`;
		md += `<details><summary>Confirm-book response</summary>\n\n${jsonBlock(c.confirmBook.res)}\n\n</details>\n\n`;
	} else if (c.confirmBook?.req?.note && bookRan) {
		md += `<details><summary>Confirm-book (instant book)</summary>\n\nInstant book completed in book step; confirmation number: \`${c.confirmBook.confirmationNumber || c.book?.bookingId || ""}\`, PNR: \`${c.confirmBook.pnr || ""}\`\n\n</details>\n\n`;
	}
}

writeFileSync(REPORT_PATH, md);
console.log(`Report written: ${REPORT_PATH}`);
