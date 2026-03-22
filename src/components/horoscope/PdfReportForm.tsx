"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ExternalLink, Loader2 } from "lucide-react";

import type { ProkeralaReportChartStyle } from "@/app/api/prokerala/_validation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	COMPAT_PRESET_LABELS,
	COMPAT_PRESET_MODULE_TAGS,
	PERSONAL_PRESET_LABELS,
	PERSONAL_PRESET_MODULE_TAGS,
	buildCompatibilityKeralaPoruthamModules,
	buildCompatibilityKundliMatchingModules,
	buildCompatibilityTamilPoruthamModules,
	buildPersonalFullReportModules,
	buildPersonalMangalDoshaModules,
} from "@/data/pdf-report-presets";
import { datetimeLocalToIsoWithOffset } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import type { ProkeralaReportRequestBody, ProkeralaReportResponse } from "@/types/prokerala";

const chartStyleSchema = z.enum(["north-indian", "south-indian", "east-indian"]);

const genderValues = ["male", "female", "other"] as const;

const personalSchema = z.object({
	firstName: z.string(),
	middleName: z.string(),
	lastName: z.string(),
	gender: z.enum(genderValues),
	chartStyle: chartStyleSchema,
	birthDatetimeLocal: z.string().min(1, "Birth date and time is required"),
	birthPlace: z.string().min(2, "Enter place of birth"),
	reportName: z.string(),
	reportCaption: z.string(),
	preset: z.enum(["mangal", "full"]),
});

const compatSchema = z.object({
	girlFirstName: z.string(),
	girlMiddleName: z.string(),
	girlLastName: z.string(),
	girlBirthDatetimeLocal: z.string().min(1, "Girl: date and time is required"),
	girlBirthPlace: z.string().min(2, "Girl: place of birth"),
	boyFirstName: z.string(),
	boyMiddleName: z.string(),
	boyLastName: z.string(),
	boyBirthDatetimeLocal: z.string().min(1, "Boy: date and time is required"),
	boyBirthPlace: z.string().min(2, "Boy: place of birth"),
	reportName: z.string(),
	reportCaption: z.string(),
	preset: z.enum(["kundli", "kerala", "tamil"]),
});

type PersonalValues = z.infer<typeof personalSchema>;
type CompatValues = z.infer<typeof compatSchema>;

async function geocodePlace(place: string): Promise<
	| { ok: true; lat: number; lng: number }
	| { ok: false; message: string }
> {
	const res = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
	const json = (await res.json()) as {
		error?: string;
		lat?: number;
		lng?: number;
	};
	if (!res.ok) {
		return {
			ok: false,
			message: json.error ?? `Could not find that place (${res.status})`,
		};
	}
	if (json.lat == null || json.lng == null) {
		return { ok: false, message: "Could not resolve coordinates for that location." };
	}
	return { ok: true, lat: json.lat, lng: json.lng };
}

function trimProfileNames(o: {
	first?: string;
	middle?: string;
	last?: string;
}) {
	const first_name = o.first?.trim();
	const middle_name = o.middle?.trim();
	const last_name = o.last?.trim();
	return {
		...(first_name ? { first_name } : {}),
		...(middle_name ? { middle_name } : {}),
		...(last_name ? { last_name } : {}),
	};
}

function buildPersonalModules(
	preset: PersonalValues["preset"],
	chartStyle: ProkeralaReportChartStyle
) {
	return preset === "mangal"
		? buildPersonalMangalDoshaModules(chartStyle)
		: buildPersonalFullReportModules(chartStyle);
}

function buildCompatModules(preset: CompatValues["preset"]) {
	switch (preset) {
		case "kundli":
			return buildCompatibilityKundliMatchingModules();
		case "kerala":
			return buildCompatibilityKeralaPoruthamModules();
		case "tamil":
			return buildCompatibilityTamilPoruthamModules();
	}
}

function reportOptionsExtras(name: string, caption: string) {
	const n = name.trim();
	const c = caption.trim();
	return {
		...(n ? { name: n } : {}),
		...(c ? { caption: c } : {}),
	};
}

export function PdfReportForm({ className }: { className?: string }) {
	const [personalError, setPersonalError] = useState<string | null>(null);
	const [compatError, setCompatError] = useState<string | null>(null);
	const [personalLoading, setPersonalLoading] = useState(false);
	const [compatLoading, setCompatLoading] = useState(false);
	const [personalPdfUrl, setPersonalPdfUrl] = useState<string | null>(null);
	const [compatPdfUrl, setCompatPdfUrl] = useState<string | null>(null);

	const personalForm = useForm<PersonalValues>({
		resolver: zodResolver(personalSchema),
		defaultValues: {
			firstName: "",
			middleName: "",
			lastName: "",
			gender: "male",
			chartStyle: "north-indian",
			birthDatetimeLocal: "",
			birthPlace: "",
			reportName: "",
			reportCaption: "",
			preset: "mangal",
		},
	});

	const compatForm = useForm<CompatValues>({
		resolver: zodResolver(compatSchema),
		defaultValues: {
			girlFirstName: "",
			girlMiddleName: "",
			girlLastName: "",
			girlBirthDatetimeLocal: "",
			girlBirthPlace: "",
			boyFirstName: "",
			boyMiddleName: "",
			boyLastName: "",
			boyBirthDatetimeLocal: "",
			boyBirthPlace: "",
			reportName: "",
			reportCaption: "",
			preset: "kundli",
		},
	});

	async function onPersonalSubmit(values: PersonalValues) {
		setPersonalError(null);
		setPersonalPdfUrl(null);
		const geo = await geocodePlace(values.birthPlace);
		if (!geo.ok) {
			setPersonalError(geo.message);
			return;
		}
		const datetime = datetimeLocalToIsoWithOffset(values.birthDatetimeLocal);
		const coordinates = `${geo.lat},${geo.lng}`;
		const modules = buildPersonalModules(values.preset, values.chartStyle);
		const names = trimProfileNames({
			first: values.firstName,
			middle: values.middleName,
			last: values.lastName,
		});

		const body: ProkeralaReportRequestBody = {
			input: {
				...names,
				gender: values.gender,
				datetime,
				coordinates,
				ayanamsa: 1,
			},
			options: {
				report: {
					la: "en",
					modules,
					...reportOptionsExtras(values.reportName, values.reportCaption),
				},
				template: { style: "basic" },
			},
		};

		setPersonalLoading(true);
		try {
			const res = await fetch("/api/prokerala/report/personal-reading/instant", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = (await res.json()) as ProkeralaReportResponse & {
				ok?: boolean;
				error?: string;
				details?: string;
			};
			if (!res.ok) {
				setPersonalError(
					json.details
						? `${json.error ?? "Request failed"}: ${json.details}`
						: (json.error ?? `Request failed (${res.status})`)
				);
				return;
			}
			const url = json.data?.report?.url;
			if (typeof url === "string" && url.length > 0) {
				setPersonalPdfUrl(url);
			} else {
				setPersonalError("Report generated but no PDF URL was returned.");
			}
		} catch (e) {
			setPersonalError(e instanceof Error ? e.message : "Network error");
		} finally {
			setPersonalLoading(false);
		}
	}

	async function onCompatSubmit(values: CompatValues) {
		setCompatError(null);
		setCompatPdfUrl(null);
		const girlGeo = await geocodePlace(values.girlBirthPlace);
		if (!girlGeo.ok) {
			setCompatError(`Girl: ${girlGeo.message}`);
			return;
		}
		const boyGeo = await geocodePlace(values.boyBirthPlace);
		if (!boyGeo.ok) {
			setCompatError(`Boy: ${boyGeo.message}`);
			return;
		}

		const girlDt = datetimeLocalToIsoWithOffset(values.girlBirthDatetimeLocal);
		const boyDt = datetimeLocalToIsoWithOffset(values.boyBirthDatetimeLocal);
		const girlCoords = `${girlGeo.lat},${girlGeo.lng}`;
		const boyCoords = `${boyGeo.lat},${boyGeo.lng}`;

		const girlNames = trimProfileNames({
			first: values.girlFirstName,
			middle: values.girlMiddleName,
			last: values.girlLastName,
		});
		const boyNames = trimProfileNames({
			first: values.boyFirstName,
			middle: values.boyMiddleName,
			last: values.boyLastName,
		});

		const modules = buildCompatModules(values.preset);

		const body: ProkeralaReportRequestBody = {
			input: {
				primary_profile: {
					datetime: girlDt,
					coordinates: girlCoords,
					...girlNames,
				},
				secondary_profile: {
					datetime: boyDt,
					coordinates: boyCoords,
					...boyNames,
				},
				ayanamsa: 1,
			},
			options: {
				report: {
					la: "en",
					modules,
					...reportOptionsExtras(values.reportName, values.reportCaption),
				},
				template: { style: "basic" },
			},
		};

		setCompatLoading(true);
		try {
			const res = await fetch("/api/prokerala/report/compatibility-reading/instant", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = (await res.json()) as ProkeralaReportResponse & {
				ok?: boolean;
				error?: string;
				details?: string;
			};
			if (!res.ok) {
				setCompatError(
					json.details
						? `${json.error ?? "Request failed"}: ${json.details}`
						: (json.error ?? `Request failed (${res.status})`)
				);
				return;
			}
			const url = json.data?.report?.url;
			if (typeof url === "string" && url.length > 0) {
				setCompatPdfUrl(url);
			} else {
				setCompatError("Report generated but no PDF URL was returned.");
			}
		} catch (e) {
			setCompatError(e instanceof Error ? e.message : "Network error");
		} finally {
			setCompatLoading(false);
		}
	}

	const rowClass =
		"grid gap-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-4";

	return (
		<div className={cn("mx-auto w-full max-w-3xl", className)}>
			<Tabs defaultValue="personal" className="w-full gap-6">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="personal">Personal Report</TabsTrigger>
					<TabsTrigger value="compatibility">Compatibility Report</TabsTrigger>
				</TabsList>

				<TabsContent value="personal" className="space-y-6">
					<Form {...personalForm}>
						<form
							onSubmit={personalForm.handleSubmit(onPersonalSubmit)}
							className="space-y-6"
						>
							<Card>
								<CardHeader>
									<CardTitle className="text-center text-base">
										Person&apos;s Birth Details
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={personalForm.control}
										name="firstName"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>First name</FormLabel>
												<FormControl>
													<Input placeholder="Enter first name" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="middleName"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Middle name</FormLabel>
												<FormControl>
													<Input placeholder="Enter middle name" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="lastName"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Last name</FormLabel>
												<FormControl>
													<Input placeholder="Enter last name" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="gender"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Gender</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select gender" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="male">Male</SelectItem>
														<SelectItem value="female">Female</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="chartStyle"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Chart</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Chart style" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="north-indian">North Indian</SelectItem>
														<SelectItem value="south-indian">South Indian</SelectItem>
														<SelectItem value="east-indian">East Indian</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="birthDatetimeLocal"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>
													Date <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input type="datetime-local" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="birthPlace"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>
													Place of birth <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input placeholder="City, country" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-center text-base">Report Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={personalForm.control}
										name="reportName"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Report name</FormLabel>
												<FormControl>
													<Input placeholder="Custom Report Name" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={personalForm.control}
										name="reportCaption"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Report caption</FormLabel>
												<FormControl>
													<Input placeholder="Custom Report Caption" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<div className="space-y-3">
										<Label>
											Choose report <span className="text-destructive">*</span>
										</Label>
										<FormField
											control={personalForm.control}
											name="preset"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
															className="space-y-4"
														>
															{(["mangal", "full"] as const).map((key) => (
																<div key={key} className="flex gap-3">
																	<RadioGroupItem
																		value={key}
																		id={`personal-preset-${key}`}
																		className="mt-1"
																	/>
																	<div className="min-w-0 flex-1 space-y-2">
																		<Label
																			htmlFor={`personal-preset-${key}`}
																			className="cursor-pointer font-medium leading-none"
																		>
																			{PERSONAL_PRESET_LABELS[key]}
																		</Label>
																		<div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
																			{PERSONAL_PRESET_MODULE_TAGS[key]}
																		</div>
																	</div>
																</div>
															))}
														</RadioGroup>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>

							{personalError && (
								<p className="text-sm text-destructive" role="alert">
									{personalError}
								</p>
							)}
							{personalPdfUrl && (
								<Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
									<CardHeader className="pb-2">
										<CardTitle className="text-base">PDF ready</CardTitle>
										<CardDescription>
											Open the report in a new tab or use your browser to download.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button variant="outline" size="sm" asChild className="gap-2">
											<a href={personalPdfUrl} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="h-4 w-4" />
												Open PDF
											</a>
										</Button>
									</CardContent>
								</Card>
							)}

							<div className="flex flex-col items-center gap-3">
								<Button
									type="submit"
									disabled={personalLoading}
									className="min-w-[200px] bg-amber-400 font-semibold uppercase text-black hover:bg-amber-500"
								>
									{personalLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Generating…
										</>
									) : (
										"Generate PDF"
									)}
								</Button>
								<p className="text-center text-xs text-muted-foreground">
									Branding is applied automatically for Dharmlok reports.
								</p>
							</div>
						</form>
					</Form>
				</TabsContent>

				<TabsContent value="compatibility" className="space-y-6">
					<Form {...compatForm}>
						<form
							onSubmit={compatForm.handleSubmit(onCompatSubmit)}
							className="space-y-6"
						>
							<Card>
								<CardHeader>
									<CardTitle className="text-center text-base">
										Girl &amp; Boy Birth Details
									</CardTitle>
								</CardHeader>
								<CardContent className="grid gap-8 md:grid-cols-2">
									<div className="space-y-4">
										<h3 className="text-center text-sm font-semibold">
											Enter Girl&apos;s Birth Details
										</h3>
										<FormField
											control={compatForm.control}
											name="girlFirstName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Girl first name</FormLabel>
													<FormControl>
														<Input placeholder="Enter first name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="girlMiddleName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Girl middle name</FormLabel>
													<FormControl>
														<Input placeholder="Enter middle name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="girlLastName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Girl last name</FormLabel>
													<FormControl>
														<Input placeholder="Enter last name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="girlBirthDatetimeLocal"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>
														Date of birth <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="girlBirthPlace"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>
														Place of birth <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input placeholder="City, country" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
									</div>
									<div className="space-y-4">
										<h3 className="text-center text-sm font-semibold">
											Enter Boy&apos;s Birth Details
										</h3>
										<FormField
											control={compatForm.control}
											name="boyFirstName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Boy first name</FormLabel>
													<FormControl>
														<Input placeholder="Enter first name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="boyMiddleName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Boy middle name</FormLabel>
													<FormControl>
														<Input placeholder="Enter middle name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="boyLastName"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>Boy last name</FormLabel>
													<FormControl>
														<Input placeholder="Enter last name" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="boyBirthDatetimeLocal"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>
														Date of birth <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input type="datetime-local" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
										<FormField
											control={compatForm.control}
											name="boyBirthPlace"
											render={({ field }) => (
												<FormItem className={rowClass}>
													<FormLabel>
														Place of birth <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input placeholder="City, country" {...field} />
													</FormControl>
													<FormMessage className="sm:col-span-2" />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-center text-base">Report Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={compatForm.control}
										name="reportName"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Report name</FormLabel>
												<FormControl>
													<Input placeholder="Custom Report Name" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<FormField
										control={compatForm.control}
										name="reportCaption"
										render={({ field }) => (
											<FormItem className={rowClass}>
												<FormLabel>Report caption</FormLabel>
												<FormControl>
													<Input placeholder="Custom Report Caption" {...field} />
												</FormControl>
												<FormMessage className="sm:col-span-2" />
											</FormItem>
										)}
									/>
									<div className="space-y-3">
										<Label>
											Choose report <span className="text-destructive">*</span>
										</Label>
										<FormField
											control={compatForm.control}
											name="preset"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
															className="space-y-4"
														>
															{(["kundli", "kerala", "tamil"] as const).map((key) => (
																<div key={key} className="flex gap-3">
																	<RadioGroupItem
																		value={key}
																		id={`compat-preset-${key}`}
																		className="mt-1"
																	/>
																	<div className="min-w-0 flex-1 space-y-2">
																		<Label
																			htmlFor={`compat-preset-${key}`}
																			className="cursor-pointer font-medium leading-none"
																		>
																			{COMPAT_PRESET_LABELS[key]}
																		</Label>
																		<div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
																			{COMPAT_PRESET_MODULE_TAGS[key]}
																		</div>
																	</div>
																</div>
															))}
														</RadioGroup>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>

							{compatError && (
								<p className="text-sm text-destructive" role="alert">
									{compatError}
								</p>
							)}
							{compatPdfUrl && (
								<Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
									<CardHeader className="pb-2">
										<CardTitle className="text-base">PDF ready</CardTitle>
										<CardDescription>
											Open the report in a new tab or use your browser to download.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button variant="outline" size="sm" asChild className="gap-2">
											<a href={compatPdfUrl} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="h-4 w-4" />
												Open PDF
											</a>
										</Button>
									</CardContent>
								</Card>
							)}

							<div className="flex flex-col items-center gap-3">
								<Button
									type="submit"
									disabled={compatLoading}
									className="min-w-[200px] bg-amber-400 font-semibold uppercase text-black hover:bg-amber-500"
								>
									{compatLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Generating…
										</>
									) : (
										"Generate PDF"
									)}
								</Button>
								<p className="text-center text-xs text-muted-foreground">
									Branding is applied automatically for Dharmlok reports.
								</p>
							</div>
						</form>
					</Form>
				</TabsContent>
			</Tabs>
		</div>
	);
}
