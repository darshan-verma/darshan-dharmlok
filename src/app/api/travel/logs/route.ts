/**
 * API Route: Travel Logs
 * GET /api/travel/logs
 *
 * Fetch travel audit logs for admin panel
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const logType = searchParams.get("logType"); // "flight" | "hotel" | null (all)
		const action = searchParams.get("action"); // "booking" | "search" | null (all)
		const userId = searchParams.get("userId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		const skip = (page - 1) * limit;

		// Build where clause
		const where: {
			logType?: string;
			action?: string;
			userId?: string;
			createdAt?: {
				gte?: Date;
				lte?: Date;
			};
		} = {};

		if (logType) {
			where.logType = logType;
		}

		if (action) {
			where.action = action;
		}

		if (userId) {
			where.userId = userId;
		}

		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) {
				where.createdAt.gte = new Date(startDate);
			}
			if (endDate) {
				where.createdAt.lte = new Date(endDate);
			}
		}

		// Fetch logs with pagination
		const [logs, total] = await Promise.all([
			prisma.travelLog.findMany({
				where,
				skip,
				take: limit,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.travelLog.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		return NextResponse.json({
			success: true,
			logs,
			pagination: {
				currentPage: page,
				totalPages,
				totalItems: total,
				itemsPerPage: limit,
			},
		});
	} catch (error) {
		console.error("Error fetching travel logs:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch travel logs",
			},
			{ status: 500 }
		);
	}
}
