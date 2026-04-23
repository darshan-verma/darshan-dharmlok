"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DailyPanchangResultDisplay } from "@/components/horoscope/DailyPanchangResultDisplay";
import {
	AYANAMSA_OPTIONS,
	DAILY_PANCHANG_LANGUAGE_OPTIONS,
	type DailyPanchangLanguageCode,
} from "@/data/daily-panchang";
import {
	dateInputToIsoDatetime,
	getTodayYyyyMmDd,
} from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import type { ProkeralaAyanamsa } from "@/types/prokerala";
import { useHoroscopeCachedValue } from "@/components/horoscope/calculations/shared-ui";
const IS_TESTING_PHASE = process.env.NODE_ENV !== "production";

const languageValues = DAILY_PANCHANG_LANGUAGE_OPTIONS.map((o) => o.value) as [
	DailyPanchangLanguageCode,
	...DailyPanchangLanguageCode[],
];

const standardSchema = z.object({
	ayanamsa: z.union([z.literal(1), z.literal(3), z.literal(5)]),
	date: z.string().min(1, "Pick a date"),
	location: z.string().min(2, "Enter a place name"),
	language: z.enum(languageValues),
});

const panchangSchema = standardSchema.extend({
	resultType: z.enum(["basic", "advanced"]),
});

type StandardValues = z.infer<typeof standardSchema>;
type PanchangValues = z.infer<typeof panchangSchema>;

export type DailyPanchangCalculatorFormProps = {
	title: string;
	slug: string;
	apiPath: string;
	defaultLanguage?: string;
	className?: string;
	initialValues?: Partial<{
		ayanamsa: ProkeralaAyanamsa;
		date: string;
		location: string;
		language: DailyPanchangLanguageCode;
		resultType: "basic" | "advanced";
	}>;
	autoSubmit?: boolean;
};

function getProkeralaRelativePath(
	slug: string,
	apiPath: string,
	resultType: "basic" | "advanced"
): string {
	if (slug === "panchang") {
		return resultType === "advanced" ? "panchang/advanced" : "panchang";
	}
	return apiPath;
}

function defaultLangForForm(
	defaultLanguage?: string
): DailyPanchangLanguageCode {
	if (
		defaultLanguage &&
		languageValues.includes(defaultLanguage as DailyPanchangLanguageCode)
	) {
		return defaultLanguage as DailyPanchangLanguageCode;
	}
	return "en";
}

function normalizeTestingJanFirst(date: string): string {
	if (!IS_TESTING_PHASE) return date;
	const [year] = date.split("-");
	if (!year || year.length !== 4) return date;
	return `${year}-01-01`;
}

export function DailyPanchangCalculatorForm({
	title,
	slug,
	apiPath,
	defaultLanguage,
	className,
	initialValues,
	autoSubmit = false,
}: DailyPanchangCalculatorFormProps) {
	const { value: result, setValue: setResult, clearValue: clearResult } =
		useHoroscopeCachedValue<unknown>(`daily-panchang:${slug}`);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const showResultType = slug === "panchang";

	const initialDefaults = useMemo(
		() => ({
			ayanamsa: initialValues?.ayanamsa ?? (1 as ProkeralaAyanamsa),
			date: normalizeTestingJanFirst(
				initialValues?.date ?? getTodayYyyyMmDd()
			),
			location: initialValues?.location ?? "",
			language:
				initialValues?.language ?? defaultLangForForm(defaultLanguage),
			resultType: initialValues?.resultType ?? ("basic" as const),
		}),
		[defaultLanguage, initialValues]
	);

	const form = useForm<StandardValues | PanchangValues>({
		resolver: zodResolver(showResultType ? panchangSchema : standardSchema),
		defaultValues: showResultType
			? initialDefaults
			: {
					ayanamsa: initialDefaults.ayanamsa,
					date: initialDefaults.date,
					location: initialDefaults.location,
					language: initialDefaults.language,
				},
	});

	const [didAutoSubmit, setDidAutoSubmit] = useState(false);

	async function onSubmit(values: StandardValues | PanchangValues) {
		setFetchError(null);
		setResult(null);

		const geoRes = await fetch(
			`/api/geocode?q=${encodeURIComponent(values.location.trim())}`
		);
		const geoJson = (await geoRes.json()) as {
			error?: string;
			lat?: number;
			lng?: number;
		};
		if (!geoRes.ok) {
			setFetchError(
				geoJson.error ?? "Could not find that place. Try a different spelling."
			);
			return;
		}
		if (geoJson.lat == null || geoJson.lng == null) {
			setFetchError("Could not resolve coordinates for that location.");
			return;
		}

		const coordinates = `${geoJson.lat},${geoJson.lng}`;
		const normalizedDate = normalizeTestingJanFirst(values.date);
		if (IS_TESTING_PHASE && normalizedDate !== values.date) {
			form.setValue("date", normalizedDate);
		}
		const datetime = dateInputToIsoDatetime(normalizedDate);
		const resultType =
			showResultType && "resultType" in values
				? values.resultType
				: "basic";
		const relative = getProkeralaRelativePath(slug, apiPath, resultType);
		const params = new URLSearchParams({
			ayanamsa: String(values.ayanamsa),
			coordinates,
			datetime,
			la: values.language,
		});

		const url = `/api/prokerala/${relative}?${params.toString()}`;

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
			setResult(json);
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
		<div className={cn("mx-auto w-full max-w-2xl", className)}>
			<div className="overflow-hidden rounded-xl border border-orange-200/90 bg-white shadow-md dark:border-orange-900/45 dark:bg-card">
				<div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-4 py-4 text-center">
					<h2 className="font-light tracking-wide text-white text-xl md:text-2xl">
						{title}
					</h2>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-5 px-6 pb-6 pt-2 md:px-8 md:pb-8"
					>
						<FormField
							control={form.control}
							name="ayanamsa"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Ayanamsa
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={(v) => field.onChange(Number(v))}
											value={String(field.value)}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40">
													<SelectValue placeholder="Select" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{AYANAMSA_OPTIONS.map((opt) => (
													<SelectItem
														key={opt.value}
														value={String(opt.value)}
													>
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
							name="date"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Date
									</FormLabel>
									<div className="min-w-0">
										<FormControl>
											<Input
												type="date"
												className="max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40"
												{...field}
												onChange={(event) => {
													field.onChange(
														normalizeTestingJanFirst(event.target.value)
													);
												}}
											/>
										</FormControl>
										{IS_TESTING_PHASE ? (
											<p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
												Testing mode: only 01/01 is supported by Prokerala
												sandbox.
											</p>
										) : null}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Location
									</FormLabel>
									<div className="min-w-0">
										<FormControl>
											<Input
												placeholder="Enter Location"
												className="max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="language"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Language
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40">
													<SelectValue placeholder="Language" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{DAILY_PANCHANG_LANGUAGE_OPTIONS.map((opt) => (
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

						{showResultType && (
							<FormField
								control={form.control}
								name="resultType"
								render={({ field }) => (
									<FormItem className={rowClass}>
										<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
											Result Type
										</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												value={field.value}
												className="flex flex-wrap gap-6"
											>
												<div className="flex items-center gap-2">
													<RadioGroupItem value="basic" id="rt-basic" />
													<Label htmlFor="rt-basic" className="font-normal">
														Basic
													</Label>
												</div>
												<div className="flex items-center gap-2">
													<RadioGroupItem value="advanced" id="rt-adv" />
													<Label htmlFor="rt-adv" className="font-normal">
														Advanced
													</Label>
												</div>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<div className="flex justify-end pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									clearResult();
									setFetchError(null);
								}}
								disabled={loading || result == null}
								className="mr-3 min-w-[140px]"
							>
								Refresh form
							</Button>
							<Button
								type="submit"
								disabled={loading}
								className="min-w-[140px] bg-orange-500 font-semibold text-white shadow-sm hover:bg-orange-600"
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Loading…
									</>
								) : (
									"Get result"
								)}
							</Button>
						</div>
					</form>
				</Form>

				{fetchError && (
					<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4 md:px-8">
						<p className="text-sm text-destructive">{fetchError}</p>
					</div>
				)}

				{result != null && !fetchError && (
					<div className="border-t border-orange-100 px-6 py-8 dark:border-orange-900/45 md:px-8">
						<h3 className="mb-4 font-medium text-foreground">Result</h3>
						<DailyPanchangResultDisplay data={result} variant="panchang" />
					</div>
				)}
			</div>
		</div>
	);
}
