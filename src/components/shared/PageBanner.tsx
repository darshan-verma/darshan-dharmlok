"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const DEFAULT_FALLBACK_IMAGE = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
const ERROR_FALLBACK_IMAGE = "/landing-page/amritsar-6184343.jpg";

interface BannerData {
	id: string;
	title: string;
	description: string;
	imageUrl?: string;
}

interface PageBannerProps {
	/** Page slug used to fetch banner from API (e.g. "blogs", "e-shop") */
	pageSlug: string;
	/** Main heading shown on the banner */
	title: string;
	/** Optional subtitle. If not provided and banner has description, banner description is used */
	description?: string;
	/** Alt text for the banner image */
	alt?: string;
	/** Optional class for the section */
	className?: string;
	/** Optional class for the title */
	titleClassName?: string;
	/** Optional class for the description */
	descriptionClassName?: string;
}

export function PageBanner({
	pageSlug,
	title,
	description: descriptionProp,
	alt,
	className = "",
	titleClassName = "text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl",
	descriptionClassName = "text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light",
}: PageBannerProps) {
	const [banner, setBanner] = useState<BannerData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		const fetchBanner = async () => {
			try {
				const res = await fetch(`/api/banner?pageSlug=${encodeURIComponent(pageSlug)}`);
				if (!res.ok || cancelled) return;
				const data = await res.json();
				if (cancelled) return;
				// API returns active banner for this pageSlug when found
				if (data.banner) {
					setBanner({
						id: data.banner.id,
						title: data.banner.title,
						description: data.banner.description ?? "",
						imageUrl: data.banner.imageUrl,
					});
				}
			} catch {
				if (!cancelled) setBanner(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchBanner();
		return () => {
			cancelled = true;
		};
	}, [pageSlug]);

	const imageUrl =
		banner?.imageUrl?.trim() ? banner.imageUrl : DEFAULT_FALLBACK_IMAGE;
	// Use banner title/description when set in admin; otherwise fall back to page defaults
	const displayTitle =
		banner?.title?.trim() ? banner.title : title;
	const displayDescription =
		banner?.description?.trim()
			? banner.description
			: descriptionProp ?? undefined;

	return (
		<section
			className={`relative w-full h-[500px] md:h-[600px] overflow-hidden ${className}`}
		>
			<div className="absolute inset-0">
				{loading ? (
					<div className="absolute inset-0 bg-muted animate-pulse" />
				) : (
					<Image
						src={imageUrl}
						alt={alt ?? `${displayTitle} Banner`}
						fill
						className="object-cover"
						priority
						sizes="100vw"
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							if (target.src !== ERROR_FALLBACK_IMAGE) {
								target.src = ERROR_FALLBACK_IMAGE;
							}
						}}
					/>
				)}
				<div className="absolute inset-0 bg-black/40" />
			</div>

			<div className="relative z-10 h-full flex items-center justify-center">
				<div className="container mx-auto px-4 text-center">
					<h1 className={titleClassName}>{displayTitle}</h1>
					{displayDescription && (
						<p
							className={descriptionClassName}
							style={{ fontFamily: "var(--font-jost), sans-serif" }}
						>
							{displayDescription}
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
