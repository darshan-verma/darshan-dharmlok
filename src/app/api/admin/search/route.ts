import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTranslation } from "@/lib/content-lang";
import { buildTranslationSearchOr } from "@/lib/translation-search";
import { rawFindCollection } from "@/lib/content-api";

export async function GET(req: NextRequest) {
	const q = req.nextUrl.searchParams.get("q")?.trim();
	if (!q || q.length < 2) {
		return NextResponse.json({ results: [] });
	}

	try {
		const [users, products, temples, dharamshalas, events, bookings, blogs, ebooks, playlists, yogaSessions] =
			await Promise.all([
				prisma.user.findMany({
					where: {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ email: { contains: q, mode: "insensitive" } },
							{ phone: { contains: q } },
							{ userType: { contains: q, mode: "insensitive" } },
						],
					},
					select: { id: true, name: true, email: true, userType: true, profileImageUrl: true },
					take: 5,
				}),
				prisma.product.findMany({
					where: {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ description: { contains: q, mode: "insensitive" } },
						],
					},
					select: { id: true, name: true, pricePerUnit: true, images: true, status: true },
					take: 5,
				}),
				rawFindCollection({
					collection: "Temple",
					filter: {
						$or: [
							...buildTranslationSearchOr("temple", q),
							{ city: { $regex: q, $options: "i" } },
							{ state: { $regex: q, $options: "i" } },
						],
					},
					limit: 5,
				}),
				rawFindCollection({
					collection: "Dharamshala",
					filter: {
						$or: [
							...buildTranslationSearchOr("dharamshala", q),
							{ city: { $regex: q, $options: "i" } },
							{ state: { $regex: q, $options: "i" } },
						],
					},
					limit: 5,
				}),
				rawFindCollection({
					collection: "Event",
					filter: { $or: buildTranslationSearchOr("event", q) },
					limit: 5,
				}),
				prisma.booking.findMany({
					where: {
						OR: [
							{ notes: { contains: q, mode: "insensitive" } },
							{ status: { contains: q, mode: "insensitive" } },
							{ user: { name: { contains: q, mode: "insensitive" } } },
							{ teacher: { name: { contains: q, mode: "insensitive" } } },
						],
					},
					select: {
						id: true,
						price: true,
						status: true,
						scheduledAt: true,
						user: { select: { name: true } },
						teacher: { select: { name: true, userType: true } },
					},
					take: 5,
					orderBy: { createdAt: "desc" },
				}),
				rawFindCollection({
					collection: "Blog",
					filter: { $or: buildTranslationSearchOr("blog", q) },
					limit: 5,
				}),
				prisma.eBook.findMany({
					where: {
						OR: [
							{ title: { contains: q, mode: "insensitive" } },
							{ category: { contains: q, mode: "insensitive" } },
						],
					},
					select: { id: true, title: true, category: true },
					take: 5,
				}),
				prisma.playlist.findMany({
					where: {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ category: { contains: q, mode: "insensitive" } },
						],
					},
					select: { id: true, name: true, category: true },
					take: 5,
				}),
				prisma.yogaSession.findMany({
					where: {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ serviceType: { contains: q, mode: "insensitive" } },
						],
					},
					select: { id: true, name: true, serviceType: true, status: true },
					take: 5,
				}),
			]);

		const results: {
			category: string;
			id: string;
			title: string;
			subtitle: string;
			href: string;
			icon: string;
		}[] = [];

		for (const u of users) {
			results.push({
				category: "Users",
				id: u.id,
				title: u.name,
				subtitle: `${u.userType || "User"} · ${u.email}`,
				href: `/admin/users/${u.id}`,
				icon: "user",
			});
		}

		for (const p of products) {
			results.push({
				category: "Products",
				id: p.id,
				title: p.name,
				subtitle: `₹${p.pricePerUnit} · ${p.status}`,
				href: `/admin/e-shop/${p.id}`,
				icon: "product",
			});
		}

		for (const t of temples) {
			const name = getTranslation(t, "en", "name");
			results.push({
				category: "Temples",
				id: String(t.id),
				title: name,
				subtitle: `${t.city}, ${t.state}`,
				href: `/admin/temple/${t.id}`,
				icon: "temple",
			});
		}

		for (const d of dharamshalas) {
			const name = getTranslation(d, "en", "name");
			results.push({
				category: "Dharamshalas",
				id: String(d.id),
				title: name,
				subtitle: `${d.city}, ${d.state}`,
				href: `/admin/dharamshala/${d.id}`,
				icon: "dharamshala",
			});
		}

		for (const e of events) {
			const title = getTranslation(e, "en", "title");
			const place = getTranslation(e, "en", "place");
			results.push({
				category: "Events",
				id: String(e.id),
				title,
				subtitle: `${e.category} · ${place || ""}`.trim(),
				href: `/admin/events/${e.id}`,
				icon: "event",
			});
		}

		for (const b of bookings) {
			results.push({
				category: "Bookings",
				id: b.id,
				title: `${b.user?.name || "Unknown"} → ${b.teacher?.name || "Unknown"}`,
				subtitle: `₹${b.price} · ${b.status} · ${b.teacher?.userType || "Booking"}`,
				href: `/admin/bookings/${b.id}/audit`,
				icon: "booking",
			});
		}

		for (const bl of blogs) {
			results.push({
				category: "Blogs",
				id: String(bl.id),
				title: getTranslation(bl, "en", "title"),
				subtitle: String(bl.status || ""),
				href: `/admin/blogs`,
				icon: "blog",
			});
		}

		for (const eb of ebooks) {
			results.push({
				category: "E-Books",
				id: eb.id,
				title: eb.title,
				subtitle: eb.category,
				href: `/admin/ebook/${eb.id}`,
				icon: "ebook",
			});
		}

		for (const pl of playlists) {
			results.push({
				category: "Audio Library",
				id: pl.id,
				title: pl.name,
				subtitle: pl.category,
				href: `/admin/audio-library/${pl.id}`,
				icon: "audio",
			});
		}

		for (const ys of yogaSessions) {
			results.push({
				category: "Yoga Sessions",
				id: ys.id,
				title: ys.name,
				subtitle: `${ys.serviceType} · ${ys.status}`,
				href: `/admin/book-yoga/${ys.id}`,
				icon: "yoga",
			});
		}

		return NextResponse.json({ results });
	} catch (error) {
		console.error("Admin search error:", error);
		return NextResponse.json({ error: "Search failed" }, { status: 500 });
	}
}
