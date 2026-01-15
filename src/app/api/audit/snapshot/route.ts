/**
 * API Route: Booking Audit Snapshot
 * POST /api/audit/snapshot
 *
 * Stores DOM snapshots for legal audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIpAddress, getUserAgent } from "@/lib/travelLogger";
import { stripSensitiveData } from "@/lib/audit/captureSnapshot";
import { createHash } from "crypto";
import type { BookingSnapshot } from "@/lib/audit/captureSnapshot";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as BookingSnapshot;

		// Validate required fields
		if (!body.page || !body.booking?.type) {
			return NextResponse.json(
				{
					success: false,
					error: "page and booking.type are required",
				},
				{ status: 400 }
			);
		}

		// Get user session (optional - don't block if it fails)
		let userId: string | undefined;
		try {
			const session = await getServerSession(authOptions);
			userId = session?.user?.id;
		} catch (error) {
			// Continue without user ID
			console.warn("Could not fetch session for snapshot:", error);
		}

		// Strip sensitive data before storage
		const cleanedData = stripSensitiveData(body.data);

		// Create tamper-proof hash
		// Hash: snapshot_json + timestamp + booking_id (if available)
		const hashInput = JSON.stringify(cleanedData) + 
			body.timestamp.toString() + 
			(body.booking.bookingId || "");
		const hash = createHash("sha256").update(hashInput).digest("hex");

		// Store snapshot
		const snapshot = await prisma.bookingAuditSnapshot.create({
			data: {
				bookingId: body.booking.bookingId ? body.booking.bookingId : null,
				userId: userId || null,
				type: body.booking.type,
				page: body.page,
				snapshotJson: cleanedData as unknown as Prisma.InputJsonValue,
				hash,
				ip: body.user.ip || getIpAddress(request) || null,
				userAgent: body.user.userAgent || getUserAgent(request) || null,
				traceId: body.booking.traceId || null,
				resultIndex: body.booking.resultIndex || null,
			},
		});

		return NextResponse.json({
			success: true,
			snapshotId: snapshot.id,
		});
	} catch (error) {
		console.error("Snapshot storage error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/audit/snapshot?bookingId=xxx or ?traceId=xxx
 * Retrieve snapshots for a booking or trace
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const bookingId = searchParams.get("bookingId");
		const traceId = searchParams.get("traceId");

		if (!bookingId && !traceId) {
			return NextResponse.json(
				{
					success: false,
					error: "bookingId or traceId is required",
				},
				{ status: 400 }
			);
		}

		const where: Record<string, unknown> = {};
		if (bookingId) {
			where.bookingId = bookingId;
		}
		if (traceId) {
			where.traceId = traceId;
		}

		const snapshots = await prisma.bookingAuditSnapshot.findMany({
			where,
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json({
			success: true,
			snapshots,
		});
	} catch (error) {
		console.error("Snapshot retrieval error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 }
		);
	}
}
