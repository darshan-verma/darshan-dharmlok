import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getMonthName(monthIndex: number): string {
	const names = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	];
	return names[monthIndex];
}

export async function GET() {
	try {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
		const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
		const startOfYear = new Date(currentYear, 0, 1);
		const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);

		const [
			totalUsers,
			newUsersThisMonth,
			newUsersPrevMonth,
			totalBookings,
			bookingsThisMonth,
			bookingsPrevMonth,
			,
			,
			reviews,
			bookingsAll,
			usersAll,
			productsSorted,
			recentBookingsRaw,
			usersByType,
			bookingsByCity,
			postsCount,
			eventsCount,
			templeCount,
			dharamshalaCount,
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
			prisma.user.count({
				where: {
					createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
				},
			}),
			prisma.booking.count(),
			prisma.booking.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
			prisma.booking.count({
				where: {
					createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
				},
			}),
			prisma.product.count(),
			prisma.review.count(),
			prisma.review.findMany({
				orderBy: { createdAt: "desc" },
				take: 500,
				select: { rating: true, title: true, comment: true, createdAt: true, userId: true },
			}),
			prisma.booking.findMany({
				where: { createdAt: { gte: startOfYear } },
				select: { createdAt: true, price: true, status: true },
			}),
			prisma.user.findMany({
				where: { createdAt: { gte: startOfYear } },
				select: { createdAt: true },
			}),
			prisma.product.findMany({
				orderBy: { createdAt: "desc" },
				take: 20,
				select: {
					id: true,
					name: true,
					pricePerUnit: true,
					availableQty: true,
					images: true,
					category: true,
				},
			}),
			prisma.booking.findMany({
				orderBy: { createdAt: "desc" },
				take: 10,
				include: {
					user: { select: { name: true } },
					teacher: { select: { name: true, userType: true } },
				},
			}),
			prisma.user.groupBy({
				by: ["userType"],
				_count: { id: true },
				where: { userType: { not: null } },
			}),
			prisma.booking.findMany({
				where: { createdAt: { gte: sixMonthsAgo } },
				include: {
					teacher: {
						select: {
							addresses: { select: { city: true }, take: 1 },
						},
					},
				},
			}),
			prisma.post.count(),
			prisma.event.count(),
			prisma.temple.count(),
			prisma.dharamshala.count(),
		]);

		// --- Revenue computation ---
		const totalRevenue = bookingsAll.reduce((sum, b) => sum + b.price, 0);
		const revenueThisMonth = bookingsAll
			.filter((b) => b.createdAt >= startOfCurrentMonth)
			.reduce((sum, b) => sum + b.price, 0);
		const revenuePrevMonth = bookingsAll
			.filter(
				(b) =>
					b.createdAt >= startOfPreviousMonth &&
					b.createdAt < startOfCurrentMonth
			)
			.reduce((sum, b) => sum + b.price, 0);
		const revenueChange =
			revenuePrevMonth > 0
				? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
				: 0;

		// --- Monthly revenue chart (last 6 months) ---
		const revenueByMonth: { name: string; value: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const mStart = new Date(currentYear, currentMonth - i, 1);
			const mEnd = new Date(currentYear, currentMonth - i + 1, 1);
			const monthRevenue = bookingsAll
				.filter((b) => b.createdAt >= mStart && b.createdAt < mEnd)
				.reduce((sum, b) => sum + b.price, 0);
			revenueByMonth.push({
				name: getMonthName(mStart.getMonth()),
				value: Math.round(monthRevenue),
			});
		}

		// --- Bookings chart (last 6 months) ---
		const bookingsByMonth: { name: string; value: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const mStart = new Date(currentYear, currentMonth - i, 1);
			const mEnd = new Date(currentYear, currentMonth - i + 1, 1);
			const count = bookingsAll.filter(
				(b) => b.createdAt >= mStart && b.createdAt < mEnd
			).length;
			bookingsByMonth.push({
				name: getMonthName(mStart.getMonth()),
				value: count,
			});
		}

		// --- New users chart (last 6 months) ---
		const newUsersByMonth: { name: string; value: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const mStart = new Date(currentYear, currentMonth - i, 1);
			const mEnd = new Date(currentYear, currentMonth - i + 1, 1);
			const count = usersAll.filter(
				(u) => u.createdAt >= mStart && u.createdAt < mEnd
			).length;
			newUsersByMonth.push({
				name: getMonthName(mStart.getMonth()),
				value: count,
			});
		}

		const usersChange =
			newUsersPrevMonth > 0
				? Math.round(
						((newUsersThisMonth - newUsersPrevMonth) / newUsersPrevMonth) * 100
				  )
				: 0;
		const bookingsChange =
			bookingsPrevMonth > 0
				? Math.round(
						((bookingsThisMonth - bookingsPrevMonth) / bookingsPrevMonth) * 100
				  )
				: 0;

		// --- Monthly bar chart (current vs previous month bookings per week-bucket) ---
		const monthlyBarData: { name: string; current: number; previous: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const mStart = new Date(currentYear, currentMonth - i, 1);
			const mEnd = new Date(currentYear, currentMonth - i + 1, 1);
			const prevMStart = new Date(currentYear, currentMonth - i - 1, 1);
			const currentCount = bookingsAll.filter(
				(b) => b.createdAt >= mStart && b.createdAt < mEnd
			).length;
			const prevCount = bookingsAll.filter(
				(b) => b.createdAt >= prevMStart && b.createdAt < mStart
			).length;
			monthlyBarData.push({
				name: getMonthName(mStart.getMonth()),
				current: currentCount,
				previous: prevCount,
			});
		}

		// --- Yearly line data (12 months) ---
		const yearlyLineData: {
			name: string;
			current: number;
			previous: number;
			target: number;
		}[] = [];
		for (let i = 0; i < 12; i++) {
			const mStart = new Date(currentYear, i, 1);
			const mEnd = new Date(currentYear, i + 1, 1);

			const currentRev = bookingsAll
				.filter((b) => b.createdAt >= mStart && b.createdAt < mEnd)
				.reduce((sum, b) => sum + b.price, 0);

			yearlyLineData.push({
				name: getMonthName(i),
				current: Math.round(currentRev),
				previous: 0,
				target: Math.round(currentRev * 1.15),
			});
		}

		// --- Bookings by location ---
		const locationMap: Record<string, number> = {};
		for (const b of bookingsByCity) {
			const city =
				b.teacher?.addresses?.[0]?.city || "Unknown";
			locationMap[city] = (locationMap[city] || 0) + 1;
		}
		const totalLocationBookings = Object.values(locationMap).reduce(
			(a, b) => a + b,
			0
		);
		const bookingsByLocation = Object.entries(locationMap)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6)
			.map(([name, count]) => ({
				name,
				percent:
					totalLocationBookings > 0
						? Math.round((count / totalLocationBookings) * 100)
						: 0,
				count,
			}));

		// --- Visitor sources (derived from user types) ---
		const visitorSourceData: Record<string, number> = {};
		for (const group of usersByType) {
			if (group.userType) {
				visitorSourceData[group.userType] = group._count.id;
			}
		}

		// --- Reviews aggregation ---
		const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
			stars,
			count: reviews.filter((r) => r.rating === stars).length,
		}));
		const averageRating =
			reviews.length > 0
				? Math.round(
						(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
							10
				  ) / 10
				: 0;
		const featuredReview = reviews.find(
			(r) => r.rating >= 4 && r.comment && r.comment.length > 20
		);

		// --- Recent bookings table ---
		const recentBookings = recentBookingsRaw.map((b, i) => ({
			id: `#${String(i + 1).padStart(4, "0")}`,
			customer: b.user?.name || "Unknown",
			avatar: (b.user?.name || "U")
				.split(" ")
				.map((w: string) => w[0])
				.join("")
				.slice(0, 2)
				.toUpperCase(),
			service: b.teacher?.userType
				? `${b.teacher.userType} Session`
				: "Booking",
			amount: `₹${b.price.toLocaleString("en-IN")}`,
			status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
		}));

		// --- Top selling products ---
		const topSellingItems = productsSorted.map((p) => ({
			product: p.name,
			image: p.images?.[0] || "",
			sold: `₹${(p.pricePerUnit * (100 - p.availableQty)).toLocaleString("en-IN")}`,
			sales: Math.max(0, 100 - p.availableQty),
		}));

		// --- Top performer (teacher with most bookings) ---
		const teacherBookingCounts: Record<string, { name: string; revenue: number }> = {};
		for (const b of bookingsAll) {
			const rb = recentBookingsRaw.find(
				(rb) => rb.createdAt.getTime() === b.createdAt.getTime()
			);
			if (rb?.teacher) {
				const tid = rb.teacherId;
				if (!teacherBookingCounts[tid]) {
					teacherBookingCounts[tid] = { name: rb.teacher.name, revenue: 0 };
				}
				teacherBookingCounts[tid].revenue += b.price;
			}
		}
		const topPerformer = Object.values(teacherBookingCounts).sort(
			(a, b) => b.revenue - a.revenue
		)[0] || { name: "N/A", revenue: 0 };

		// --- Pooja bookings & temple visits (use bookings + temple counts) ---
		const completedBookings = bookingsAll.filter(
			(b) =>
				b.status === "completed" && b.createdAt >= startOfCurrentMonth
		).length;

		const dateRange = `${startOfCurrentMonth.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})} - ${now.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})}`;

		return NextResponse.json({
			dateRange,
			topPerformer: {
				name: topPerformer.name,
				revenue: topPerformer.revenue,
			},
			stats: {
				totalRevenue,
				revenueChange,
				totalBookings,
				bookingsThisMonth,
				bookingsChange,
				totalUsers,
				newUsersThisMonth,
				usersChange,
			},
			charts: {
				revenueByMonth,
				bookingsByMonth,
				newUsersByMonth,
				monthlyBarData,
				yearlyLineData,
			},
			performance: {
				poojaBookings: completedBookings,
				templeVisits: templeCount,
				posts: postsCount,
				events: eventsCount,
				dharamshalas: dharamshalaCount,
			},
			bookingsByLocation,
			visitorSourceData,
			reviews: {
				average: averageRating,
				total: reviews.length,
				distribution: ratingDistribution,
				featured: featuredReview
					? {
							rating: featuredReview.rating,
							title: featuredReview.title || "Great Experience",
							comment: featuredReview.comment || "",
							date: featuredReview.createdAt.toLocaleDateString("en-IN", {
								month: "long",
								day: "numeric",
								year: "numeric",
							}),
					  }
					: null,
			},
			recentBookings,
			topSellingItems,
		});
	} catch (error) {
		console.error("Admin dashboard API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dashboard data" },
			{ status: 500 }
		);
	}
}
