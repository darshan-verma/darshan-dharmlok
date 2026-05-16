"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CabBookingDetailsView from "@/components/travel-portal/CabBookingDetailsView";
import type { TripjackCabBookingSnapshot } from "@/types/tripjack";

type TravelBookingRecord = {
	id: string;
	transportType?: string | null;
	source?: string | null;
	bookingSnapshot?: unknown;
};

function isCabSnapshot(value: unknown): value is TripjackCabBookingSnapshot {
	if (!value || typeof value !== "object") return false;
	const o = value as Record<string, unknown>;
	return typeof o.id === "string" && typeof o.status === "string";
}

export default function CabBookingDetailPage() {
	const params = useParams();
	const id = typeof params?.id === "string" ? params.id : "";
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [snapshot, setSnapshot] = useState<TripjackCabBookingSnapshot | null>(
		null,
	);

	useEffect(() => {
		if (!id) {
			setLoading(false);
			setError("Missing booking id");
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		fetch(`/api/bookings/${encodeURIComponent(id)}`)
			.then(async (res) => {
				const text = await res.text();
				let data: unknown;
				try {
					data = text ? JSON.parse(text) : {};
				} catch {
					throw new Error("Invalid response");
				}
				if (!res.ok) {
					const msg =
						typeof data === "object" &&
						data !== null &&
						"error" in data &&
						typeof (data as { error: unknown }).error === "string"
							? (data as { error: string }).error
							: res.statusText;
					throw new Error(msg);
				}
				return data as TravelBookingRecord;
			})
			.then((row) => {
				if (cancelled) return;
				const snap = row.bookingSnapshot;
				if (!isCabSnapshot(snap)) {
					setError("No cab booking details stored for this trip.");
					setSnapshot(null);
					return;
				}
				setSnapshot(snap);
			})
			.catch((e: unknown) => {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load booking");
					setSnapshot(null);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [id]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/travel-portal/my-trips" className="gap-1">
							<ArrowLeft className="h-4 w-4" />
							My trips
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link href="/travel-portal/cab-search">Cab search</Link>
					</Button>
				</div>

				{loading ? (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading booking…
					</div>
				) : error ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
						{error}
					</div>
				) : snapshot ? (
					<CabBookingDetailsView data={snapshot} />
				) : null}
			</div>
		</div>
	);
}
