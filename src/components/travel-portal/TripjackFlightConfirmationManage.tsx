"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NormalizedBookingDetails } from "@/types/booking-details";
import { toast } from "@/lib/toast";

const DEFAULT_REMARKS = "Customer request via Dharmlok travel portal";

function uniqueAirlinePnrs(d: NormalizedBookingDetails): string[] {
	const set = new Set<string>();
	if (d.pnr?.trim()) set.add(d.pnr.trim());
	for (const p of d.passengers ?? []) {
		if (p.pnr?.trim()) set.add(p.pnr.trim());
	}
	return [...set];
}

function confirmAmountInr(d: NormalizedBookingDetails): number | null {
	const raw = d.orderAmount ?? d.fare?.amount;
	if (typeof raw !== "number" || Number.isNaN(raw) || raw <= 0) return null;
	return Math.round(raw * 100) / 100;
}

interface Props {
	bookingId: string;
	details: NormalizedBookingDetails;
	onRefetch: () => void;
}

export default function TripjackFlightConfirmationManage({
	bookingId,
	details,
	onRefetch,
}: Props) {
	const orderStatus = (details.status ?? "").toUpperCase();
	const [busy, setBusy] = useState<string | null>(null);
	const [amendmentIdInput, setAmendmentIdInput] = useState("");
	const [lastAmendmentPayload, setLastAmendmentPayload] = useState<unknown>(null);

	const run = useCallback(
		async (key: string, fn: () => Promise<void>) => {
			setBusy(key);
			try {
				await fn();
			} finally {
				setBusy(null);
			}
		},
		[],
	);

	const handleFareValidate = () => {
		void run("fare", async () => {
			const res = await fetch("/api/travel/tripjack-flight/confirm-fare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Fare validation failed");
				return;
			}
			toast.success("Fare still valid for this hold.");
		});
	};

	const handleConfirmHold = () => {
		const amount = confirmAmountInr(details);
		if (amount == null) {
			toast.error("Order amount is missing; cannot confirm hold. Check booking details or contact support.");
			return;
		}
		void run("confirm", async () => {
			const res = await fetch("/api/travel/tripjack-flight/confirm-book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId,
					paymentInfos: [{ amount }],
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Confirm booking failed");
				return;
			}
			toast.success("Payment submitted; refreshing booking status…");
			onRefetch();
		});
	};

	const handleReleaseHold = () => {
		const pnrs = uniqueAirlinePnrs(details);
		if (!pnrs.length) {
			toast.error("No airline PNR found on this booking; cannot release hold.");
			return;
		}
		if (!window.confirm(`Release hold and cancel these PNRs?\n${pnrs.join(", ")}`)) return;
		void run("release", async () => {
			const res = await fetch("/api/travel/tripjack-flight/release-pnr", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId, pnrs }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Release PNR failed");
				return;
			}
			toast.success("Release requested; refreshing…");
			onRefetch();
		});
	};

	const handleAmendmentCharges = () => {
		void run("charges", async () => {
			const res = await fetch("/api/travel/tripjack-flight/amendment-charges", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId,
					type: "CANCELLATION",
					remarks: DEFAULT_REMARKS,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Could not load amendment charges");
				return;
			}
			setLastAmendmentPayload(data.data);
			toast.success("Cancellation charges loaded (see details below).");
		});
	};

	const handleSubmitCancellation = () => {
		if (!window.confirm("Submit cancellation for this booking? This cannot be undone from the portal."))
			return;
		void run("submit", async () => {
			const res = await fetch("/api/travel/tripjack-flight/submit-amendment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId,
					type: "CANCELLATION",
					remarks: DEFAULT_REMARKS,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Submit amendment failed");
				return;
			}
			const aid =
				typeof data?.data?.amendmentId === "string" ? data.data.amendmentId : "";
			if (aid) setAmendmentIdInput(aid);
			setLastAmendmentPayload(data.data);
			toast.success(aid ? `Amendment submitted. Amendment id: ${aid}` : "Amendment submitted.");
			onRefetch();
		});
	};

	const handleAmendmentDetails = () => {
		const amendmentId = amendmentIdInput.trim();
		if (!amendmentId) {
			toast.error("Enter amendment id from submit response.");
			return;
		}
		void run("details", async () => {
			const res = await fetch("/api/travel/tripjack-flight/amendment-details", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amendmentId }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.success) {
				toast.error(data?.error || "Amendment details request failed");
				return;
			}
			setLastAmendmentPayload(data.data);
			toast.success("Amendment status loaded.");
		});
	};

	if (orderStatus === "PENDING" || orderStatus === "FAILED" || orderStatus === "ABORTED") {
		return (
			<div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
				<p className="font-medium">Booking status: {details.status}</p>
				<p className="mt-1 text-amber-800/90">
					Refresh this page later or contact support if the booking does not move to success or on hold.
				</p>
			</div>
		);
	}

	if (orderStatus === "ON_HOLD") {
		return (
			<div className="mb-6 space-y-4">
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
					<p className="font-medium">Booking on hold</p>
					<p className="text-sm mt-1 text-blue-800/90">
						Validate fare before paying, then complete payment to ticket. You can also release the PNR if
						the traveller will not travel.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							disabled={busy !== null}
							onClick={handleFareValidate}
							className="inline-flex items-center gap-2"
						>
							{busy === "fare" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Check fare (validate)
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={busy !== null}
							onClick={handleConfirmHold}
							className="inline-flex items-center gap-2"
						>
							{busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Pay &amp; confirm ticket
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={busy !== null}
							onClick={handleReleaseHold}
							className="inline-flex items-center gap-2"
						>
							{busy === "release" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Release hold
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (orderStatus === "SUCCESS") {
		return (
			<div className="mb-6 space-y-4">
				<div className="rounded-lg border border-gray-200 bg-muted/30 p-4">
					<p className="font-medium text-gray-900">Manage booking</p>
					<p className="text-sm text-muted-foreground mt-1">
						Cancellation is processed through Dharmlok. Date change may require support if not available for
						this fare.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							disabled={busy !== null}
							onClick={handleAmendmentCharges}
							className="inline-flex items-center gap-2"
						>
							{busy === "charges" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Cancellation charges
						</Button>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							disabled={busy !== null}
							onClick={handleSubmitCancellation}
							className="inline-flex items-center gap-2"
						>
							{busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Submit cancellation
						</Button>
					</div>
					<div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-end">
						<div className="flex-1 space-y-1">
							<label htmlFor="tj-amendment-id" className="text-xs text-muted-foreground">
								Amendment id (after submit)
							</label>
							<Input
								id="tj-amendment-id"
								value={amendmentIdInput}
								onChange={(e) => setAmendmentIdInput(e.target.value)}
								placeholder="Paste amendmentId to poll status"
								className="font-mono text-sm"
							/>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={busy !== null}
							onClick={handleAmendmentDetails}
							className="inline-flex items-center gap-2"
						>
							{busy === "details" ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
							Amendment status
						</Button>
					</div>
					{lastAmendmentPayload != null && (
						<pre className="mt-3 max-h-48 overflow-auto rounded border bg-background p-2 text-xs">
							{JSON.stringify(lastAmendmentPayload, null, 2)}
						</pre>
					)}
				</div>
			</div>
		);
	}

	if (orderStatus === "UNCONFIRMED" || orderStatus === "CANCELLED") {
		return (
			<div className="mb-6 rounded-lg border border-gray-200 bg-muted/20 p-4 text-sm text-muted-foreground">
				This booking is <span className="font-medium text-foreground">{details.status}</span>. No further
				actions are offered here.
			</div>
		);
	}

	return null;
}
