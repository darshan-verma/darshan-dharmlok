"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type StatusCounts = {
	none: number;
	partial: number;
	complete: number;
};

type CollectionRow = {
	collection: string;
	counts: StatusCounts;
	total: number;
};

const ADMIN_LINKS: Record<string, { list: string; editPrefix?: string }> = {
	Temple: { list: "/admin/temple", editPrefix: "/admin/temple/" },
	Dharamshala: { list: "/admin/dharamshala", editPrefix: "/admin/dharamshala/" },
	Blog: { list: "/admin/blogs" },
	PoojaCategory: { list: "/admin/pooja-category" },
	Event: { list: "/admin/events" },
	"User (panditji)": { list: "/admin/panditji", editPrefix: "/admin/panditji/" },
};

export default function TranslationsDashboardPage() {
	const [rows, setRows] = useState<CollectionRow[]>([]);
	const [totals, setTotals] = useState<StatusCounts & { total: number }>({
		none: 0,
		partial: 0,
		complete: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/admin/translation-status");
				if (!res.ok) throw new Error("Failed to load");
				const json = await res.json();
				setRows(json.collections ?? []);
				setTotals(
					json.totals ?? {
						none: 0,
						partial: 0,
						complete: 0,
						total: 0,
					}
				);
			} catch {
				setRows([]);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const completePct =
		totals.total > 0 ? Math.round((totals.complete / totals.total) * 100) : 0;

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Translation Status</h1>
				<p className="text-muted-foreground text-sm mt-1">
					Hindi coverage across content collections (embedded translations).
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Overall</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex justify-between text-sm">
						<span>Complete Hindi</span>
						<span>
							{totals.complete} / {totals.total} ({completePct}%)
						</span>
					</div>
					<Progress value={completePct} />
					<div className="grid grid-cols-3 gap-4 text-sm pt-2">
						<div>
							<span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-2" />
							None: {totals.none}
						</div>
						<div>
							<span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2" />
							Partial: {totals.partial}
						</div>
						<div>
							<span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2" />
							Complete: {totals.complete}
						</div>
					</div>
				</CardContent>
			</Card>

			{loading ? (
				<p className="text-muted-foreground">Loading…</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{rows.map((row) => {
						const pct =
							row.total > 0
								? Math.round((row.counts.complete / row.total) * 100)
								: 0;
						const links = ADMIN_LINKS[row.collection];
						return (
							<Card key={row.collection}>
								<CardHeader className="pb-2">
									<CardTitle className="text-lg">{row.collection}</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<Progress value={pct} />
									<p className="text-sm text-muted-foreground">
										{row.counts.complete} complete · {row.counts.partial}{" "}
										partial · {row.counts.none} none ({row.total} total)
									</p>
									{links && (
										<div className="flex gap-2">
											<Button variant="outline" size="sm" asChild>
												<Link href={links.list}>View list</Link>
											</Button>
											<Button variant="secondary" size="sm" asChild>
												<Link href={`${links.list}?translationStatus=partial`}>
													View missing
												</Link>
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
