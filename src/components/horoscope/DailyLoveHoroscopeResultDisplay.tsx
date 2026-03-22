"use client";

import type { ProkeralaDailyLoveCompatibilityResponse } from "@/types/prokerala";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ZodiacSignValue } from "@/data/horoscope-daily";

function normalizeSign(s: string): string {
	return s.trim().toLowerCase();
}

function findLovePrediction(
	predictions:
		| ProkeralaDailyLoveCompatibilityResponse["data"]["daily_love_predictions"]
		| undefined,
	signOne: ZodiacSignValue,
	signTwo: ZodiacSignValue
) {
	if (!predictions?.length) return null;
	const a = normalizeSign(signOne);
	const b = normalizeSign(signTwo);
	return (
		predictions.find((p) => {
			const n1 = normalizeSign(p.sign_one.name);
			const n2 = normalizeSign(p.sign_two.name);
			return (n1 === a && n2 === b) || (n1 === b && n2 === a);
		}) ?? null
	);
}

type Props = {
	response: ProkeralaDailyLoveCompatibilityResponse | null;
	signOne: ZodiacSignValue;
	signTwo: ZodiacSignValue;
	className?: string;
};

export function DailyLoveHoroscopeResultDisplay({
	response,
	signOne,
	signTwo,
	className,
}: Props) {
	const predictions = response?.data?.daily_love_predictions;
	const row = findLovePrediction(predictions, signOne, signTwo);

	if (!row) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				{predictions?.length
					? "No prediction found for this pair."
					: "No prediction data."}
			</p>
		);
	}

	return (
		<Card
			className={cn(
				"overflow-hidden border-orange-200/90 shadow-md dark:border-orange-900/45",
				className
			)}
		>
			<CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/80 dark:border-orange-900/40 dark:from-orange-950/50 dark:to-amber-950/30">
				<CardDescription className="text-xs font-medium uppercase tracking-wide text-orange-800/90 dark:text-orange-300/90">
					Daily love horoscope
				</CardDescription>
				<CardTitle className="font-serif text-2xl text-foreground">
					{row.sign_combination?.trim() ||
						`${row.sign_one.name} & ${row.sign_two.name}`}
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{row.sign_one.name}
					</span>
					{" & "}
					<span className="font-medium text-foreground">
						{row.sign_two.name}
					</span>
				</p>
				{response?.data?.datetime ? (
					<p className="text-xs text-muted-foreground">
						{new Date(response.data.datetime).toLocaleDateString(undefined, {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4 pt-6">
				<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
					{row.prediction}
				</p>
			</CardContent>
		</Card>
	);
}
