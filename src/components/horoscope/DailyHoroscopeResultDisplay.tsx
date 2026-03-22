"use client";

import type {
	HoroscopePredictionItem,
	ProkeralaAdvancedDailyPredictionResponse,
} from "@/types/prokerala";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HoroscopeTypeValue, ZodiacSignValue } from "@/data/horoscope-daily";

function normalizeType(t: string): string {
	return t.trim().toLowerCase();
}

function pickPrediction(
	items: HoroscopePredictionItem[] | undefined,
	type: HoroscopeTypeValue
): HoroscopePredictionItem | null {
	if (!items?.length) return null;
	const want = normalizeType(type);
	const exact = items.find((p) => normalizeType(p.type) === want);
	return exact ?? items[0] ?? null;
}

type Props = {
	response: ProkeralaAdvancedDailyPredictionResponse | null;
	sign: ZodiacSignValue;
	type: HoroscopeTypeValue;
	className?: string;
};

export function DailyHoroscopeResultDisplay({
	response,
	sign,
	type,
	className,
}: Props) {
	if (!response?.data?.daily_predictions?.length) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				No prediction data.
			</p>
		);
	}

	const wantSign = sign.toLowerCase();
	const block = response.data.daily_predictions.find(
		(p) => p.sign?.name?.toLowerCase() === wantSign
	);

	if (!block) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				No prediction found for the selected sign.
			</p>
		);
	}

	const item = pickPrediction(block.predictions, type);
	if (!item) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				No prediction text for this type.
			</p>
		);
	}

	const typeLabel =
		item.type?.trim() ||
		type.charAt(0).toUpperCase() + type.slice(1);

	return (
		<Card
			className={cn(
				"overflow-hidden border-orange-200/90 shadow-md dark:border-orange-900/45",
				className
			)}
		>
			<CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/80 dark:border-orange-900/40 dark:from-orange-950/50 dark:to-amber-950/30">
				<CardDescription className="text-xs font-medium uppercase tracking-wide text-orange-800/90 dark:text-orange-300/90">
					Daily horoscope
				</CardDescription>
				<CardTitle className="font-serif text-2xl text-foreground">
					{block.sign.name}
				</CardTitle>
				{block.sign.lord?.name && (
					<p className="text-sm text-muted-foreground">
						Sign lord:{" "}
						<span className="font-medium text-foreground">
							{block.sign.lord.name}
						</span>
					</p>
				)}
				<p className="text-xs text-muted-foreground">
					{typeLabel}
					{response.data.datetime ? (
						<>
							{" "}
							·{" "}
							{new Date(response.data.datetime).toLocaleDateString(undefined, {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</>
					) : null}
				</p>
			</CardHeader>
			<CardContent className="space-y-4 pt-6">
				<div>
					<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
						{item.prediction}
					</p>
				</div>
				{(item.seek || item.challenge || item.insight) && (
					<div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-1">
						{item.seek && (
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Seek
								</p>
								<p className="mt-1 text-sm text-foreground">{item.seek}</p>
							</div>
						)}
						{item.challenge && (
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Challenge
								</p>
								<p className="mt-1 text-sm text-foreground">
									{item.challenge}
								</p>
							</div>
						)}
						{item.insight && (
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Insight
								</p>
								<p className="mt-1 text-sm text-foreground">{item.insight}</p>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
