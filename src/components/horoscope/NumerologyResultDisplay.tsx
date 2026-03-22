"use client";

import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function titleCaseKey(key: string): string {
	return key
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isNumerologySingleNumber(
	v: unknown
): v is { name: string; number: number; description: string } {
	if (!isPlainObject(v)) return false;
	return (
		typeof v.name === "string" &&
		typeof v.number === "number" &&
		typeof v.description === "string"
	);
}

function isNameChart(v: unknown): v is {
	first_name: { character: string; number: number }[];
	middle_name: { character: string; number: number }[];
	last_name: { character: string; number: number }[];
} {
	if (!isPlainObject(v)) return false;
	return (
		Array.isArray(v.first_name) &&
		Array.isArray(v.middle_name) &&
		Array.isArray(v.last_name)
	);
}

function ChartColumn({
	label,
	entries,
}: {
	label: string;
	entries: { character: string; number: number }[];
}) {
	return (
		<div className="min-w-0">
			<p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{entries.length === 0 ? (
					<span className="text-sm text-muted-foreground">—</span>
				) : (
					entries.map((e, i) => (
						<span
							key={`${e.character}-${i}`}
							className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50/90 px-2 py-1 text-xs dark:border-orange-800 dark:bg-orange-950/40"
						>
							<span className="font-medium">{e.character}</span>
							<span className="text-muted-foreground">{e.number}</span>
						</span>
					))
				)}
			</div>
		</div>
	);
}

function SingleNumberHero({
	n,
	className,
}: {
	n: { name: string; number: number; description: string };
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-orange-200/90 bg-gradient-to-br from-orange-50 to-amber-50/40 p-6 text-center dark:border-orange-900/55 dark:from-orange-950/45 dark:to-amber-950/25",
				className
			)}
		>
			<p className="text-sm font-medium text-orange-900 dark:text-orange-100">
				{n.name}
			</p>
			<p className="mt-3 font-serif text-5xl font-bold tabular-nums text-orange-950 dark:text-orange-50">
				{n.number}
			</p>
			<p className="mt-4 text-left text-sm leading-relaxed text-muted-foreground">
				{n.description}
			</p>
		</div>
	);
}

function renderValue(value: unknown, depth: number): ReactNode {
	if (value === null || value === undefined) {
		return <span className="text-muted-foreground">—</span>;
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return <span className="break-words">{String(value)}</span>;
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-muted-foreground">Empty</span>;
		}
		return (
			<ul className="ml-4 list-disc space-y-2 text-sm">
				{value.map((item, i) => (
					<li key={i} className="break-words">
						{renderValue(item, depth + 1)}
					</li>
				))}
			</ul>
		);
	}
	if (isPlainObject(value)) {
		if (isNumerologySingleNumber(value)) {
			return <SingleNumberHero n={value} />;
		}
		return (
			<dl className="grid gap-3 text-sm">
				{Object.entries(value).map(([k, v]) => (
					<div
						key={k}
						className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
					>
						<dt className="text-xs font-medium uppercase text-muted-foreground">
							{titleCaseKey(k)}
						</dt>
						<dd className="mt-1">{renderValue(v, depth + 1)}</dd>
					</div>
				))}
			</dl>
		);
	}
	return <span className="text-muted-foreground">Unsupported</span>;
}

function renderDataPayload(data: Record<string, unknown>) {
	const nameChart = data.name_chart;
	const rest = { ...data };
	delete rest.name_chart;

	return (
		<div className="space-y-8">
			{Object.entries(rest).map(([key, value]) => (
				<section key={key}>
					<h3 className="mb-3 font-serif text-lg font-semibold text-foreground">
						{titleCaseKey(key)}
					</h3>
					{isNumerologySingleNumber(value) ? (
						<SingleNumberHero n={value} />
					) : (
						<div className="text-sm">{renderValue(value, 0)}</div>
					)}
				</section>
			))}

			{nameChart !== undefined && isNameChart(nameChart) ? (
				<section>
					<h3 className="mb-3 font-serif text-lg font-semibold text-foreground">
						Name chart
					</h3>
					<div className="grid gap-6 sm:grid-cols-3">
						<ChartColumn label="First name" entries={nameChart.first_name} />
						<ChartColumn label="Middle name" entries={nameChart.middle_name} />
						<ChartColumn label="Last name" entries={nameChart.last_name} />
					</div>
				</section>
			) : null}
		</div>
	);
}

type Props = {
	payload: unknown;
	className?: string;
};

export function NumerologyResultDisplay({ payload, className }: Props) {
	if (payload === null || payload === undefined) {
		return null;
	}

	const obj = payload as Record<string, unknown>;
	const status = obj.status;
	const data = obj.data;

	if (status === "ok" && isPlainObject(data)) {
		return (
			<Card
				className={cn(
					"w-full overflow-hidden border-orange-200/90 shadow-md dark:border-orange-900/50",
					className
				)}
			>
				<CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/60 dark:border-orange-900/40 dark:from-orange-950/35 dark:to-amber-950/20">
					<CardTitle className="font-serif text-xl text-orange-950 dark:text-orange-50">
						Your result
					</CardTitle>
					<CardDescription>
						Readings are computed by the ProKerala numerology API.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-6">{renderDataPayload(data)}</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className={cn(
				"w-full border-orange-200/80 shadow-md dark:border-orange-900/45",
				className
			)}
		>
			<CardHeader className="border-b border-orange-100/80 bg-orange-50/40 dark:border-orange-900/35 dark:bg-orange-950/25">
				<CardTitle className="font-serif text-lg text-orange-950 dark:text-orange-50">
					Response
				</CardTitle>
				<CardDescription>
					Unexpected shape — raw JSON is shown below.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed">
					{JSON.stringify(payload, null, 2)}
				</pre>
			</CardContent>
		</Card>
	);
}
