"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { TripsafeNomineeRelation, TripsafeStudentCourseDays } from "@/types/tripsafe";
import {
	extractBookingIdFromReview,
	extractFirstInsurancePlanRawIds,
	extractInsurancePlanProducts,
	extractSuggestedWalletAmount,
	getTripsafeDefaultTripDates,
	type ExtractedInsurancePlanProduct,
} from "@/lib/tripsafeUiNormalize";
import { ChevronLeft, Loader2, Shield, Umbrella } from "lucide-react";

const POPULAR_KEYS = ["SCH", "EUR", "MDE", "USC", "ASI"] as const;

type Step = "search" | "plans" | "travelers" | "done";

type TravellerDraft = {
	dob: string;
	fn: string;
	ln: string;
	eid: string;
	pnum: string;
	gen: "MALE" | "FEMALE";
	niRelation: TripsafeNomineeRelation;
	niFn: string;
	niLn: string;
};

const NOMINEE_RELATIONS: TripsafeNomineeRelation[] = [
	"SPOUSE",
	"CHILD",
	"PARENT",
	"SIBLING",
	"FRIEND",
	"GUARDIAN",
	"OTHER",
];

const COURSE_DAYS: TripsafeStudentCourseDays[] = [180, 365, 730, 1095];

function emptyTraveller(): TravellerDraft {
	return {
		dob: "",
		fn: "",
		ln: "",
		eid: "",
		pnum: "",
		gen: "MALE",
		niRelation: "SPOUSE",
		niFn: "",
		niLn: "",
	};
}

export default function TripsafeInsuranceWizard() {
	const [step, setStep] = useState<Step>("search");
	const [loading, setLoading] = useState(false);

	const [{ sd, ed }, setTripRange] = useState(() => getTripsafeDefaultTripDates());
	const [popularKey, setPopularKey] = useState<string>("ASI");
	const [countryCode, setCountryCode] = useState("");
	const [ages, setAges] = useState<number[]>([30]);
	const [student, setStudent] = useState(false);
	const [cd, setCd] = useState<TripsafeStudentCourseDays>(365);

	const [studentCourse, setStudentCourse] = useState({
		cn: "",
		cdm: "",
		un: "",
		uc: "",
		sn: "",
		sdob: "",
		sr: "",
		se: "",
	});

	const [searchPayload, setSearchPayload] = useState<unknown>(null);
	const [plans, setPlans] = useState<ExtractedInsurancePlanProduct[]>([]);
	const [selected, setSelected] = useState<ExtractedInsurancePlanProduct | null>(null);
	const [reviewRaw, setReviewRaw] = useState<unknown>(null);
	const [bookingId, setBookingId] = useState("");
	const [walletAmount, setWalletAmount] = useState<string>("");

	const [travellers, setTravellers] = useState<TravellerDraft[]>([emptyTraveller()]);

	const suggestedAmount = useMemo(
		() => extractSuggestedWalletAmount(reviewRaw),
		[reviewRaw],
	);

	function buildSearchBody() {
		const iri: { rkey: string; rt: "POPULARREGION" | "COUNTRY" }[] = [];
		const cc = countryCode.trim().toUpperCase();
		// Match Postman: country-only search uses a single COUNTRY entry (not POPULARREGION+COUNTRY).
		if (cc) {
			iri.push({ rkey: cc, rt: "COUNTRY" });
		} else if (popularKey.trim()) {
			iri.push({
				rkey: popularKey.trim().toUpperCase(),
				rt: "POPULARREGION",
			});
		} else {
			iri.push({ rkey: "ASI", rt: "POPULARREGION" });
		}

		const iti = ages.map((age) => ({ age: Math.floor(age) }));
		const isq: Record<string, unknown> = {
			sd,
			ed,
			isc: { iri },
			iti,
			isp: {},
		};
		if (student) {
			isq.ict = "STUDENT";
			isq.cd = cd;
		}
		return { isq };
	}

	async function runSearch() {
		setLoading(true);
		try {
			const body = buildSearchBody();
			const res = await fetch("/api/travel/tripsafe/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Search failed");
			}
			const data = json.data;
			setSearchPayload(data);
			const list = extractInsurancePlanProducts(data);
			setPlans(list);
			if (!list.length) {
				const raw = extractFirstInsurancePlanRawIds(data);
				const description =
					raw?.plid && !raw?.pid
						? "Found plid but not pid under pli[0].pi[0] — Review requires both."
						: !raw?.plid
							? "Could not find plid (try isr.iinfo.pli[0] or data.isr when wrapped)."
							: "Provider may use a different shape; check raw response or try another region.";
				toast.message("No structured plans parsed", { description });
			}
			setStep("plans");
			toast.success("Search complete");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Search failed");
		} finally {
			setLoading(false);
		}
	}

	async function runReview(plan: ExtractedInsurancePlanProduct) {
		setLoading(true);
		setSelected(plan);
		try {
			const res = await fetch("/api/travel/tripsafe/review", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pli: [{ plid: plan.plid, pi: [{ pid: plan.pid }] }],
				}),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Review failed");
			}
			const data = json.data;
			setReviewRaw(data);
			const bid = extractBookingIdFromReview(data);
			if (!bid) {
				toast.message("Review OK — booking id not found in payload", {
					description: "Enter booking id manually on the next step if required.",
				});
				setBookingId("");
			} else {
				setBookingId(bid);
			}
			const sug = extractSuggestedWalletAmount(data);
			if (sug != null) setWalletAmount(String(sug));

			const nextRows = ages.map(() => emptyTraveller());
			setTravellers(nextRows.length ? nextRows : [emptyTraveller()]);
			setStep("travelers");
			toast.success("Plan locked — add traveller details");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Review failed");
			setSelected(null);
		} finally {
			setLoading(false);
		}
	}

	async function runBook() {
		if (!bookingId.trim()) {
			toast.error("Booking ID from review is required");
			return;
		}
		if (!selected) {
			toast.error("No plan selected");
			return;
		}
		const amountNum = Number.parseFloat(walletAmount);
		if (!Number.isFinite(amountNum) || amountNum < 0) {
			toast.error("Enter a valid wallet payment amount");
			return;
		}

		const iti = travellers.map((t) => ({
			dob: t.dob.trim() || undefined,
			fn: t.fn.trim(),
			ln: t.ln.trim(),
			eid: t.eid.trim() || undefined,
			pnum: t.pnum.trim() || undefined,
			gen: t.gen,
			ni: {
				relation: t.niRelation,
				fn: t.niFn.trim(),
				ln: t.niLn.trim(),
			},
		}));

		const pli: Record<string, unknown> = {
			plid: selected.plid,
			pi: [
				{
					pid: selected.pid,
					iti,
				},
			],
		};

		const payload: Record<string, unknown> = {
			bookingId: bookingId.trim(),
			paymentInfos: [{ method: "WALLET", amount: amountNum }],
			pli: [pli],
		};
		if (student) {
			payload.ict = "STUDENT";
			payload.cd = cd;
			const sc = Object.fromEntries(
				Object.entries(studentCourse).filter(([, v]) => String(v).trim()),
			);
			if (Object.keys(sc).length) payload.sc = sc;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/travel/tripsafe/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Booking failed");
			}
			setStep("done");
			toast.success("Insurance booked");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Booking failed");
		} finally {
			setLoading(false);
		}
	}

	function addAgeRow() {
		if (ages.length >= 10) return;
		setAges([...ages, 30]);
	}

	function removeAgeRow(idx: number) {
		if (ages.length <= 1) return;
		setAges(ages.filter((_, i) => i !== idx));
	}

	function updateAge(idx: number, v: number) {
		setAges(ages.map((a, i) => (i === idx ? v : a)));
	}

	function updateTraveller(idx: number, patch: Partial<TravellerDraft>) {
		setTravellers(travellers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
	}

	const stepIndex = step === "search" ? 0 : step === "plans" ? 1 : step === "travelers" ? 2 : 3;

	return (
		<div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-orange-50/40 to-gray-50 pb-16">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="flex items-start gap-3 mb-8">
					<div className="rounded-xl bg-orange-500/10 p-3 text-orange-600">
						<Umbrella className="w-8 h-8" />
					</div>
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">Travel insurance</h1>
						<p className="text-gray-600 text-sm mt-1">
							Search TripSafe plans, review pricing, then complete traveller and nominee details.
							Payment uses wallet per TripJack TripSafe rules.
						</p>
						<div className="flex gap-2 mt-3">
							<Link
								href="/travel-portal/insurance/manage"
								className="text-sm text-orange-600 hover:underline"
							>
								Manage or cancel booking
							</Link>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 mb-8 text-xs font-medium text-gray-500">
					{["Search", "Plans", "Details & pay", "Done"].map((label, i) => (
						<span key={label} className="flex items-center gap-2">
							{i > 0 ? <span className="text-gray-300">/</span> : null}
							<span
								className={
									i <= stepIndex ? "text-orange-600" : ""
								}
							>
								{label}
							</span>
						</span>
					))}
				</div>

				{step === "search" && (
					<Card className="border-orange-100 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="w-5 h-5 text-orange-500" />
								Trip details
							</CardTitle>
							<CardDescription>
								Up to 10 travellers; ages 0–70 (18–45 for student insurance).
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="sd">Start date</Label>
									<Input
										id="sd"
										type="date"
										value={sd}
										onChange={(e) =>
											setTripRange((prev) => ({ ...prev, sd: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ed">End date</Label>
									<Input
										id="ed"
										type="date"
										value={ed}
										onChange={(e) =>
											setTripRange((prev) => ({ ...prev, ed: e.target.value }))
										}
									/>
								</div>
							</div>

							<div className="grid sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Popular region</Label>
									<Select value={popularKey} onValueChange={setPopularKey}>
										<SelectTrigger>
											<SelectValue placeholder="Region" />
										</SelectTrigger>
										<SelectContent>
											{POPULAR_KEYS.map((k) => (
												<SelectItem key={k} value={k}>
													{k}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="cc">Country code (optional)</Label>
									<Input
										id="cc"
										placeholder="e.g. US"
										value={countryCode}
										onChange={(e) => setCountryCode(e.target.value)}
									/>
									<p className="text-xs text-gray-500">
										If filled, search uses only this country (matches Postman). Leave empty to
										use the popular region above.
									</p>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Traveller ages</Label>
									<Button type="button" variant="outline" size="sm" onClick={addAgeRow}>
										Add traveller
									</Button>
								</div>
								<div className="flex flex-wrap gap-2">
									{ages.map((age, idx) => (
										<div key={idx} className="flex items-center gap-1">
											<Input
												type="number"
												min={0}
												max={100}
												className="w-24"
												value={age}
												onChange={(e) =>
													updateAge(idx, Number.parseInt(e.target.value, 10) || 0)
												}
											/>
											{ages.length > 1 && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removeAgeRow(idx)}
												>
													×
												</Button>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="stu"
									checked={student}
									onCheckedChange={(c) => setStudent(c === true)}
								/>
								<Label htmlFor="stu" className="font-normal cursor-pointer">
									Student insurance
								</Label>
							</div>
							{student && (
								<div className="space-y-2 max-w-xs">
									<Label>Course duration (days)</Label>
									<Select
										value={String(cd)}
										onValueChange={(v) => setCd(Number(v) as TripsafeStudentCourseDays)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{COURSE_DAYS.map((d) => (
												<SelectItem key={d} value={String(d)}>
													{d} days
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							<Button
								className="w-full sm:w-auto"
								disabled={loading || !sd || !ed}
								onClick={runSearch}
							>
								{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
								Search plans
							</Button>
						</CardContent>
					</Card>
				)}

				{step === "plans" && (
					<div className="space-y-4">
						<Button variant="ghost" size="sm" onClick={() => setStep("search")}>
							<ChevronLeft className="w-4 h-4 mr-1" />
							Back
						</Button>
						{!plans.length ? (
							<Card>
								<CardContent className="pt-6 text-sm text-gray-600">
									<p>No plan list could be parsed from the response.</p>
									<p className="mt-2">
										Use UAT credentials and verify the provider payload, or inspect the raw JSON
										below for manual testing.
									</p>
									<pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
										{JSON.stringify(searchPayload, null, 2)}
									</pre>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4">
								{plans.map((p, idx) => (
									<Card key={`${p.plid}-${p.pid}-${idx}`} className="border-orange-100">
										<CardHeader className="pb-2">
											<div className="flex flex-wrap justify-between gap-2">
												<CardTitle className="text-lg">
													{p.title || "Insurance plan"}
												</CardTitle>
												<Badge variant="secondary">PID: {p.pid}</Badge>
											</div>
											<CardDescription>Plan ID: {p.plid}</CardDescription>
										</CardHeader>
										<CardContent>
											<Button
												disabled={loading}
												onClick={() => runReview(p)}
												className="w-full sm:w-auto"
											>
												{loading && selected?.pid === p.pid ? (
													<Loader2 className="w-4 h-4 animate-spin mr-2" />
												) : null}
												Select &amp; review
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				)}

				{step === "travelers" && selected && (
					<div className="space-y-6">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setStep("plans");
								setSelected(null);
							}}
						>
							<ChevronLeft className="w-4 h-4 mr-1" />
							Change plan
						</Button>

						<Card>
							<CardHeader>
								<CardTitle>Review snapshot</CardTitle>
								<CardDescription>
									{selected.title} · Plan {selected.plid} · Product {selected.pid}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Booking ID (from review)</Label>
										<Input
											value={bookingId}
											onChange={(e) => setBookingId(e.target.value)}
											placeholder="Paste bid / bookingId if missing"
										/>
									</div>
									<div className="space-y-2">
										<Label>Wallet amount (INR)</Label>
										<Input
											type="number"
											min={0}
											step={1}
											value={walletAmount}
											onChange={(e) => setWalletAmount(e.target.value)}
											placeholder={
												suggestedAmount != null
													? `Suggested ${suggestedAmount}`
													: "Amount"
											}
										/>
										{suggestedAmount != null && (
											<button
												type="button"
												className="text-xs text-orange-600 hover:underline"
												onClick={() => setWalletAmount(String(suggestedAmount))}
											>
												Use suggested {suggestedAmount}
											</button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{student && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Student details</CardTitle>
									<CardDescription>Optional fields sent as `sc` when filled.</CardDescription>
								</CardHeader>
								<CardContent className="grid sm:grid-cols-2 gap-3">
									{(
										[
											["cn", "Course name"],
											["cdm", "Course duration"],
											["un", "University"],
											["uc", "University city"],
											["sn", "Sponsor"],
											["sdob", "Sponsor DOB"],
											["sr", "Sponsor relation"],
											["se", "Sponsor email"],
										] as const
									).map(([key, label]) => (
										<div key={key} className="space-y-1">
											<Label className="text-xs">{label}</Label>
											<Input
												value={studentCourse[key]}
												onChange={(e) =>
													setStudentCourse({ ...studentCourse, [key]: e.target.value })
												}
											/>
										</div>
									))}
								</CardContent>
							</Card>
						)}

						<div className="space-y-6">
							{travellers.map((t, idx) => (
								<Card key={idx}>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">Traveller {idx + 1}</CardTitle>
									</CardHeader>
									<CardContent className="grid sm:grid-cols-2 gap-3">
										<div className="space-y-1">
											<Label>DOB</Label>
											<Input
												type="date"
												value={t.dob}
												onChange={(e) => updateTraveller(idx, { dob: e.target.value })}
											/>
										</div>
										<div className="space-y-1">
											<Label>Gender</Label>
											<Select
												value={t.gen}
												onValueChange={(v) =>
													updateTraveller(idx, { gen: v as "MALE" | "FEMALE" })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="MALE">Male</SelectItem>
													<SelectItem value="FEMALE">Female</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1">
											<Label>First name</Label>
											<Input
												value={t.fn}
												onChange={(e) => updateTraveller(idx, { fn: e.target.value })}
											/>
										</div>
										<div className="space-y-1">
											<Label>Last name</Label>
											<Input
												value={t.ln}
												onChange={(e) => updateTraveller(idx, { ln: e.target.value })}
											/>
										</div>
										<div className="space-y-1">
											<Label>Email</Label>
											<Input
												type="email"
												value={t.eid}
												onChange={(e) => updateTraveller(idx, { eid: e.target.value })}
											/>
										</div>
										<div className="space-y-1">
											<Label>Mobile (Indian)</Label>
											<Input
												value={t.pnum}
												onChange={(e) => updateTraveller(idx, { pnum: e.target.value })}
												placeholder="9XXXXXXXXX"
											/>
										</div>
										<Separator className="sm:col-span-2" />
										<div className="sm:col-span-2 font-medium text-sm">Nominee</div>
										<div className="space-y-1">
											<Label>Relation</Label>
											<Select
												value={t.niRelation}
												onValueChange={(v) =>
													updateTraveller(idx, { niRelation: v as TripsafeNomineeRelation })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{NOMINEE_RELATIONS.map((r) => (
														<SelectItem key={r} value={r}>
															{r}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1">
											<Label>Nominee first name</Label>
											<Input
												value={t.niFn}
												onChange={(e) => updateTraveller(idx, { niFn: e.target.value })}
											/>
										</div>
										<div className="space-y-1 sm:col-span-2">
											<Label>Nominee last name</Label>
											<Input
												value={t.niLn}
												onChange={(e) => updateTraveller(idx, { niLn: e.target.value })}
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<Button disabled={loading} className="w-full" onClick={runBook}>
							{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Pay with wallet &amp; book
						</Button>

						<details className="text-xs text-gray-500">
							<summary className="cursor-pointer">Review API raw</summary>
							<pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-48">
								{JSON.stringify(reviewRaw, null, 2)}
							</pre>
						</details>
					</div>
				)}

				{step === "done" && (
					<Card className="border-green-200 bg-green-50/40">
						<CardHeader>
							<CardTitle>Booking submitted</CardTitle>
							<CardDescription>
								Booking reference (review):{" "}
								<code className="bg-white px-1 rounded">{bookingId}</code>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Button asChild variant="outline">
								<Link href={`/travel-portal/insurance/manage?id=${encodeURIComponent(bookingId)}`}>
									View / cancel booking
								</Link>
							</Button>
							<Button variant="ghost" onClick={() => window.location.reload()}>
								New search
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
