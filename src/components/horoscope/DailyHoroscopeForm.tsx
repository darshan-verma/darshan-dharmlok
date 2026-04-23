"use client";

import { useEffect, useState } from "react";
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
import { DailyHoroscopeResultDisplay } from "@/components/horoscope/DailyHoroscopeResultDisplay";
import {
	HOROSCOPE_TYPE_OPTIONS,
	HOROSCOPE_TYPE_VALUES,
	ZODIAC_OPTIONS,
	ZODIAC_SIGN_VALUES,
} from "@/data/horoscope-daily";
import {
	dateInputToIsoDatetime,
	getTodayYyyyMmDd,
} from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import type { ProkeralaAdvancedDailyPredictionResponse } from "@/types/prokerala";
import { useHoroscopeCachedValue } from "@/components/horoscope/calculations/shared-ui";

const schema = z.object({
	sign: z.enum(ZODIAC_SIGN_VALUES),
	type: z.enum(HOROSCOPE_TYPE_VALUES),
});

type FormValues = z.infer<typeof schema>;

export function DailyHoroscopeForm({
	className,
	initialValues,
	autoSubmit = false,
}: {
	className?: string;
	initialValues?: Partial<FormValues>;
	autoSubmit?: boolean;
}) {
	const { value: result, setValue: setResult, clearValue: clearResult } =
		useHoroscopeCachedValue<ProkeralaAdvancedDailyPredictionResponse>(
			"daily-horoscope:result",
		);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const {
		value: lastSubmitted,
		setValue: setLastSubmitted,
		clearValue: clearLastSubmitted,
	} = useHoroscopeCachedValue<FormValues>("daily-horoscope:last-submitted");

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			sign: initialValues?.sign ?? "aries",
			type: initialValues?.type ?? "general",
		},
	});

	const [didAutoSubmit, setDidAutoSubmit] = useState(false);

	async function onSubmit(values: FormValues) {
		setFetchError(null);
		setResult(null);
		setLastSubmitted(values);

		const datetime = dateInputToIsoDatetime(getTodayYyyyMmDd());
		const params = new URLSearchParams({
			datetime,
			sign: values.sign,
			type: values.type,
		});

		const url = `/api/prokerala/horoscope/daily/advanced?${params.toString()}`;

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
			setResult(json as ProkeralaAdvancedDailyPredictionResponse);
		} catch (e) {
			setFetchError(e instanceof Error ? e.message : "Network error");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (!autoSubmit || didAutoSubmit) return;
		setDidAutoSubmit(true);
		void form.handleSubmit(onSubmit)();
	}, [autoSubmit, didAutoSubmit, form, onSubmit]);

	const rowClass =
		"grid gap-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-4";

	return (
		<div className={cn("mx-auto w-full max-w-5xl", className)}>
			<div className="overflow-hidden rounded-xl border border-orange-200/90 bg-white shadow-md dark:border-orange-900/45 dark:bg-card">
				<div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-4 py-4 text-center">
					<h2 className="font-light tracking-wide text-white text-xl md:text-2xl">
						Daily Horoscope
					</h2>
					<p className="mt-1 text-sm text-white/90">
						Today&apos;s reading for your sign and focus area
					</p>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-5 p-6 md:p-8"
					>
						<FormField
							control={form.control}
							name="sign"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Zodiac sign
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md">
													<SelectValue placeholder="Select sign" />
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
							name="type"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Type
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md">
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{HOROSCOPE_TYPE_OPTIONS.map((opt) => (
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
								type="button"
								variant="outline"
								onClick={() => {
									clearResult();
									clearLastSubmitted();
									setFetchError(null);
								}}
								disabled={loading || !result}
							>
								Refresh form
							</Button>
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
									"Get horoscope"
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
						<DailyHoroscopeResultDisplay
							response={result}
							sign={lastSubmitted.sign}
							type={lastSubmitted.type}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
