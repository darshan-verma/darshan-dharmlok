"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
	extractInsuranceBookingSummary,
	extractInsuranceCancellationTargets,
	type TripsafeBookingSummary,
	type TripsafeCancellationTarget,
} from "@/lib/tripsafeUiNormalize";

function formatInr(amount: number | undefined): string {
	if (amount == null || !Number.isFinite(amount)) return "—";
	return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatStatus(status: string | undefined): string {
	if (!status) return "—";
	return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
			<dt className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</dt>
			<dd className="text-sm font-medium text-gray-900">{value}</dd>
		</div>
	);
}

export default function TripsafeInsuranceManage() {
	const searchParams = useSearchParams();
	const presetId = searchParams.get("id")?.trim() || "";

	const [bookingId, setBookingId] = useState(presetId);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [summary, setSummary] = useState<TripsafeBookingSummary | null>(null);
	const [cancellationTargets, setCancellationTargets] = useState<
		TripsafeCancellationTarget[]
	>([]);
	const [selectedTargetIdx, setSelectedTargetIdx] = useState("0");

	const [raiseLoading, setRaiseLoading] = useState(false);
	const [amendmentId, setAmendmentId] = useState("");
	const [confirmLoading, setConfirmLoading] = useState(false);

	useEffect(() => {
		if (presetId) setBookingId(presetId);
	}, [presetId]);

	const selectedTarget = useMemo(() => {
		const idx = Number.parseInt(selectedTargetIdx, 10);
		return cancellationTargets[idx] ?? null;
	}, [cancellationTargets, selectedTargetIdx]);

	function applyBookingPayload(data: unknown) {
		const nextSummary = extractInsuranceBookingSummary(data);
		const targets = extractInsuranceCancellationTargets(data);
		setSummary(nextSummary);
		setCancellationTargets(targets);
		setSelectedTargetIdx("0");
	}

	async function fetchDetails() {
		const id = bookingId.trim();
		if (!id) {
			toast.error("Enter your booking reference");
			return;
		}
		setDetailsLoading(true);
		try {
			const res = await fetch("/api/travel/tripsafe/booking-details", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId: id }),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Failed to load booking");
			}
			applyBookingPayload(json.data);
			toast.success("Booking loaded");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Request failed");
		} finally {
			setDetailsLoading(false);
		}
	}

	async function raiseCancellation() {
		const id = bookingId.trim();
		if (!id) {
			toast.error("Enter your booking reference");
			return;
		}
		if (!selectedTarget) {
			toast.error("Load a booking first to select a traveller");
			return;
		}

		setRaiseLoading(true);
		try {
			const res = await fetch("/api/travel/tripsafe/amendment/raise", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: id,
					type: "CANCELLATION",
					travellerKeys: {
						[selectedTarget.plid]: {
							[selectedTarget.pid]: [{ id: selectedTarget.travellerId }],
						},
					},
				}),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Could not start cancellation");
			}
			const data = json.data as Record<string, unknown>;
			const aid =
				typeof data.amendmentId === "string"
					? data.amendmentId
					: typeof data.amendment_id === "string"
						? data.amendment_id
						: "";
			if (aid) setAmendmentId(aid);
			toast.success("Cancellation request created — review and confirm below");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Request failed");
		} finally {
			setRaiseLoading(false);
		}
	}

	async function confirmCancellation() {
		const b = bookingId.trim();
		const a = amendmentId.trim();
		if (!b || !a) {
			toast.error("Booking reference and cancellation reference are required");
			return;
		}
		setConfirmLoading(true);
		try {
			const res = await fetch("/api/travel/tripsafe/amendment/confirm-cancellation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId: b, amendmentId: a }),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Could not confirm cancellation");
			}
			toast.success("Cancellation confirmed");
			if (json.data) applyBookingPayload(json.data);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Request failed");
		} finally {
			setConfirmLoading(false);
		}
	}

	return (
		<div className="min-h-[calc(100vh-8rem)] bg-gray-50 pb-16">
			<div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/travel-portal/insurance">
						<ChevronLeft className="w-4 h-4 mr-1" />
						Back to insurance
					</Link>
				</Button>

				<div>
					<h1 className="text-2xl font-semibold text-gray-900">Manage your booking</h1>
					<p className="text-sm text-gray-600 mt-1">
						Look up your policy, then request cancellation at least 24 hours before
						coverage starts. Confirming cancellation cannot be undone.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Find booking</CardTitle>
						<CardDescription>
							Enter the booking reference from your confirmation email or receipt.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col sm:flex-row gap-3">
						<Input
							placeholder="Booking reference"
							value={bookingId}
							onChange={(e) => setBookingId(e.target.value)}
						/>
						<Button disabled={detailsLoading} onClick={fetchDetails}>
							{detailsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
						</Button>
					</CardContent>
				</Card>

				{summary && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Policy summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<dl className="space-y-3">
								<SummaryRow
									label="Booking reference"
									value={summary.bookingId || bookingId}
								/>
								<SummaryRow label="Status" value={formatStatus(summary.status)} />
								<SummaryRow label="Plan" value={summary.planTitle || "—"} />
								<SummaryRow
									label="Coverage"
									value={
										summary.coverageStart && summary.coverageEnd
											? `${summary.coverageStart} → ${summary.coverageEnd}`
											: "—"
									}
								/>
								<SummaryRow label="Amount paid" value={formatInr(summary.amount)} />
								{summary.createdOn && (
									<SummaryRow
										label="Booked on"
										value={new Date(summary.createdOn).toLocaleString()}
									/>
								)}
							</dl>

							{summary.travellers.length > 0 && (
								<>
									<Separator />
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-gray-900">Travellers</h3>
										{summary.travellers.map((t, idx) => (
											<div
												key={`${t.name}-${idx}`}
												className="rounded-lg border border-gray-200 bg-white p-3 text-sm space-y-1"
											>
												<p className="font-medium text-gray-900">{t.name}</p>
												{t.age != null && (
													<p className="text-gray-600">Age {t.age}</p>
												)}
												{t.email && (
													<p className="text-gray-600">{t.email}</p>
												)}
												{t.phone && (
													<p className="text-gray-600">{t.phone}</p>
												)}
												{t.policyNumber && (
													<p className="text-gray-600">
														Policy no. {t.policyNumber}
													</p>
												)}
											</div>
										))}
									</div>
								</>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Request cancellation</CardTitle>
						<CardDescription>
							{summary
								? "Choose the traveller to cancel, then submit your request."
								: "Load a booking above to start a cancellation request."}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{cancellationTargets.length > 1 ? (
							<div className="space-y-1">
								<Label>Traveller</Label>
								<Select
									value={selectedTargetIdx}
									onValueChange={setSelectedTargetIdx}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select traveller" />
									</SelectTrigger>
									<SelectContent>
										{cancellationTargets.map((t, idx) => (
											<SelectItem key={`${t.travellerId}-${idx}`} value={String(idx)}>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						) : cancellationTargets.length === 1 ? (
							<p className="text-sm text-gray-600">
								Traveller: <span className="font-medium">{cancellationTargets[0].label}</span>
							</p>
						) : null}

						<Button
							disabled={raiseLoading || !summary || !selectedTarget}
							onClick={raiseCancellation}
						>
							{raiseLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Start cancellation
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Confirm cancellation</CardTitle>
						<CardDescription>
							After starting a cancellation, enter the reference below to confirm.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-1">
							<Label>Cancellation reference</Label>
							<Input
								placeholder="Filled automatically after you start cancellation"
								value={amendmentId}
								onChange={(e) => setAmendmentId(e.target.value)}
							/>
						</div>
						<Separator />
						<Button
							variant="destructive"
							disabled={confirmLoading || !amendmentId.trim()}
							onClick={confirmCancellation}
						>
							{confirmLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Confirm cancellation
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
