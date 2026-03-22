"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { cn } from "@/lib/utils";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PageBanner } from "@/components/shared/PageBanner";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { HoroscopeServicesSection } from "@/components/horoscope/HoroscopeServicesSection";

const PARALLAX_IMAGES = [
	{
		src: "https://images.unsplash.com/photo-1515942661900-94b3d1972591?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		alt: "Night sky with stars",
	},
	{
		src: "https://images.unsplash.com/photo-1712609934576-083090663a8f?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		alt: "Moon over clouds",
	},
	{
		src: "https://plus.unsplash.com/premium_photo-1700081736667-e763a9de88d7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGhvcm9zY29wZXxlbnwwfHwwfHx8MA%3D%3D",
		alt: "Deep space nebula",
	},
	{
		src: "https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		alt: "Milky way galaxy",
	},
	{
		src: "https://images.unsplash.com/photo-1729335312170-b96ee0f6decd?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGFzdHJvbG9neXxlbnwwfHwwfHx8MA%3D%3D",
		alt: "Mountain silhouette under stars",
	},
	{
		src: "https://images.unsplash.com/photo-1651718409494-3f1052d4164c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8a3VuZGxpfGVufDB8fDB8fHww",
		alt: "Aurora borealis",
	},
	{
		src: "https://images.unsplash.com/photo-1712425721221-776cba94652f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDN8fGJpcnRoJTIwY2hhcnR8ZW58MHx8MHx8fDA%3D",
		alt: "Starry night landscape",
	},
];

export default function HoroscopePage() {
	useEffect(() => {
		const lenis = new Lenis();
		let rafId = 0;

		function raf(time: number) {
			lenis.raf(time);
			rafId = requestAnimationFrame(raf);
		}

		rafId = requestAnimationFrame(raf);
		return () => {
			cancelAnimationFrame(rafId);
			lenis.destroy();
		};
	}, []);

	return (
		<div className="min-h-screen w-full bg-background">
			<Header />

			<PageBanner
				pageSlug="horoscope"
				title="Horoscope"
				description="Daily insights, compatibility, and Vedic guidance for your journey"
				alt="Horoscope Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl"
			/>

			<section className="relative border-y border-border/40 bg-muted/20">
				<div className="relative flex min-h-[40vh] items-center justify-center px-4 py-16">
					<div
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full",
							"bg-[radial-gradient(ellipse_at_center,rgba(120,80,40,0.12),transparent_55%)]",
							"blur-[30px]"
						)}
					/>
					<div className="relative z-10 mx-auto max-w-2xl text-center">
						<p className="font-serif text-2xl text-foreground md:text-3xl">
							Scroll to explore
						</p>
						<p className="mt-3 text-muted-foreground">
							A cinematic journey through the cosmos—then choose a reading below.
						</p>
					</div>
				</div>

				<ZoomParallax images={PARALLAX_IMAGES} />
			</section>

			<HoroscopeServicesSection />

			<Footer />
		</div>
	);
}
