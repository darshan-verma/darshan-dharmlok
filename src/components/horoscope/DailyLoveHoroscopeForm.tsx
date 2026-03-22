"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DailyLoveHoroscopeResultDisplay } from "@/components/horoscope/DailyLoveHoroscopeResultDisplay";
import { ZODIAC_OPTIONS, ZODIAC_SIGN_VALUES } from "@/data/horoscope-daily";
import {
	dateInputToIsoDatetime,
	getTodayYyyyMmDd,
} from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import type { ProkeralaDailyLoveCompatibilityResponse } from "@/types/prokerala";

const schema = z.object({
	sign_one: z.enum(ZODIAC_SIGN_VALUES),
	sign_two: z.enum(ZODIAC_SIGN_VALUES),
});

type FormValues = z.infer<typeof schema>;

export function DailyLoveHoroscopeForm({ className }: { className?: string }) {
	const [result, setResult] =
		useState<ProkeralaDailyLoveCompatibilityResponse | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [lastSubmitted, setLastSubmitted] = useState<FormValues | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			sign_one: "aries",
			sign_two: "taurus",
		},
	});

	async function onSubmit(values: FormValues) {
		setFetchError(null);
		setResult(null);
		setLastSubmitted(values);

		const datetime = dateInputToIsoDatetime(getTodayYyyyMmDd());
		const params = new URLSearchParams({
			datetime,
			sign_one: values.sign_one,
			sign_two: values.sign_two,
		});

		const url = `/api/prokerala/horoscope/daily/love-compatibility?${params.toString()}`;

		setLoading(true);
		try {
			const res = await fetch(url);
			const json = (await res.json()) as {
				ok?: boolean;
				error?: string;
				details?: string;
			};
			if (!res.ok) {
				setFetchError(
					typeof json.error === "string"
						? json.details
							? `${json.error}: ${json.details}`
							: json.error
						: `Request failed (${res.status})`
				);
				return;
			}
			if (json && typeof json === "object" && json.ok === false) {
				setFetchError(
					typeof json.error === "string"
						? json.details
							? `${json.error}: ${json.details}`
							: json.error
						: "Request failed"
				);
				return;
			}
			setResult(json as ProkeralaDailyLoveCompatibilityResponse);
		} catch (e) {
			setFetchError(e instanceof Error ? e.message : "Network error");
		} finally {
			setLoading(false);
		}
	}

	const rowClass =
		"grid gap-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-4";

	return (
		<div className={cn("mx-auto w-full max-w-5xl", className)}>
			<div className="overflow-hidden rounded-xl border border-orange-200/90 bg-white shadow-md dark:border-orange-900/45 dark:bg-card">
				<div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-4 py-4 text-center">
					<h2 className="font-light tracking-wide text-white text-xl md:text-2xl">
						Daily Love Horoscope
					</h2>
					<p className="mt-1 text-sm text-white/90">
						Today&apos;s romantic outlook for you and your partner&apos;s signs
					</p>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-5 p-6 md:p-8"
					>
						<FormField
							control={form.control}
							name="sign_one"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Your sign
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md">
													<SelectValue placeholder="Select your sign" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ZODIAC_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="sign_two"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Partner&apos;s zodiac sign
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md">
													<SelectValue placeholder="Select partner sign" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ZODIAC_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<div className="flex flex-wrap items-center gap-3 pt-2">
							<Button
								type="submit"
								disabled={loading}
								className="bg-orange-600 hover:bg-orange-700"
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Fetching…
									</>
								) : (
									"Get love horoscope"
								)}
							</Button>
						</div>
					</form>
				</Form>

				{fetchError && (
					<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4">
						<p className="text-sm text-destructive">{fetchError}</p>
					</div>
				)}

				{lastSubmitted && result && !fetchError && (
					<div className="border-t border-orange-100 px-6 py-8 dark:border-orange-900/45">
						<DailyLoveHoroscopeResultDisplay
							response={result}
							signOne={lastSubmitted.sign_one}
							signTwo={lastSubmitted.sign_two}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
