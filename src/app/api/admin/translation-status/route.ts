import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const COLLECTIONS = [
	"Temple",
	"Dharamshala",
	"TempleFaq",
	"DharamshalaFaq",
	"Blog",
	"PoojaCategory",
	"Event",
] as const;

type StatusKey = "none" | "partial" | "complete";

async function aggregateByStatus(collection: string) {
	const pipeline = [
		{
			$group: {
				_id: "$translationStatus",
				count: { $sum: 1 },
			},
		},
	];

	const result = await prisma.$runCommandRaw({
		aggregate: collection,
		pipeline,
		cursor: {},
	});

	const counts: Record<StatusKey, number> = {
		none: 0,
		partial: 0,
		complete: 0,
	};

	const cursor = result as {
		cursor?: { firstBatch?: { _id: string; count: number }[] };
	};
	const batch = cursor.cursor?.firstBatch ?? [];
	for (const row of batch) {
		const key = row._id as StatusKey;
		if (key in counts) counts[key] = row.count;
	}

	const total = counts.none + counts.partial + counts.complete;
	return { collection, counts, total };
}

async function aggregatePanditji() {
	const pipeline = [
		{ $match: { userType: "panditji" } },
		{
			$group: {
				_id: "$translationStatus",
				count: { $sum: 1 },
			},
		},
	];

	const result = await prisma.$runCommandRaw({
		aggregate: "User",
		pipeline,
		cursor: {},
	});

	const counts: Record<StatusKey, number> = {
		none: 0,
		partial: 0,
		complete: 0,
	};

	const cursor = result as {
		cursor?: { firstBatch?: { _id: string; count: number }[] };
	};
	const batch = cursor.cursor?.firstBatch ?? [];
	for (const row of batch) {
		const key = row._id as StatusKey;
		if (key in counts) counts[key] = row.count;
	}

	const total = counts.none + counts.partial + counts.complete;
	return { collection: "User (panditji)", counts, total };
}

export async function GET() {
	try {
		const results = await Promise.all([
			...COLLECTIONS.map((c) => aggregateByStatus(c)),
			aggregatePanditji(),
		]);

		const totals = results.reduce(
			(acc, row) => {
				acc.none += row.counts.none;
				acc.partial += row.counts.partial;
				acc.complete += row.counts.complete;
				acc.total += row.total;
				return acc;
			},
			{ none: 0, partial: 0, complete: 0, total: 0 }
		);

		return NextResponse.json({
			success: true,
			totals,
			collections: results,
		});
	} catch (error) {
		console.error("[GET /api/admin/translation-status]", error);
		return NextResponse.json(
			{ error: "Failed to load translation status" },
			{ status: 500 }
		);
	}
}
