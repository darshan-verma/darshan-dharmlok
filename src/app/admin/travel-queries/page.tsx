"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type LinkedUser = {
	id: string;
	name: string;
	email: string;
	phone: string;
	userType: string | null;
} | null;

export type TravelPortalQueryRow = {
	id: string;
	queryType: string;
	userId: string | null;
	contactName: string;
	email: string;
	phone: string | null;
	preferredRegion: string | null;
	departurePort: string | null;
	travelMonth: string | null;
	passengers: number;
	cabinPreference: string | null;
	message: string | null;
	createdAt: string;
	user: LinkedUser;
};

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

/** Rough threshold: below this, full message fits without cluttering rows. */
const MESSAGE_PREVIEW_CHAR_THRESHOLD = 100;

function QueryMessageCell({
	queryId,
	message,
	expanded,
	onToggle,
}: {
	queryId: string;
	message: string;
	expanded: boolean;
	onToggle: (id: string) => void;
}) {
	const needsToggle = message.length > MESSAGE_PREVIEW_CHAR_THRESHOLD;

	if (!needsToggle) {
		return (
			<div className="mt-2 border-t border-border/60 pt-1.5 text-foreground whitespace-pre-wrap max-w-[min(100%,20rem)] text-xs leading-snug">
				{message}
			</div>
		);
	}

	return (
		<div className="mt-2 border-t border-border/60 pt-1.5 max-w-[min(100%,20rem)]">
			<div
				className={
					expanded
						? "text-foreground whitespace-pre-wrap text-xs leading-snug"
						: "text-foreground whitespace-pre-wrap text-xs leading-snug line-clamp-2"
				}
			>
				{message}
			</div>
			<button
				type="button"
				onClick={() => onToggle(queryId)}
				className="mt-1 text-xs font-medium text-primary hover:underline"
			>
				{expanded ? "Show less" : "... read more"}
			</button>
		</div>
	);
}

export default function TravelQueriesAdminPage() {
	const [rows, setRows] = useState<TravelPortalQueryRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(
		() => new Set(),
	);

	const toggleMessageExpanded = (id: string) => {
		setExpandedMessageIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/travel-portal/queries", {
					credentials: "include",
				});
				if (!res.ok) {
					if (res.status === 401) {
						toast.error("You must be signed in as admin to view travel queries.");
					} else {
						toast.error("Failed to load travel queries.");
					}
					return;
				}
				const data = await res.json();
				if (!cancelled) {
					setRows(data.queries || []);
				}
			} catch {
				if (!cancelled) toast.error("Failed to load travel queries.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">
				Loading travel queries…
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Travel queries</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Cruise and other Dharmlok Travels inquiries, with linked account details when
					the visitor was signed in.
				</p>
			</div>

			{rows.length === 0 ? (
				<p className="text-muted-foreground border rounded-lg p-6 bg-muted/30">
					No queries yet.
				</p>
			) : (
				<div className="overflow-x-auto rounded-lg border bg-card">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50 text-left">
								<th className="px-3 py-2 font-medium whitespace-nowrap text-xs uppercase tracking-wide">
									Submitted
								</th>
								<th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
									Type
								</th>
								<th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
									Contact on form
								</th>
								<th className="px-3 py-2 font-medium min-w-[200px] text-xs uppercase tracking-wide">
									Cruise details
								</th>
								<th className="px-3 py-2 font-medium min-w-[220px] text-xs uppercase tracking-wide">
									Linked user
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((q) => (
								<tr key={q.id} className="border-b last:border-0 align-top">
									<td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">
										{formatDate(q.createdAt)}
									</td>
									<td className="px-3 py-2 capitalize text-xs">{q.queryType}</td>
									<td className="px-3 py-2 text-xs">
										<div className="font-medium leading-tight">{q.contactName}</div>
										<div className="text-muted-foreground leading-tight">
											{q.email}
										</div>
										{q.phone ? (
											<div className="text-muted-foreground leading-tight">
												{q.phone}
											</div>
										) : null}
									</td>
									<td className="px-3 py-2 text-muted-foreground space-y-0.5 text-xs leading-snug">
										{q.preferredRegion ? (
											<div>
												<span className="text-foreground/80">Region: </span>
												{q.preferredRegion}
											</div>
										) : null}
										{q.departurePort ? (
											<div>
												<span className="text-foreground/80">Port: </span>
												{q.departurePort}
											</div>
										) : null}
										{q.travelMonth ? (
											<div>
												<span className="text-foreground/80">When: </span>
												{q.travelMonth}
											</div>
										) : null}
										<div>
											<span className="text-foreground/80">Pax: </span>
											{q.passengers}
										</div>
										{q.cabinPreference ? (
											<div>
												<span className="text-foreground/80">Cabin: </span>
												{q.cabinPreference}
											</div>
										) : null}
										{q.message ? (
											<QueryMessageCell
												queryId={q.id}
												message={q.message}
												expanded={expandedMessageIds.has(q.id)}
												onToggle={toggleMessageExpanded}
											/>
										) : null}
									</td>
									<td className="px-3 py-2 text-xs">
										{q.user ? (
											<div className="space-y-1">
												<div className="font-medium">{q.user.name}</div>
												<div className="text-muted-foreground">{q.user.email}</div>
												<div className="text-muted-foreground">{q.user.phone}</div>
												{q.user.userType ? (
													<div className="text-xs uppercase tracking-wide text-muted-foreground">
														{q.user.userType}
													</div>
												) : null}
												<div className="text-xs text-muted-foreground font-mono">
													ID: {q.user.id}
												</div>
											</div>
										) : (
											<span className="text-muted-foreground italic">
												Guest / not signed in
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
