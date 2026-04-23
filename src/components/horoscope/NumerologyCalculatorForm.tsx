"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { NumerologyResultDisplay } from "@/components/horoscope/NumerologyResultDisplay";
import {
	type NumerologyCalculatorDef,
	type NumerologySystem,
	findCalculator,
	getCalculatorsForSystem,
} from "@/data/numerology-calculators";
import { dateInputToIsoDatetime } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import { useHoroscopeCachedValue } from "@/components/horoscope/calculations/shared-ui";

const baseSchema = z.object({
	system: z.enum(["pythagorean", "chaldean"]),
	calculatorId: z.string().min(1, "Select a calculator"),
	firstName: z.string(),
	middleName: z.string(),
	lastName: z.string(),
	dateOfBirth: z.string(),
	referenceYear: z.string(),
	additionalVowel: z.boolean(),
});

type FormValues = z.infer<typeof baseSchema>;

function buildDynamicSchema() {
	return baseSchema.superRefine((data, ctx) => {
		const calc = findCalculator(data.system as NumerologySystem, data.calculatorId);
		if (!calc) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid calculator",
				path: ["calculatorId"],
			});
			return;
		}
		if (calc.requiresNames) {
			if (!data.firstName?.trim()) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "First name is required",
					path: ["firstName"],
				});
			}
			if (!data.lastName?.trim()) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Last name is required",
					path: ["lastName"],
				});
			}
		}
		if (calc.requiresDatetime) {
			if (!data.dateOfBirth?.trim()) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Date of birth is required",
					path: ["dateOfBirth"],
				});
			} else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth.trim())) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Use a valid date",
					path: ["dateOfBirth"],
				});
			}
		}
		if (calc.requiresReferenceYear) {
			const y = Number.parseInt(data.referenceYear?.trim() ?? "", 10);
			if (!Number.isInteger(y) || y < 1900 || y > 2100) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Reference year must be between 1900 and 2100",
					path: ["referenceYear"],
				});
			}
		}
	});
}

function buildQuery(
	calc: NumerologyCalculatorDef,
	values: FormValues
): string {
	const params = new URLSearchParams();

	if (calc.requiresNames) {
		params.set("first_name", values.firstName.trim());
		params.set("last_name", values.lastName.trim());
		if (values.middleName.trim()) {
			params.set("middle_name", values.middleName.trim());
		}
	}
	if (calc.requiresDatetime) {
		params.set("datetime", dateInputToIsoDatetime(values.dateOfBirth.trim()));
	}
	if (calc.requiresReferenceYear) {
		params.set("reference_year", values.referenceYear.trim());
	}
	if (calc.supportsAdditionalVowel) {
		params.set("additional_vowel", values.additionalVowel ? "true" : "false");
	}

	return params.toString();
}

export function NumerologyCalculatorForm({ className }: { className?: string }) {
	const { value: result, setValue: setResult, clearValue: clearResult } =
		useHoroscopeCachedValue<unknown>("numerology-calculator:result");
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const dynamicSchema = useMemo(() => buildDynamicSchema(), []);

	const defaultSystem: NumerologySystem = "pythagorean";
	const firstPythagoreanId = getCalculatorsForSystem("pythagorean")[0]?.id ?? "";

	const form = useForm<FormValues>({
		resolver: zodResolver(dynamicSchema),
		defaultValues: {
			system: defaultSystem,
			calculatorId: firstPythagoreanId,
			firstName: "",
			middleName: "",
			lastName: "",
			dateOfBirth: "",
			referenceYear: String(new Date().getFullYear()),
			additionalVowel: false,
		},
	});

	const system = form.watch("system");
	const calculatorId = form.watch("calculatorId");

	const calculators = useMemo(() => getCalculatorsForSystem(system), [system]);

	const activeCalc = findCalculator(system, calculatorId);

	useEffect(() => {
		const list = getCalculatorsForSystem(system);
		const first = list[0]?.id;
		if (!first) return;
		const current = form.getValues("calculatorId");
		const stillValid = list.some((c) => c.id === current);
		if (!stillValid) {
			form.setValue("calculatorId", first);
		}
	}, [system, form]);

	async function onSubmit(values: FormValues) {
		setFetchError(null);
		setResult(null);
		const calc = findCalculator(values.system as NumerologySystem, values.calculatorId);
		if (!calc) {
			setFetchError("Invalid calculator selection.");
			return;
		}

		const qs = buildQuery(calc, values);
		const url = `/api/prokerala/numerology/${calc.apiPathSegment}${qs ? `?${qs}` : ""}`;

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

	const unusedHint = (used: boolean) =>
		!used ? (
			<FormDescription className="text-xs">
				Optional for this calculator
			</FormDescription>
		) : null;

	return (
		<div className={cn("mx-auto w-full max-w-5xl", className)}>
			<div className="overflow-hidden rounded-xl border border-orange-200/90 bg-white shadow-md dark:border-orange-900/45 dark:bg-card">
				<div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-4 py-4 text-center">
					<h2 className="font-light tracking-wide text-white text-xl md:text-2xl">
						Numerology Calculator
					</h2>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-5 p-6 md:p-8"
					>
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										First Name
									</FormLabel>
									<div>
										<FormControl>
											<Input
												placeholder="Enter First Name"
												autoComplete="given-name"
												className="bg-background"
												{...field}
											/>
										</FormControl>
										{unusedHint(!!activeCalc?.requiresNames)}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="middleName"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Middle Name
									</FormLabel>
									<div>
										<FormControl>
											<Input
												placeholder="Enter Middle Name"
												autoComplete="additional-name"
												className="bg-background"
												{...field}
											/>
										</FormControl>
										{unusedHint(!!activeCalc?.requiresNames)}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Last Name
									</FormLabel>
									<div>
										<FormControl>
											<Input
												placeholder="Enter Last Name"
												autoComplete="family-name"
												className="bg-background"
												{...field}
											/>
										</FormControl>
										{unusedHint(!!activeCalc?.requiresNames)}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="dateOfBirth"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Date of Birth
									</FormLabel>
									<div>
										<FormControl>
											<Input type="date" className="bg-background" {...field} />
										</FormControl>
										{unusedHint(!!activeCalc?.requiresDatetime)}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="additionalVowel"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<span className="hidden sm:block" aria-hidden />
									<div className="flex flex-row items-start gap-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={(v) => field.onChange(v === true)}
											/>
										</FormControl>
										<div className="min-w-0 space-y-1 leading-snug">
											<FormLabel className="font-normal text-sm cursor-pointer">
												Use additional vowel &apos;yw&apos; in calculation
											</FormLabel>
											{unusedHint(!!activeCalc?.supportsAdditionalVowel)}
											<FormMessage />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="referenceYear"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Reference Year
									</FormLabel>
									<div>
										<FormControl>
											<Input
												type="number"
												min={1900}
												max={2100}
												placeholder="e.g. 2022"
												className="bg-background"
												{...field}
											/>
										</FormControl>
										{unusedHint(!!activeCalc?.requiresReferenceYear)}
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="system"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										System
									</FormLabel>
									<div>
										<FormControl>
											<RadioGroup
												onValueChange={(v) =>
													field.onChange(v as NumerologySystem)
												}
												value={field.value}
												className="flex flex-wrap gap-4"
											>
												<div className="flex items-center gap-2">
													<RadioGroupItem value="pythagorean" id="sys-pyth" />
													<Label htmlFor="sys-pyth" className="font-normal">
														Pythagorean
													</Label>
												</div>
												<div className="flex items-center gap-2">
													<RadioGroupItem value="chaldean" id="sys-chal" />
													<Label htmlFor="sys-chal" className="font-normal">
														Chaldean
													</Label>
												</div>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="calculatorId"
							render={({ field }) => (
								<FormItem className={rowClass}>
									<FormLabel className="text-muted-foreground sm:text-right sm:pr-2">
										Calculator
									</FormLabel>
									<div className="min-w-0">
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full min-w-0 bg-background focus-visible:ring-orange-500/40">
													<SelectValue placeholder="Select calculator" />
												</SelectTrigger>
											</FormControl>
											<SelectContent position="popper" className="max-h-72">
												{calculators.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.label}
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
										Loading
									</>
								) : (
									"GET RESULT"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</div>

			{(fetchError || result !== null) && (
				<div className="mt-8 w-full">
					{fetchError ? (
						<div
							className={cn(
								"rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive shadow-sm"
							)}
						>
							<p className="font-semibold">Something went wrong</p>
							<p className="mt-2 leading-relaxed">{fetchError}</p>
						</div>
					) : (
						<NumerologyResultDisplay payload={result} />
					)}
				</div>
			)}
		</div>
	);
}
