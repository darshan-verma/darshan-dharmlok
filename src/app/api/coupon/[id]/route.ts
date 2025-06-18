import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Coupon type for API
interface CouponApi {
	id: string;
	name: string;
	date: string;
	discount: number;
	userLimit: number;
	timeUsed: number;
	validity: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/coupon/[id]
export async function GET(
	req: NextRequest,
	context: { params: { id: string } }
) {
	const { id } = context.params;
	try {
		const coupon = await prisma.coupon.findUnique({ where: { id } });
		if (!coupon)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		const result: CouponApi = {
			id: coupon.id,
			name: coupon.name,
			date:
				coupon.date instanceof Date
					? coupon.date.toISOString().split("T")[0]
					: String(coupon.date),
			discount: Number(coupon.discount),
			userLimit: Number(coupon.userLimit),
			timeUsed: Number(coupon.timeUsed ?? 0),
			validity:
				coupon.validity instanceof Date
					? coupon.validity.toISOString().split("T")[0]
					: String(coupon.validity),
			status: coupon.status,
			createdAt: coupon.createdAt?.toISOString(),
			updatedAt: coupon.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch coupon" },
			{ status: 500 }
		);
	}
}

// PUT /api/coupon/[id]
export async function PUT(
	req: NextRequest,
	context: { params: { id: string } }
) {
	const { id } = context.params;
	try {
		const body = await req.json();
		const { name, date, discount, userLimit, timeUsed, validity, status } =
			body as Partial<CouponApi>;

		// Allow status-only update for quick status change
		if (status && Object.keys(body).length === 1) {
			const updated = await prisma.coupon.update({
				where: { id },
				data: { status },
			});
			return NextResponse.json({
				id: updated.id,
				status: updated.status,
			});
		}

		if (
			!name ||
			!date ||
			discount === undefined ||
			userLimit === undefined ||
			!validity ||
			!status
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const updated = await prisma.coupon.update({
			where: { id },
			data: {
				name,
				date: new Date(date),
				discount: Number(discount),
				userLimit: Number(userLimit),
				timeUsed: Number(timeUsed ?? 0),
				validity: new Date(validity),
				status,
			},
		});
		const result: CouponApi = {
			id: updated.id,
			name: updated.name,
			date:
				updated.date instanceof Date
					? updated.date.toISOString().split("T")[0]
					: String(updated.date),
			discount: Number(updated.discount),
			userLimit: Number(updated.userLimit),
			timeUsed: Number(updated.timeUsed ?? 0),
			validity:
				updated.validity instanceof Date
					? updated.validity.toISOString().split("T")[0]
					: String(updated.validity),
			status: updated.status,
			createdAt: updated.createdAt?.toISOString(),
			updatedAt: updated.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update coupon" },
			{ status: 500 }
		);
	}
}

// DELETE /api/coupon/[id]
export async function DELETE(
	_req: NextRequest,
	context: { params: { id: string } }
) {
	const { id } = context.params;
	try {
		await prisma.coupon.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete coupon" },
			{ status: 500 }
		);
	}
}
