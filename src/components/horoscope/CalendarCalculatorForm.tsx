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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DailyPanchangResultDisplay } from "@/components/horoscope/DailyPanchangResultDisplay";
import {
	CALENDAR_LANGUAGE_OPTIONS,
	CALENDAR_SYSTEM_OPTIONS,
} from "@/data/daily-panchang";
import { getTodayYyyyMmDd } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import { PROKERALA_CALENDAR_VALUES } from "@/types/prokerala";

const calendarEnum = z.enum(PROKERALA_CALENDAR_VALUES);

const calendarSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
	calendar: calendarEnum,
	language: z.enum(["en", "ta"]),
});

type CalendarFormValues = z.infer<typeof calendarSchema>;

export function CalendarCalculatorForm({
	className,
	title = "Calendar",
}: {
	className?: string;
	title?: string;
}) {
	const [result, setResult] = useState<unknown>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const form = useForm<CalendarFormValues>({
		resolver: zodResolver(calendarSchema),
		defaultValues: {
			date: getTodayYyyyMmDd(),
			calendar: "tamil",
			language: "en",
		},
	});

	async function onSubmit(values: CalendarFormValues) {
		setFetchError(null);
		setResult(null);

		const params = new URLSearchParams({
			date: values.date,
			calendar: values.calendar,
			la: values.language,
		});

		const url = `/api/prokerala/calendar?${params.toString()}`;

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
											/>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="calendar"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Calendar
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40">
													<SelectValue placeholder="Select calendar" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{CALENDAR_SYSTEM_OPTIONS.map((opt) => (
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
												{CALENDAR_LANGUAGE_OPTIONS.map((opt) => (
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

						<div className="flex justify-end pt-2">
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
						<DailyPanchangResultDisplay data={result} />
					</div>
				)}
			</div>
		</div>
	);
}
