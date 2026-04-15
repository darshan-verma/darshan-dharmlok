import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			queryType = "cruise",
			contactName,
			email,
			phone,
			preferredRegion,
			departurePort,
			travelMonth,
			passengers,
			cabinPreference,
			message,
		} = body as Record<string, unknown>;

		if (
			typeof contactName !== "string" ||
			!contactName.trim() ||
			typeof email !== "string" ||
			!email.trim()
		) {
			return NextResponse.json(
				{ error: "Name and email are required" },
				{ status: 400 },
			);
		}

		const session = await getServerSession(authOptions);
		const userId =
			session?.user?.id &&
			typeof session.user.id === "string" &&
			session.user.id.length > 0
				? session.user.id
				: undefined;

		const pax =
			typeof passengers === "number" && Number.isFinite(passengers) && passengers > 0
				? Math.min(Math.floor(passengers), 50)
				: 1;

		const created = await prisma.travelPortalQuery.create({
			data: {
				queryType: typeof queryType === "string" ? queryType : "cruise",
				userId: userId ?? null,
				contactName: contactName.trim(),
				email: email.trim().toLowerCase(),
				phone:
					typeof phone === "string" && phone.trim() ? phone.trim() : null,
				preferredRegion:
					typeof preferredRegion === "string" && preferredRegion.trim()
						? preferredRegion.trim()
						: null,
				departurePort:
					typeof departurePort === "string" && departurePort.trim()
						? departurePort.trim()
						: null,
				travelMonth:
					typeof travelMonth === "string" && travelMonth.trim()
						? travelMonth.trim()
						: null,
				passengers: pax,
				cabinPreference:
					typeof cabinPreference === "string" && cabinPreference.trim()
						? cabinPreference.trim()
						: null,
				message:
					typeof message === "string" && message.trim() ? message.trim() : null,
			},
		});

		return NextResponse.json({
			id: created.id,
			ok: true,
		});
	} catch (error) {
		console.error("travel-portal query POST:", error);
		return NextResponse.json(
			{ error: "Failed to submit inquiry" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.role || session.user.role.toLowerCase() !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const rows = await prisma.travelPortalQuery.findMany({
			orderBy: { createdAt: "desc" },
			take: 200,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						userType: true,
					},
				},
			},
		});

		return NextResponse.json({ queries: rows });
	} catch (error) {
		console.error("travel-portal query GET:", error);
		return NextResponse.json(
			{ error: "Failed to load queries" },
			{ status: 500 },
		);
	}
}
