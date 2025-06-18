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

// GET /api/coupon
export async function GET(_req: NextRequest) {
	try {
		const coupons = await prisma.coupon?.findMany({
			orderBy: { createdAt: "desc" },
		});
		const result: CouponApi[] = (coupons || []).map((coupon) => ({
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
		}));
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch coupons" },
			{ status: 500 }
		);
	}
}

// POST /api/coupon
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			name,
			date,
			discount,
			userLimit,
			timeUsed,
			validity,
			status,
		} = body as Omit<CouponApi, "id" | "createdAt" | "updatedAt">;

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

		const coupon = await prisma.coupon?.create({
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
		if (!coupon) {
			return NextResponse.json(
				{ error: "Failed to create coupon" },
				{ status: 500 }
			);
		}
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
			{ error: "Failed to create coupon" },
			{ status: 500 }
		);
	}
}
