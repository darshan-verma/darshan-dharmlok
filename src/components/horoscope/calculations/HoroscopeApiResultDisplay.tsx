"use client";

import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function titleCaseKey(key: string): string {
	return key
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatScalar(v: unknown): string {
	if (v === null || v === undefined) return "—";
	if (typeof v === "string") return v;
	if (typeof v === "number" || typeof v === "boolean") return String(v);
	return JSON.stringify(v);
}

function formatLord(lord: unknown): string {
	if (!isPlainObject(lord)) return formatScalar(lord);
	const name = lord.name;
	const vedic = lord.vedic_name;
	if (typeof name === "string" && typeof vedic === "string") {
		return `${name} (${vedic})`;
	}
	if (typeof name === "string") return name;
	return JSON.stringify(lord);
}

function resolveDescriptionValue(raw: Record<string, unknown>): string {
	const pickText = (value: unknown): string | null => {
		if (typeof value === "string") {
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : null;
		}
		if (typeof value === "number" || typeof value === "boolean") {
			return String(value);
		}
		if (isPlainObject(value)) {
			if (typeof value.description === "string" && value.description.trim()) {
				return value.description.trim();
			}
			if (typeof value.message === "string" && value.message.trim()) {
				return value.message.trim();
			}
			return null;
		}
		return null;
	};

	const fallbackKeys = [
		"description",
		"message",
		"result",
		"notes",
		"detail",
		"details",
		"summary",
		"remarks",
	] as const;

	for (const key of fallbackKeys) {
		const maybe = pickText(raw[key]);
		if (maybe) return maybe;
	}

	return "—";
}

function KeyValueTable({
	title,
	rows,
}: {
	title: string;
	rows: { label: string; value: ReactNode }[];
}) {
	if (rows.length === 0) return null;
	return (
		<div className="min-w-0 w-full space-y-2">
			<h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
			<div className="overflow-x-auto rounded-lg border border-border/80">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/90 dark:bg-muted/50">
						<th
							scope="col"
							className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground"
						>
							Field
						</th>
						<th
							scope="col"
							className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground"
						>
							Value
						</th>
					</tr>
				</thead>
					<tbody>
						{rows.map((row, i) => (
							<tr
								key={`${row.label}-${i}`}
								className="border-b border-border/50 odd:bg-muted/15 last:border-b-0 dark:odd:bg-muted/10"
							>
								<td className="break-words px-3 py-2.5 align-top font-medium text-muted-foreground">
									{row.label}
								</td>
								<td className="min-w-0 break-words px-3 py-2.5 align-top text-foreground">
									{row.value}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function NakshatraSections({ block }: { block: Record<string, unknown> }) {
	const nak = block.nakshatra;
	const ch = block.chandra_rasi;
	const su = block.soorya_rasi;
	const zo = block.zodiac;
	const add = block.additional_info;

	const nakshatraRows: { label: string; value: ReactNode }[] = [];

	if (isPlainObject(nak)) {
		if (typeof nak.name === "string") {
			nakshatraRows.push({ label: "Nakshatra", value: nak.name });
		}
		if (nak.lord != null) {
			nakshatraRows.push({ label: "Nakshatra Lord", value: formatLord(nak.lord) });
		}
		if (typeof nak.pada === "number") {
			nakshatraRows.push({ label: "Pada", value: String(nak.pada) });
		}
	}
	if (isPlainObject(ch)) {
		if (typeof ch.name === "string") {
			nakshatraRows.push({ label: "Chandra Rasi", value: ch.name });
		}
		if (ch.lord != null) {
			nakshatraRows.push({ label: "Chandra Rasi Lord", value: formatLord(ch.lord) });
		}
	}
	if (isPlainObject(su)) {
		if (typeof su.name === "string") {
			nakshatraRows.push({ label: "Soorya Rasi", value: su.name });
		}
		if (su.lord != null) {
			nakshatraRows.push({ label: "Soorya Rasi Lord", value: formatLord(su.lord) });
		}
	}
	if (isPlainObject(zo) && typeof zo.name === "string") {
		nakshatraRows.push({ label: "Zodiac", value: zo.name });
	}

	const additionalRows: { label: string; value: ReactNode }[] = [];
	if (isPlainObject(add)) {
		for (const [k, v] of Object.entries(add)) {
			if (v === null || v === undefined) continue;
			if (typeof v === "object") {
				additionalRows.push({
					label: titleCaseKey(k),
					value: <HoroscopeJsonFallback value={v} depth={1} />,
				});
			} else {
				additionalRows.push({ label: titleCaseKey(k), value: formatScalar(v) });
			}
		}
	}

	return (
		<div className="space-y-8">
			<KeyValueTable title="Nakshatra Details" rows={nakshatraRows} />
			{additionalRows.length > 0 ? (
				<KeyValueTable title="Additional Info" rows={additionalRows} />
			) : null}
		</div>
	);
}

function YogaDetailsSection({ yogas }: { yogas: unknown[] }) {
	const list = yogas.filter(isPlainObject) as Record<string, unknown>[];
	if (list.length === 0) return null;

	return (
		<div className="min-w-0 space-y-8">
			<h3 className="text-lg font-semibold tracking-tight text-foreground">Yoga Details</h3>
			{list.map((group, gi) => {
				const name = typeof group.name === "string" ? group.name : `Group ${gi + 1}`;
				const desc = typeof group.description === "string" ? group.description : "";
				const yogaList = Array.isArray(group.yoga_list) ? group.yoga_list : [];

				return (
					<section key={`${name}-${gi}`} className="min-w-0 space-y-4">
						<h4 className="text-base font-semibold text-foreground">{name}</h4>
						{desc ? (
							<p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
						) : null}
						<div className="space-y-6">
							{yogaList.map((raw, yi) => {
								if (!isPlainObject(raw)) return null;
								const yn = typeof raw.name === "string" ? raw.name : "";
								const hasYoga = raw.has_yoga !== false;
								const yd = typeof raw.description === "string" ? raw.description : "";
								if (!hasYoga) return null;
								return (
									<div key={`${yn}-${yi}`} className="min-w-0 space-y-2 border-b border-border/40 pb-6 last:border-b-0 last:pb-0">
										<p className="text-sm font-semibold text-foreground">{yn}</p>
										{yd ? (
											<p className="text-sm leading-relaxed text-muted-foreground">{yd}</p>
										) : null}
									</div>
								);
							})}
						</div>
					</section>
				);
			})}
		</div>
	);
}

function MangalDoshaCard({ raw }: { raw: Record<string, unknown> }) {
	const has = raw.has_dosha === true;
	const description = typeof raw.description === "string" ? raw.description : "";
	const hasException = raw.has_exception === true;
	const type = raw.type;
	const exceptions = Array.isArray(raw.exceptions) ? raw.exceptions : [];
	const remedies = Array.isArray(raw.remedies) ? raw.remedies : [];

	return (
		<div className="min-w-0 space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
			<h4 className="text-base font-semibold text-foreground">Mangal Dosha</h4>
			<p className="text-sm">
				<span className="font-medium text-muted-foreground">Present: </span>
				{has ? "Yes" : "No"}
			</p>
			{description ? (
				<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
			) : null}
			{"has_exception" in raw ? (
				<p className="text-sm">
					<span className="font-medium text-muted-foreground">Exception: </span>
					{hasException ? "Yes" : "No"}
				</p>
			) : null}
			{type != null && type !== "" ? (
				<p className="text-sm">
					<span className="font-medium text-muted-foreground">Type: </span>
					{String(type)}
				</p>
			) : null}
			{exceptions.length > 0 ? (
				<div>
					<p className="text-sm font-medium text-muted-foreground">Exceptions</p>
					<ul className="mt-1 list-inside list-disc text-sm text-foreground">
						{exceptions.filter((x) => typeof x === "string").map((x, i) => (
							<li key={i}>{x}</li>
						))}
					</ul>
				</div>
			) : null}
			{remedies.length > 0 ? (
				<div>
					<p className="text-sm font-medium text-muted-foreground">Remedies</p>
					<ul className="mt-1 list-inside list-disc text-sm text-foreground">
						{remedies.filter((x) => typeof x === "string").map((x, i) => (
							<li key={i}>{x}</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}

function DashaBalanceCard({ raw }: { raw: Record<string, unknown> }) {
	const lord = raw.lord;
	const duration = typeof raw.duration === "string" ? raw.duration : "";
	const description = typeof raw.description === "string" ? raw.description : "";
	let lordText = "";
	if (isPlainObject(lord)) {
		const n = lord.name;
		const v = lord.vedic_name;
		if (typeof n === "string" && typeof v === "string") lordText = `${n} (${v})`;
		else if (typeof n === "string") lordText = n;
	}

	return (
		<div className="min-w-0 space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
			<h4 className="text-base font-semibold text-foreground">Dasha balance</h4>
			{lordText ? (
				<p className="text-sm">
					<span className="font-medium text-muted-foreground">Lord: </span>
					{lordText}
				</p>
			) : null}
			{duration ? (
				<p className="text-sm">
					<span className="font-medium text-muted-foreground">Duration: </span>
					{duration}
				</p>
			) : null}
			{description ? (
				<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
			) : null}
		</div>
	);
}

function DashaPeriodRows({
	items,
	depth,
}: {
	items: Record<string, unknown>[];
	depth: number;
}): ReactNode {
	return (
		<>
			{items.map((item, i) => {
				const name = typeof item.name === "string" ? item.name : "—";
				const start = typeof item.start === "string" ? item.start : "";
				const end = typeof item.end === "string" ? item.end : "";
				const antar = Array.isArray(item.antardasha)
					? (item.antardasha as Record<string, unknown>[])
					: [];
				const prat = Array.isArray(item.pratyantardasha)
					? (item.pratyantardasha as Record<string, unknown>[])
					: [];
				return (
					<Fragment key={`${name}-${i}-${start}`}>
						<tr className="border-b border-border/50">
							<td
								className="min-w-0 px-3 py-2 align-top text-sm"
								style={{ paddingLeft: `${12 + depth * 16}px` }}
							>
								{name}
							</td>
							<td className="whitespace-nowrap px-3 py-2 align-top text-xs tabular-nums text-muted-foreground">
								{start}
							</td>
							<td className="whitespace-nowrap px-3 py-2 align-top text-xs tabular-nums text-muted-foreground">
								{end}
							</td>
						</tr>
						{antar.length > 0 ? (
							<DashaPeriodRows items={antar} depth={depth + 1} />
						) : null}
						{prat.length > 0 ? (
							<DashaPeriodRows items={prat} depth={depth + 1} />
						) : null}
					</Fragment>
				);
			})}
		</>
	);
}

function DashaPeriodsTable({ periods }: { periods: unknown[] }) {
	const rows = periods.filter(isPlainObject) as Record<string, unknown>[];
	if (rows.length === 0) return null;

	return (
		<div className="min-w-0 space-y-2">
			<h4 className="text-base font-semibold text-foreground">Dasha periods</h4>
			<div className="overflow-x-auto rounded-lg border border-border/80">
				<table className="w-full min-w-[400px] border-collapse text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/90 dark:bg-muted/50">
							<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
								Period
							</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
								Start
							</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
								End
							</th>
						</tr>
					</thead>
					<tbody>{DashaPeriodRows({ items: rows, depth: 0 })}</tbody>
				</table>
			</div>
		</div>
	);
}

function objectRows(raw: Record<string, unknown>): { label: string; value: ReactNode }[] {
	const rows: { label: string; value: ReactNode }[] = [];
	for (const [key, value] of Object.entries(raw)) {
		rows.push({
			label: titleCaseKey(key),
			value: isPlainObject(value) || Array.isArray(value) ? (
				<HoroscopeJsonFallback value={value} depth={1} />
			) : (
				formatScalar(value)
			),
		});
	}
	return rows;
}

function CompatibilityMessageCard({ message }: { message: unknown }) {
	if (typeof message === "string" && message.trim()) {
		return (
			<div className="rounded-lg border border-border/80 bg-muted/20 p-4">
				<p className="text-sm leading-relaxed text-foreground">{message}</p>
			</div>
		);
	}
	if (!isPlainObject(message)) return null;
	const type = typeof message.type === "string" ? message.type : null;
	const description =
		typeof message.description === "string" ? message.description : null;
	return (
		<div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
			<h4 className="text-base font-semibold text-foreground">Compatibility Verdict</h4>
			{type ? (
				<p className="text-sm">
					<span className="font-medium text-muted-foreground">Type: </span>
					{type}
				</p>
			) : null}
			{description ? (
				<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
			) : null}
		</div>
	);
}

function ScoreSummaryCard({
	maximumPoints,
	obtainedPoints,
	totalPoints,
}: {
	maximumPoints?: number;
	obtainedPoints?: number;
	totalPoints?: number;
}) {
	if (
		typeof maximumPoints !== "number" &&
		typeof obtainedPoints !== "number" &&
		typeof totalPoints !== "number"
	) {
		return null;
	}
	return (
		<div className="rounded-lg border border-border/80 bg-muted/20 p-4">
			<h4 className="text-base font-semibold text-foreground">Compatibility Score</h4>
			<div className="mt-2 grid gap-2 sm:grid-cols-3">
				{typeof totalPoints === "number" ? (
					<p className="text-sm">
						<span className="font-medium text-muted-foreground">Total Points: </span>
						{totalPoints}
					</p>
				) : null}
				{typeof obtainedPoints === "number" ? (
					<p className="text-sm">
						<span className="font-medium text-muted-foreground">Obtained Points: </span>
						{obtainedPoints}
					</p>
				) : null}
				{typeof maximumPoints === "number" ? (
					<p className="text-sm">
						<span className="font-medium text-muted-foreground">Maximum Points: </span>
						{maximumPoints}
					</p>
				) : null}
			</div>
		</div>
	);
}

function CompatibilityMatchesTable({ matches }: { matches: unknown[] }) {
	const rows = matches.filter(isPlainObject) as Record<string, unknown>[];
	if (rows.length === 0) return null;
	return (
		<div className="min-w-0 space-y-2">
			<h4 className="text-base font-semibold text-foreground">Match Breakdown</h4>
			<div className="overflow-x-auto rounded-lg border border-border/80">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/90 dark:bg-muted/50">
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Name
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Match
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Status
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Points
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Description
						</th>
					</tr>
				</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr
								key={`${formatScalar(row.name)}-${idx}`}
								className="border-b border-border/50 odd:bg-muted/15 last:border-b-0 dark:odd:bg-muted/10"
							>
								<td className="break-words px-3 py-2.5 align-top">{formatScalar(row.name)}</td>
								<td className="px-3 py-2.5 align-top">
									{typeof row.has_porutham === "boolean"
										? row.has_porutham
											? "Yes"
											: "No"
										: "—"}
								</td>
								<td className="px-3 py-2.5 align-top">{formatScalar(row.porutham_status)}</td>
								<td className="px-3 py-2.5 align-top">{formatScalar(row.points)}</td>
								<td className="break-words px-3 py-2.5 align-top text-muted-foreground">
									{resolveDescriptionValue(row)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function GunaBreakdownTable({ guna }: { guna: unknown[] }) {
	const rows = guna.filter(isPlainObject) as Record<string, unknown>[];
	if (rows.length === 0) return null;
	return (
		<div className="min-w-0 space-y-2">
			<h4 className="text-base font-semibold text-foreground">Guna Breakdown</h4>
			<div className="overflow-x-auto rounded-lg border border-border/80">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/90 dark:bg-muted/50">
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Guna
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Obtained
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Maximum
						</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
							Description
						</th>
					</tr>
				</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr
								key={`${formatScalar(row.name)}-${idx}`}
								className="border-b border-border/50 odd:bg-muted/15 last:border-b-0 dark:odd:bg-muted/10"
							>
								<td className="break-words px-3 py-2.5 align-top">{formatScalar(row.name)}</td>
								<td className="px-3 py-2.5 align-top">{formatScalar(row.obtained_points)}</td>
								<td className="px-3 py-2.5 align-top">{formatScalar(row.maximum_points)}</td>
								<td className="break-words px-3 py-2.5 align-top text-muted-foreground">
									{resolveDescriptionValue(row)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function PapasamyamComparisonCard({
	girl,
	boy,
}: {
	girl: Record<string, unknown>;
	boy: Record<string, unknown>;
}) {
	return (
		<div className="space-y-6">
			<KeyValueTable title="Girl Papasamyam" rows={objectRows(girl)} />
			<KeyValueTable title="Boy Papasamyam" rows={objectRows(boy)} />
		</div>
	);
}

export function HoroscopeJsonFallback({
	value,
	depth = 0,
}: {
	value: unknown;
	depth?: number;
}) {
	if (value === null || value === undefined) {
		return <span className="text-muted-foreground">—</span>;
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return <span className="break-words text-sm leading-relaxed">{formatScalar(value)}</span>;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-sm text-muted-foreground">Empty list</span>;
		}
		const allObj = value.every(isPlainObject);
		if (allObj && value.length > 0) {
			const keys = Array.from(new Set(value.flatMap((row) => Object.keys(row as object))));
			return (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse border border-border/60 text-sm">
						<thead>
							<tr className="border-b bg-muted/80">
								{keys.map((k) => (
									<th
										key={k}
										className="break-words px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
									>
										{titleCaseKey(k)}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{value.map((row, i) => (
								<tr key={i} className="border-b border-border/40 last:border-b-0">
									{keys.map((k) => (
										<td key={k} className="break-words px-3 py-2 align-top">
											<HoroscopeJsonFallback
												value={(row as Record<string, unknown>)[k]}
												depth={depth + 1}
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		}
		return (
			<ul className="list-inside list-disc space-y-2 text-sm">
				{value.map((item, i) => (
					<li key={i}>
						<HoroscopeJsonFallback value={item} depth={depth + 1} />
					</li>
				))}
			</ul>
		);
	}

	if (isPlainObject(value)) {
		const entries = Object.entries(value);
		if (entries.length === 0) {
			return <span className="text-muted-foreground">—</span>;
		}
		return (
			<div
				className={cn(
					"min-w-0 space-y-4",
					depth > 0 && "rounded-lg border border-border/50 bg-muted/15 p-3 dark:bg-muted/10"
				)}
			>
				{entries.map(([k, v]) => (
					<div key={k} className="min-w-0">
						<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							{titleCaseKey(k)}
						</div>
						<div className="mt-1.5 min-w-0">
							<HoroscopeJsonFallback value={v} depth={depth + 1} />
						</div>
					</div>
				))}
			</div>
		);
	}

	return <span className="text-sm">{String(value)}</span>;
}

function StatusBadge({ status }: { status: string }) {
	const ok = status === "ok";
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span>
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
					ok
						? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
						: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
				)}
			>
				{status}
			</span>
		</div>
	);
}

function CreditsBadge({ n }: { n: number }) {
	return (
		<span className="inline-flex rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
			Credit used: {n}
		</span>
	);
}

function renderStructuredData(data: Record<string, unknown>): ReactNode {
	const consumed = new Set<string>();
	const parts: ReactNode[] = [];

	if (typeof data.credits_used === "number") {
		parts.push(<CreditsBadge key="credits" n={data.credits_used} />);
		consumed.add("credits_used");
	}

	if (isPlainObject(data.girl_info) && isPlainObject(data.boy_info)) {
		parts.push(
			<div key="partner-info" className="space-y-6">
				<KeyValueTable title="Girl Details" rows={objectRows(data.girl_info)} />
				<KeyValueTable title="Boy Details" rows={objectRows(data.boy_info)} />
			</div>
		);
		consumed.add("girl_info");
		consumed.add("boy_info");
	}

	if (data.message != null) {
		const messageCard = <CompatibilityMessageCard message={data.message} />;
		if (messageCard) {
			parts.push(<div key="compatibility-message">{messageCard}</div>);
			consumed.add("message");
		}
	}

	if (isPlainObject(data.guna_milan)) {
		const maximumPoints =
			typeof data.guna_milan.maximum_points === "number"
				? data.guna_milan.maximum_points
				: undefined;
		const totalPoints =
			typeof data.guna_milan.total_points === "number"
				? data.guna_milan.total_points
				: undefined;
		parts.push(
			<div key="guna-milan" className="space-y-4">
				<ScoreSummaryCard maximumPoints={maximumPoints} totalPoints={totalPoints} />
				{Array.isArray(data.guna_milan.guna) ? (
					<GunaBreakdownTable guna={data.guna_milan.guna} />
				) : null}
			</div>
		);
		consumed.add("guna_milan");
	}

	if (
		typeof data.maximum_points === "number" ||
		typeof data.obtained_points === "number" ||
		typeof data.total_points === "number"
	) {
		parts.push(
			<ScoreSummaryCard
				key="compatibility-score"
				maximumPoints={
					typeof data.maximum_points === "number" ? data.maximum_points : undefined
				}
				obtainedPoints={
					typeof data.obtained_points === "number" ? data.obtained_points : undefined
				}
				totalPoints={typeof data.total_points === "number" ? data.total_points : undefined}
			/>
		);
		consumed.add("maximum_points");
		consumed.add("obtained_points");
		consumed.add("total_points");
	}

	if (Array.isArray(data.matches) && data.matches.length > 0) {
		parts.push(<CompatibilityMatchesTable key="compatibility-matches" matches={data.matches} />);
		consumed.add("matches");
	}

	if (isPlainObject(data.girl_mangal_dosha_details)) {
		parts.push(<MangalDoshaCard key="girl-mangal" raw={data.girl_mangal_dosha_details} />);
		consumed.add("girl_mangal_dosha_details");
	}
	if (isPlainObject(data.boy_mangal_dosha_details)) {
		parts.push(<MangalDoshaCard key="boy-mangal" raw={data.boy_mangal_dosha_details} />);
		consumed.add("boy_mangal_dosha_details");
	}

	if (Array.isArray(data.exceptions) && data.exceptions.length > 0) {
		parts.push(
			<div key="mangal-exceptions" className="rounded-lg border border-border/80 bg-muted/20 p-4">
				<h4 className="text-base font-semibold text-foreground">Exceptions</h4>
				<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
					{data.exceptions.map((item, idx) => (
						<li key={idx}>{formatScalar(item)}</li>
					))}
				</ul>
			</div>
		);
		consumed.add("exceptions");
	}

	if (isPlainObject(data.girl_papasamyam) && isPlainObject(data.boy_papasamyam)) {
		parts.push(
			<PapasamyamComparisonCard
				key="papasamyam-comparison"
				girl={data.girl_papasamyam}
				boy={data.boy_papasamyam}
			/>
		);
		consumed.add("girl_papasamyam");
		consumed.add("boy_papasamyam");
	}

	if (data.nakshatra_details != null && isPlainObject(data.nakshatra_details)) {
		parts.push(<NakshatraSections key="nak" block={data.nakshatra_details} />);
		consumed.add("nakshatra_details");
	} else if (
		isPlainObject(data.nakshatra) &&
		isPlainObject(data.chandra_rasi) &&
		!("nakshatra_details" in data)
	) {
		parts.push(<NakshatraSections key="nak" block={data} />);
		consumed.add("nakshatra");
		consumed.add("chandra_rasi");
		consumed.add("soorya_rasi");
		consumed.add("zodiac");
		consumed.add("additional_info");
	}

	if (Array.isArray(data.yoga_details)) {
		consumed.add("yoga_details");
		if (data.yoga_details.length > 0) {
			parts.push(<YogaDetailsSection key="yoga" yogas={data.yoga_details} />);
		}
	}

	if (data.mangal_dosha != null && isPlainObject(data.mangal_dosha)) {
		parts.push(<MangalDoshaCard key="mangal" raw={data.mangal_dosha} />);
		consumed.add("mangal_dosha");
	}

	if (data.dasha_balance != null && isPlainObject(data.dasha_balance)) {
		parts.push(<DashaBalanceCard key="dasha-bal" raw={data.dasha_balance} />);
		consumed.add("dasha_balance");
	}

	if (Array.isArray(data.dasha_periods) && data.dasha_periods.length > 0) {
		parts.push(<DashaPeriodsTable key="dasha-per" periods={data.dasha_periods} />);
		consumed.add("dasha_periods");
	}

	const rest: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(data)) {
		if (!consumed.has(k)) {
			rest[k] = v;
		}
	}

	if (Object.keys(rest).length > 0) {
		parts.push(
			<div key="rest" className="min-w-0 space-y-2 pt-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Additional data
				</p>
				<HoroscopeJsonFallback value={rest} depth={0} />
			</div>
		);
	}

	if (parts.length === 0) {
		return <HoroscopeJsonFallback value={data} depth={0} />;
	}

	return <div className="min-w-0 space-y-8">{parts}</div>;
}

export function HoroscopeApiResultDisplay({
	data,
	className,
}: {
	data: unknown;
	className?: string;
}) {
	if (data === null || data === undefined) {
		return <p className={cn("text-sm text-muted-foreground", className)}>No data.</p>;
	}

	if (isPlainObject(data) && "status" in data && "data" in data) {
		const status = data.status;
		const inner = data.data;
		const creditsTop =
			typeof (data as { credits_used?: unknown }).credits_used === "number"
				? ((data as { credits_used: number }).credits_used as number)
				: undefined;

		if (typeof status === "string" && isPlainObject(inner)) {
			return (
				<div className={cn("min-w-0 space-y-6", className)}>
					<div className="flex flex-wrap items-center gap-3">
						<StatusBadge status={status} />
						{creditsTop !== undefined ? <CreditsBadge n={creditsTop} /> : null}
					</div>
					{renderStructuredData(inner)}
				</div>
			);
		}
	}

	if (isPlainObject(data)) {
		return <div className={cn("min-w-0 space-y-6", className)}>{renderStructuredData(data)}</div>;
	}

	return (
		<div className={cn("min-w-0", className)}>
			<HoroscopeJsonFallback value={data} depth={0} />
		</div>
	);
}
