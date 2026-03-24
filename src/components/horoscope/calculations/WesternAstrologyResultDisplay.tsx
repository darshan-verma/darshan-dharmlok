"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */

function isObj(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function fmt(v: unknown): string {
	if (v === null || v === undefined) return "—";
	if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
	if (typeof v === "boolean") return v ? "Yes" : "No";
	if (typeof v === "string") return v || "—";
	return JSON.stringify(v);
}

function degToDms(deg: number): string {
	const d = Math.floor(deg);
	const mf = (deg - d) * 60;
	const m = Math.floor(mf);
	const sf = (mf - m) * 60;
	const s = Math.round(sf);
	return `${d}° ${String(m).padStart(2, "0")}' ${String(s).padStart(2, "0")}"`;
}

/* ─── sub-components ─── */

const thClass =
	"whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground";
const tdClass = "px-3 py-2.5 align-top text-sm";
const headTrClass = "border-b border-border bg-muted/90 dark:bg-muted/50";
const bodyTrClass =
	"border-b border-border/50 odd:bg-muted/15 last:border-b-0 dark:odd:bg-muted/10";

function SectionHeading({ children }: { children: ReactNode }) {
	return (
		<h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
			{children}
		</h3>
	);
}

function TableWrap({ children }: { children: ReactNode }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-border/80">
			{children}
		</div>
	);
}

/* ─── Planet Positions table ─── */

interface PointData {
	id?: number;
	name?: string;
	sign?: string;
	position?: number;
	house?: number | null;
	retrograde?: boolean;
	longitude?: number;
	speed?: number;
	[k: string]: unknown;
}

const ANGLE_NAMES = new Set(["Ascendant", "MC", "Descendant", "Midheaven", "IC"]);

function PlanetPositionsTable({ points }: { points: PointData[] }) {
	const planets = points.filter((p) => !ANGLE_NAMES.has(p.name ?? ""));
	if (planets.length === 0) return null;
	return (
		<section>
			<SectionHeading>Natal Planet Positions</SectionHeading>
			<TableWrap>
				<table className="w-full min-w-[500px] border-collapse text-sm">
					<thead>
						<tr className={headTrClass}>
							<th className={thClass}>Planet</th>
							<th className={thClass}>Longitude</th>
							<th className={thClass}>Motion</th>
							<th className={thClass}>House</th>
							<th className={thClass}>Zodiac</th>
						</tr>
					</thead>
					<tbody>
						{planets.map((p, i) => (
							<tr key={`${p.name}-${i}`} className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium")}>{fmt(p.name)}</td>
								<td className={tdClass}>
									{p.position != null ? degToDms(p.position) : fmt(p.longitude)}
								</td>
								<td className={tdClass}>
									{p.speed != null ? fmt(p.speed) : p.retrograde ? "R" : "D"}
								</td>
								<td className={tdClass}>{p.house != null ? fmt(p.house) : "—"}</td>
								<td className={tdClass}>{fmt(p.sign)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── Retrograding Planets ─── */

function RetrogradingPlanets({ points }: { points: PointData[] }) {
	const retro = points.filter(
		(p) => p.retrograde === true && !ANGLE_NAMES.has(p.name ?? "")
	);
	return (
		<section>
			<SectionHeading>Retrograding Planets</SectionHeading>
			{retro.length === 0 ? (
				<p className="text-sm text-muted-foreground">No retrograding planets.</p>
			) : (
				<p className="text-sm text-foreground">
					{retro.map((p) => p.name).join(", ")}
				</p>
			)}
		</section>
	);
}

/* ─── Angles table ─── */

function AnglesTable({ points }: { points: PointData[] }) {
	const angles = points.filter((p) => ANGLE_NAMES.has(p.name ?? ""));
	if (angles.length === 0) return null;
	return (
		<section>
			<SectionHeading>Angles</SectionHeading>
			<TableWrap>
				<table className="w-full min-w-[400px] border-collapse text-sm">
					<thead>
						<tr className={headTrClass}>
							<th className={thClass}>Angle</th>
							<th className={thClass}>Longitude</th>
							<th className={thClass}>Degree</th>
							<th className={thClass}>House</th>
							<th className={thClass}>Zodiac</th>
						</tr>
					</thead>
					<tbody>
						{angles.map((p, i) => (
							<tr key={`${p.name}-${i}`} className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium")}>{fmt(p.name)}</td>
								<td className={tdClass}>
									{p.longitude != null ? fmt(p.longitude) : "—"}
								</td>
								<td className={tdClass}>
									{p.position != null ? degToDms(p.position) : "—"}
								</td>
								<td className={tdClass}>{p.house != null ? fmt(p.house) : "—"}</td>
								<td className={tdClass}>{fmt(p.sign)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── House Cusps table ─── */

interface HouseData {
	number?: number;
	sign?: string;
	start?: number;
	end?: number;
	[k: string]: unknown;
}

function HouseCuspsTable({ houses }: { houses: HouseData[] }) {
	if (houses.length === 0) return null;
	return (
		<section>
			<SectionHeading>House Cusps</SectionHeading>
			<TableWrap>
				<table className="w-full min-w-[350px] border-collapse text-sm">
					<thead>
						<tr className={headTrClass}>
							<th className={thClass}>House</th>
							<th className={thClass}>Start Cusp</th>
							<th className={thClass}>End Cusp</th>
						</tr>
					</thead>
					<tbody>
						{houses.map((h, i) => (
							<tr key={`house-${h.number ?? i}`} className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium")}>{h.number ?? i + 1}</td>
								<td className={tdClass}>{h.start != null ? fmt(h.start) : "—"}</td>
								<td className={tdClass}>{h.end != null ? fmt(h.end) : "—"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── Aspect types legend ─── */

interface AspectData {
	name?: string;
	angle?: number;
	orb?: number;
	primary_point?: string;
	secondary_point?: string;
	type?: string;
	[k: string]: unknown;
}

const MAJOR_ASPECTS = new Set([
	"Conjunction",
	"Opposition",
	"Square",
	"Trine",
	"Sextile",
]);
const MINOR_ASPECTS = new Set([
	"Semi-Sextile",
	"Semi-Square",
	"Sesqui-Square",
	"Quincunx",
	"Quintile",
	"Bi-Quintile",
]);

function AspectTypeLegend({ aspects }: { aspects: AspectData[] }) {
	const majorNames = [
		...new Set(
			aspects
				.filter((a) => MAJOR_ASPECTS.has(a.name ?? ""))
				.map((a) => a.name!)
		),
	];
	const minorNames = [
		...new Set(
			aspects
				.filter((a) => MINOR_ASPECTS.has(a.name ?? ""))
				.map((a) => a.name!)
		),
	];
	const declNames = [
		...new Set(
			aspects
				.filter(
					(a) =>
						!MAJOR_ASPECTS.has(a.name ?? "") && !MINOR_ASPECTS.has(a.name ?? "")
				)
				.map((a) => a.name!)
		),
	];

	if (aspects.length === 0) return null;

	return (
		<section>
			<SectionHeading>List of Aspects</SectionHeading>
			<TableWrap>
				<table className="w-full border-collapse text-sm">
					<tbody>
						{majorNames.length > 0 && (
							<tr className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium w-48")}>Major Aspects</td>
								<td className={tdClass}>{majorNames.join(", ")}</td>
							</tr>
						)}
						{minorNames.length > 0 && (
							<tr className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium w-48")}>Minor Aspects</td>
								<td className={tdClass}>{minorNames.join(", ")}</td>
							</tr>
						)}
						{declNames.length > 0 && (
							<tr className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium w-48")}>
									Declination Aspects
								</td>
								<td className={tdClass}>{declNames.join(", ")}</td>
							</tr>
						)}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── Planet Aspects table ─── */

function PlanetAspectsTable({ aspects }: { aspects: AspectData[] }) {
	if (aspects.length === 0) return null;

	const major = aspects.filter((a) => MAJOR_ASPECTS.has(a.name ?? ""));
	const minor = aspects.filter((a) => !MAJOR_ASPECTS.has(a.name ?? ""));

	function renderGroup(title: string, list: AspectData[]) {
		if (list.length === 0) return null;
		return (
			<>
				<tr>
					<td
						colSpan={4}
						className="bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
					>
						{title}
					</td>
				</tr>
				{list.map((a, i) => (
					<tr key={`${a.primary_point}-${a.name}-${a.secondary_point}-${i}`} className={bodyTrClass}>
						<td className={cn(tdClass, "font-medium")}>{fmt(a.primary_point)}</td>
						<td className={tdClass}>{fmt(a.name)}</td>
						<td className={cn(tdClass, "font-medium")}>{fmt(a.secondary_point)}</td>
						<td className={tdClass}>{a.orb != null ? fmt(a.orb) : "—"}</td>
					</tr>
				))}
			</>
		);
	}

	return (
		<section>
			<SectionHeading>Planet Aspects</SectionHeading>
			<TableWrap>
				<table className="w-full min-w-[450px] border-collapse text-sm">
					<thead>
						<tr className={headTrClass}>
							<th className={thClass}>Planet 1</th>
							<th className={thClass}>Aspect</th>
							<th className={thClass}>Planet 2</th>
							<th className={thClass}>Orb</th>
						</tr>
					</thead>
					<tbody>
						{renderGroup("Major Aspects", major)}
						{renderGroup("Minor Aspects", minor)}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── Profile / metadata summary ─── */

const METADATA_KEYS = new Set([
	"profile",
	"primary_profile",
	"secondary_profile",
	"house_system",
	"chart_type",
	"orb",
	"transit_datetime",
	"progression_year",
	"solar_return_year",
	"status",
]);

function titleCase(key: string): string {
	return key
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProfileSummary({ data }: { data: Record<string, unknown> }) {
	const rows: { label: string; value: string }[] = [];

	// Profile info
	for (const key of [
		"profile",
		"primary_profile",
		"secondary_profile",
	] as const) {
		const p = data[key];
		if (isObj(p)) {
			const dt = typeof p.datetime === "string" ? p.datetime : "";
			const coords = isObj(p.coordinates)
				? `${fmt(p.coordinates.latitude)}, ${fmt(p.coordinates.longitude)}`
				: typeof p.coordinates === "string"
					? p.coordinates
					: "";
			if (dt || coords) {
				rows.push({
					label: titleCase(key),
					value: [dt, coords].filter(Boolean).join(" — "),
				});
			}
		}
	}

	// Scalar metadata
	for (const key of [
		"house_system",
		"chart_type",
		"orb",
		"transit_datetime",
		"progression_year",
		"solar_return_year",
	]) {
		const v = data[key];
		if (v != null && v !== "") {
			rows.push({ label: titleCase(key), value: fmt(v) });
		}
	}

	if (rows.length === 0) return null;

	return (
		<section>
			<SectionHeading>Chart Details</SectionHeading>
			<TableWrap>
				<table className="w-full border-collapse text-sm">
					<tbody>
						{rows.map((r, i) => (
							<tr key={`${r.label}-${i}`} className={bodyTrClass}>
								<td className={cn(tdClass, "font-medium w-48 text-muted-foreground")}>
									{r.label}
								</td>
								<td className={tdClass}>{r.value}</td>
							</tr>
						))}
					</tbody>
				</table>
			</TableWrap>
		</section>
	);
}

/* ─── Generic key-value renderer for remaining fields ─── */

function RemainingFieldsTable({ data, excludeKeys }: { data: Record<string, unknown>; excludeKeys: Set<string> }) {
	const entries = Object.entries(data).filter(
		([k]) => !excludeKeys.has(k)
	);
	if (entries.length === 0) return null;

	const rows: { label: string; value: ReactNode }[] = [];

	for (const [key, value] of entries) {
		if (value === null || value === undefined) continue;

		if (Array.isArray(value)) {
			if (value.length === 0) continue;
			// Render arrays of objects as tables
			if (value.every(isObj)) {
				const allKeys = Array.from(
					new Set(value.flatMap((row) => Object.keys(row as object)))
				);
				rows.push({
					label: titleCase(key),
					value: (
						<TableWrap>
							<table className="w-full border-collapse text-sm">
								<thead>
									<tr className={headTrClass}>
										{allKeys.map((k) => (
											<th key={k} className={thClass}>{titleCase(k)}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{value.map((row, ri) => (
										<tr key={ri} className={bodyTrClass}>
											{allKeys.map((k) => (
												<td key={k} className={tdClass}>
													{isObj((row as Record<string, unknown>)[k])
														? Object.entries(
																(row as Record<string, unknown>)[k] as Record<string, unknown>
															)
																.filter(([, v]) => v != null)
																.map(([rk, rv]) => `${titleCase(rk)}: ${fmt(rv)}`)
																.join(", ")
														: fmt((row as Record<string, unknown>)[k])}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</TableWrap>
					),
				});
			} else {
				rows.push({
					label: titleCase(key),
					value: value.map((v) => fmt(v)).join(", "),
				});
			}
		} else if (isObj(value)) {
			const subEntries = Object.entries(value).filter(
				([, v]) => v != null && v !== ""
			);
			if (subEntries.length > 0) {
				rows.push({
					label: titleCase(key),
					value: subEntries
						.map(([sk, sv]) =>
							isObj(sv)
								? `${titleCase(sk)}: ${Object.entries(sv)
										.filter(([, v]) => v != null)
										.map(([k2, v2]) => `${titleCase(k2)}: ${fmt(v2)}`)
										.join(", ")}`
								: `${titleCase(sk)}: ${fmt(sv)}`
						)
						.join(" | "),
				});
			}
		} else {
			rows.push({ label: titleCase(key), value: fmt(value) });
		}
	}

	if (rows.length === 0) return null;

	return (
		<section>
			<SectionHeading>Additional Information</SectionHeading>
			<div className="space-y-6">
				{rows.map((r, i) => {
					// If value is a ReactNode (table), render it as a sub-section
					if (typeof r.value !== "string") {
						return (
							<div key={`${r.label}-${i}`}>
								<h4 className="mb-2 text-base font-semibold tracking-tight text-foreground">
									{r.label}
								</h4>
								{r.value}
							</div>
						);
					}
					return null;
				})}
				{/* Render scalar values as a single table */}
				{rows.some((r) => typeof r.value === "string") && (
					<TableWrap>
						<table className="w-full border-collapse text-sm">
							<tbody>
								{rows
									.filter((r) => typeof r.value === "string")
									.map((r, i) => (
										<tr key={`${r.label}-${i}`} className={bodyTrClass}>
											<td className={cn(tdClass, "font-medium w-48 text-muted-foreground")}>
												{r.label}
											</td>
											<td className={tdClass}>{r.value as string}</td>
										</tr>
									))}
							</tbody>
						</table>
					</TableWrap>
				)}
			</div>
		</section>
	);
}

/* ─── Deep data extraction helper ─── */

function extractArrayField(
	obj: Record<string, unknown>,
	...keys: string[]
): unknown[] {
	for (const key of keys) {
		if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
			return obj[key] as unknown[];
		}
	}
	return [];
}

/* ─── Main composite result ─── */

export interface WesternResultData {
	chartSvg: string | null;
	aspectChartSvg: string | null;
	jsonData: Record<string, unknown> | null;
}

export function WesternAstrologyResultDisplay({
	result,
	chartLabel = "Chart",
}: {
	result: WesternResultData;
	chartLabel?: string;
}) {
	const { chartSvg, aspectChartSvg, jsonData } = result;
	if (!chartSvg && !aspectChartSvg && !jsonData) return null;

	// Unwrap the response envelope: { status, data: { ... } }
	const raw = jsonData ?? {};
	const data = isObj(raw.data) ? (raw.data as Record<string, unknown>) : raw;
	const dataObj = isObj(data) ? data : null;

	// Deep-extract arrays from the data
	const points = dataObj
		? (extractArrayField(dataObj, "points", "planet_positions") as PointData[])
		: [];
	const houses = dataObj
		? (extractArrayField(dataObj, "houses") as HouseData[])
		: [];
	const aspects = dataObj
		? (extractArrayField(dataObj, "aspects", "aspect_chart") as AspectData[])
		: [];

	// Track which keys we've already rendered
	const consumedKeys = new Set([
		"points",
		"planet_positions",
		"houses",
		"aspects",
		"aspect_chart",
		...METADATA_KEYS,
	]);

	return (
		<div className="border-t border-orange-100 px-6 py-8 dark:border-orange-900/45 md:px-8">
			<div className="space-y-10">
				{/* Chart SVG */}
				{chartSvg && (
					<section>
						<SectionHeading>{chartLabel}</SectionHeading>
						<div
							className="overflow-auto rounded-lg border border-orange-200/80 bg-white p-4 shadow-sm dark:border-orange-900/50 dark:bg-card [&_svg]:mx-auto [&_svg]:max-w-full"
							dangerouslySetInnerHTML={{ __html: chartSvg }}
						/>
					</section>
				)}

				{/* Aspect Chart SVG */}
				{aspectChartSvg && (
					<section>
						<SectionHeading>Aspect Chart</SectionHeading>
						<div
							className="overflow-auto rounded-lg border border-orange-200/80 bg-white p-4 shadow-sm dark:border-orange-900/50 dark:bg-card [&_svg]:mx-auto [&_svg]:max-w-full"
							dangerouslySetInnerHTML={{ __html: aspectChartSvg }}
						/>
					</section>
				)}

				{/* Profile / metadata summary */}
				{dataObj && <ProfileSummary data={dataObj} />}

				{/* Planet Positions */}
				{points.length > 0 && (
					<>
						<PlanetPositionsTable points={points} />
						<RetrogradingPlanets points={points} />
						<AnglesTable points={points} />
					</>
				)}

				{/* House Cusps */}
				{houses.length > 0 && <HouseCuspsTable houses={houses} />}

				{/* Aspects */}
				{aspects.length > 0 && (
					<>
						<AspectTypeLegend aspects={aspects} />
						<PlanetAspectsTable aspects={aspects} />
					</>
				)}

				{/* Additional Info */}
				{dataObj && (
					<RemainingFieldsTable data={dataObj} excludeKeys={consumedKeys} />
				)}
			</div>
		</div>
	);
}
