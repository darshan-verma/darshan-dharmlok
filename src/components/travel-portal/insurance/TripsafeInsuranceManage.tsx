"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function TripsafeInsuranceManage() {
	const searchParams = useSearchParams();
	const presetId = searchParams.get("id")?.trim() || "";

	const [bookingId, setBookingId] = useState(presetId);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [detailsJson, setDetailsJson] = useState<unknown>(null);

	const [raiseLoading, setRaiseLoading] = useState(false);
	const [plid, setPlid] = useState("");
	const [pid, setPid] = useState("");
	const [travellerRowId, setTravellerRowId] = useState("1");
	const [raiseRaw, setRaiseRaw] = useState<unknown>(null);

	const [amendmentId, setAmendmentId] = useState("");
	const [confirmLoading, setConfirmLoading] = useState(false);

	const [advancedKeys, setAdvancedKeys] = useState("");

	useEffect(() => {
		if (presetId) setBookingId(presetId);
	}, [presetId]);

	async function fetchDetails() {
		const id = bookingId.trim();
		if (!id) {
			toast.error("Enter booking ID");
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
			setDetailsJson(json.data);
			toast.success("Booking loaded");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Request failed");
		} finally {
			setDetailsLoading(false);
		}
	}

	function buildTravellerKeysFromForm():
		| Record<string, Record<string, { id: number }[]>>
		| null {
		if (advancedKeys.trim()) {
			try {
				const parsed = JSON.parse(advancedKeys) as Record<
					string,
					Record<string, { id: number }[]>
				>;
				return parsed;
			} catch {
				toast.error("Invalid JSON in advanced travellerKeys");
				return null;
			}
		}
		const plan = plid.trim();
		const prod = pid.trim();
		const tid = Number.parseInt(travellerRowId, 10);
		if (!plan || !prod || !Number.isFinite(tid)) {
			toast.error("Plan ID, product ID, and traveller id are required (or paste JSON)");
			return null;
		}
		return { [plan]: { [prod]: [{ id: tid }] } };
	}

	async function raiseCancellation() {
		const id = bookingId.trim();
		if (!id) {
			toast.error("Enter booking ID");
			return;
		}
		const keys = buildTravellerKeysFromForm();
		if (!keys) return;

		setRaiseLoading(true);
		try {
			const res = await fetch("/api/travel/tripsafe/amendment/raise", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: id,
					type: "CANCELLATION",
					travellerKeys: keys,
				}),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "Raise amendment failed");
			}
			setRaiseRaw(json.data);
			const data = json.data as Record<string, unknown>;
			const aid =
				typeof data.amendmentId === "string"
					? data.amendmentId
					: typeof data.amendment_id === "string"
						? data.amendment_id
						: "";
			if (aid) setAmendmentId(aid);
			toast.success("Cancellation draft created — confirm below if ready");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Raise failed");
		} finally {
			setRaiseLoading(false);
		}
	}

	async function confirmCancellation() {
		const b = bookingId.trim();
		const a = amendmentId.trim();
		if (!b || !a) {
			toast.error("Booking ID and amendment ID required");
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
				throw new Error(json.error || "Confirm failed");
			}
			toast.success("Cancellation request completed (check provider status in response)");
			setDetailsJson(json.data);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Confirm failed");
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
						Back to insurance search
					</Link>
				</Button>

				<div>
					<h1 className="text-2xl font-semibold text-gray-900">Manage TripSafe booking</h1>
					<p className="text-sm text-gray-600 mt-1">
						Load booking details, then start cancellation at least 24 hours before coverage
						starts. Confirming cancellation is irreversible.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Booking lookup</CardTitle>
						<CardDescription>
							Use the booking reference from the review / book step.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col sm:flex-row gap-3">
						<Input
							placeholder="Booking ID"
							value={bookingId}
							onChange={(e) => setBookingId(e.target.value)}
						/>
						<Button disabled={detailsLoading} onClick={fetchDetails}>
							{detailsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
						</Button>
					</CardContent>
				</Card>

				{detailsJson != null && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Booking details</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
								{JSON.stringify(detailsJson, null, 2)}
							</pre>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Raise cancellation</CardTitle>
						<CardDescription>
							Fill plan / product / traveller row id as returned by booking details, or paste
							full <code className="text-xs">travellerKeys</code> JSON.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid sm:grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label>Plan ID (plid)</Label>
								<Input value={plid} onChange={(e) => setPlid(e.target.value)} />
							</div>
							<div className="space-y-1">
								<Label>Product ID (pid)</Label>
								<Input value={pid} onChange={(e) => setPid(e.target.value)} />
							</div>
							<div className="space-y-1">
								<Label>Traveller id</Label>
								<Input
									value={travellerRowId}
									onChange={(e) => setTravellerRowId(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-1">
							<Label>Advanced — raw travellerKeys JSON</Label>
							<Textarea
								placeholder='{"PLAN_ID":{"PRODUCT_ID":[{"id":1}]}}'
								value={advancedKeys}
								onChange={(e) => setAdvancedKeys(e.target.value)}
								rows={4}
								className="font-mono text-xs"
							/>
						</div>
						<Button disabled={raiseLoading} onClick={raiseCancellation}>
							{raiseLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Raise cancellation
						</Button>
						{raiseRaw != null && (
							<details>
								<summary className="text-sm cursor-pointer">Raise response</summary>
								<pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
									{JSON.stringify(raiseRaw, null, 2)}
								</pre>
							</details>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Confirm cancellation</CardTitle>
						<CardDescription>Uses amendment id from the raise step.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-1">
							<Label>Amendment ID</Label>
							<Input
								value={amendmentId}
								onChange={(e) => setAmendmentId(e.target.value)}
							/>
						</div>
						<Separator />
						<Button
							variant="destructive"
							disabled={confirmLoading}
							onClick={confirmCancellation}
						>
							{confirmLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Confirm cancellation (irreversible)
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
