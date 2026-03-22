"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function titleCaseKey(key: string): string {
	return key
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function formatScalar(v: unknown): string {
	if (v === null || v === undefined) return "—";
	if (typeof v === "string") return v;
	if (typeof v === "number" || typeof v === "boolean") return String(v);
	return JSON.stringify(v);
}

/** Shorten ISO-8601 for table cells (readable, still copy-friendly). */
function formatCompactIso(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	try {
		return new Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(d);
	} catch {
		return iso;
	}
}

const COLUMN_PRIORITY = [
	"id",
	"name",
	"type",
	"vela",
	"is_day",
	"start",
	"end",
] as const;

function sortColumnKeys(keys: string[]): string[] {
	const set = new Set(keys);
	const ordered = COLUMN_PRIORITY.filter((k) => set.has(k));
	const rest = keys
		.filter((k) => !(COLUMN_PRIORITY as readonly string[]).includes(k))
		.sort();
	return [...ordered, ...rest];
}

function isPeriodSpan(
	v: unknown
): v is { start: string; end: string } {
	if (!isPlainObject(v)) return false;
	return typeof v.start === "string" && typeof v.end === "string";
}

function renderPeriodCell(value: unknown): ReactNode {
	if (!Array.isArray(value) || value.length === 0) {
		return <span className="text-muted-foreground">—</span>;
	}
	if (value.every(isPeriodSpan)) {
		return (
			<div className="flex min-w-[12rem] max-w-md flex-col gap-1.5">
				{value.map((p, i) => (
					<div
						key={i}
						className="rounded-md border border-violet-200/80 bg-violet-50/50 px-2 py-1.5 text-xs leading-snug dark:border-violet-800/60 dark:bg-violet-950/30"
					>
						<span className="text-muted-foreground">Start </span>
						<span className="font-medium">{formatCompactIso(p.start)}</span>
						<br />
						<span className="text-muted-foreground">End </span>
						<span className="font-medium">{formatCompactIso(p.end)}</span>
					</div>
				))}
			</div>
		);
	}
	return null;
}

function PanchangCellContent({
	value,
	depth,
	keyName,
	variant,
}: {
	value: unknown;
	depth: number;
	keyName: string;
	variant: "default" | "panchang";
}): ReactNode {
	if (variant === "panchang") {
		if (keyName === "period" || keyName === "periods") {
			const periodBlock = renderPeriodCell(value);
			if (periodBlock) return periodBlock;
		}
		if (
			(keyName === "start" || keyName === "end") &&
			typeof value === "string"
		) {
			return (
				<span className="whitespace-nowrap text-sm tabular-nums">
					{formatCompactIso(value)}
				</span>
			);
		}
		if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
			return (
				<span className="text-sm tabular-nums">{formatCompactIso(value)}</span>
			);
		}
	}
	return <JsonValue value={value} depth={depth} variant={variant} />;
}

function JsonValue({
	value,
	depth,
	variant,
}: {
	value: unknown;
	depth: number;
	variant: "default" | "panchang";
}) {
	if (value === null || value === undefined) {
		return <span className="text-muted-foreground">—</span>;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return <span className="break-words text-sm">{formatScalar(value)}</span>;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-sm text-muted-foreground">Empty list</span>;
		}
		if (value.every(isPlainObject) && value.length > 0 && depth < 4) {
			const keys = sortColumnKeys(
				Array.from(new Set(value.flatMap((row) => Object.keys(row))))
			);

			const tableWrap = variant === "panchang" ? "max-w-full" : "";
			const tableClass =
				variant === "panchang"
					? "w-max min-w-full border-collapse text-left text-sm"
					: "w-full min-w-[280px] text-left text-sm";

			const thClass =
				variant === "panchang"
					? "sticky top-0 z-[1] whitespace-nowrap border-b border-violet-200/90 bg-violet-100/95 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-violet-950/90 backdrop-blur-sm dark:border-violet-800/80 dark:bg-violet-950/90 dark:text-violet-100"
					: "px-3 py-2 font-medium text-muted-foreground";

			const tdClass =
				variant === "panchang"
					? "border-b border-border/40 px-3 py-2.5 align-top text-sm last:border-b-0"
					: "px-3 py-2 align-top";

			const colWidthHint = (k: string) => {
				if (variant !== "panchang") return undefined;
				if (k === "period" || k === "name") return "min-w-[10rem] max-w-[min(28rem,85vw)]";
				if (k === "start" || k === "end") return "min-w-[9rem] whitespace-nowrap";
				if (k === "type" || k === "id") return "min-w-[5rem]";
				return "min-w-[8rem] max-w-[min(20rem,50vw)]";
			};

			return (
				<div
					className={cn(
						"rounded-lg border border-violet-200/80 shadow-sm dark:border-violet-900/50",
						variant === "panchang" && "overflow-hidden",
						tableWrap
					)}
				>
					<div
						className={cn(
							"overflow-x-auto",
							variant === "panchang" && "overscroll-x-contain [-webkit-overflow-scrolling:touch]"
						)}
					>
						<table className={tableClass}>
							<thead>
								<tr
									className={
										variant === "default"
											? "border-b border-violet-200/80 bg-violet-50/80 dark:border-violet-900/50 dark:bg-violet-950/40"
											: ""
									}
								>
									{keys.map((k) => (
										<th key={k} className={cn(thClass, colWidthHint(k))}>
											{titleCaseKey(k)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{value.map((row, i) => (
									<tr
										key={i}
										className={cn(
											variant === "panchang" &&
												"odd:bg-muted/20 hover:bg-muted/40 dark:odd:bg-muted/10"
										)}
									>
										{keys.map((k) => (
											<td key={k} className={cn(tdClass, colWidthHint(k))}>
												<PanchangCellContent
													value={row[k]}
													depth={depth + 1}
													keyName={k}
													variant={variant}
												/>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			);
		}

		return (
			<ul className="list-inside list-disc space-y-2 text-sm">
				{value.map((item, i) => (
					<li key={i}>
						<JsonValue value={item} depth={depth + 1} variant={variant} />
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
			<dl
				className={cn(
					"space-y-2 text-sm",
					depth > 0 && "rounded-md border border-border/60 bg-muted/30 p-3",
					variant === "panchang" &&
						depth === 0 &&
						"rounded-lg border border-border/50 bg-card p-4 shadow-sm"
				)}
			>
				{entries.map(([k, v]) => (
					<Fragment key={k}>
						<div
							className={cn(
								"grid gap-1 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-3",
								variant === "panchang" && "border-b border-border/30 pb-3 last:border-0 last:pb-0"
							)}
						>
							<dt className="font-medium text-muted-foreground">
								{titleCaseKey(k)}
							</dt>
							<dd className="min-w-0">
								<JsonValue value={v} depth={depth + 1} variant={variant} />
							</dd>
						</div>
					</Fragment>
				))}
			</dl>
		);
	}

	return <span className="text-sm">{String(value)}</span>;
}

function ProkeralaRoot({
	data,
	variant,
}: {
	data: Record<string, unknown>;
	variant: "default" | "panchang";
}) {
	const status = data.status;
	const inner = data.data;

	if (variant === "panchang" && typeof status === "string" && "data" in data) {
		return (
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Status
					</span>
					<span
						className={cn(
							"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
							status === "ok"
								? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
								: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
						)}
					>
						{status}
					</span>
				</div>
				<div>
					<p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Data
					</p>
					<JsonValue value={inner} depth={0} variant={variant} />
				</div>
			</div>
		);
	}

	return <JsonValue value={data} depth={0} variant={variant} />;
}

export function DailyPanchangResultDisplay({
	data,
	className,
	variant = "default",
}: {
	data: unknown;
	className?: string;
	/** `panchang`: improved tables and cell formatting for Daily Panchang API responses. `default`: simpler layout (e.g. Calendar). */
	variant?: "default" | "panchang";
}) {
	if (data === null || data === undefined) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>No data.</p>
		);
	}

	if (
		variant === "panchang" &&
		isPlainObject(data) &&
		"data" in data &&
		"status" in data
	) {
		return (
			<div className={cn("space-y-4", className)}>
				<ProkeralaRoot data={data} variant="panchang" />
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			<JsonValue value={data} depth={0} variant={variant} />
		</div>
	);
}
