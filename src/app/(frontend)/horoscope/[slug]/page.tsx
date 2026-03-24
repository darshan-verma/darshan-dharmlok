import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProkeralaServiceSidebar } from "@/components/horoscope/ProkeralaServiceSidebar";
import {
	getAllServiceSlugs,
	getServiceBySlug,
} from "@/data/prokerala-service-catalog";
import { Button } from "@/components/ui/button";
import { DailyHoroscopeForm } from "@/components/horoscope/DailyHoroscopeForm";
import { DailyLoveHoroscopeForm } from "@/components/horoscope/DailyLoveHoroscopeForm";
import { NumerologyCalculatorForm } from "@/components/horoscope/NumerologyCalculatorForm";
import { DailyPanchangCalculatorForm } from "@/components/horoscope/DailyPanchangCalculatorForm";
import { CalendarCalculatorForm } from "@/components/horoscope/CalendarCalculatorForm";
import { PdfReportForm } from "@/components/horoscope/PdfReportForm";
import { HoroscopeCalculatorsRouter } from "@/components/horoscope/calculations";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
	return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const found = getServiceBySlug(slug);
	if (!found) return { title: "Service" };
	return {
		title: `${found.service.label} | Horoscope`,
		description: found.service.description,
	};
}

type PageProps = {
	params: Promise<{ slug: string }>;
};

export default async function HoroscopeServicePage({ params }: PageProps) {
	const { slug } = await params;
	const found = getServiceBySlug(slug);
	if (!found) notFound();

	const { service, section } = found;

	const isPanchangSection = section.id === "panchang";
	const isCalendar = slug === "calendar";
	const showPanchangCalculator =
		isPanchangSection && !isCalendar && service.apiPath != null;
	const showCalendarCalculator = isPanchangSection && isCalendar;

	return (
		<div className="min-h-screen w-full bg-background">
			<Header />

			<div className="border-b border-border/40 bg-muted/30 py-4">
				<div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:pl-2 lg:pr-6">
					<Button variant="ghost" size="sm" asChild className="gap-2">
						<Link href="/horoscope">
							<ArrowLeft className="h-4 w-4" />
							Back to Horoscope
						</Link>
					</Button>
				</div>
			</div>

			<div className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-4 md:py-12 lg:pl-2 lg:pr-6">
				<div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start lg:gap-6 xl:gap-8">
					<ProkeralaServiceSidebar currentSlug={slug} />

					<main className="min-w-0 flex-1 lg:pl-0">
						<p className="text-sm font-medium text-orange-700 dark:text-orange-400">
							{section.title}
						</p>
						<h1
							className={
								isPanchangSection
									? "sr-only"
									: "mt-2 font-serif text-3xl font-bold tracking-tight md:text-4xl"
							}
						>
							{service.label}
						</h1>
						<p className="mt-4 text-lg text-muted-foreground">
							{service.description}
						</p>

						{showCalendarCalculator ? (
							<div className="mt-8">
								<CalendarCalculatorForm title={service.label} />
							</div>
						) : showPanchangCalculator ? (
							<div className="mt-8">
								<DailyPanchangCalculatorForm
									title={service.label}
									slug={slug}
									apiPath={service.apiPath!}
									defaultLanguage={service.defaultLanguage}
								/>
							</div>
						) : slug === "numerology" ? (
							<div className="mt-8">
								<NumerologyCalculatorForm />
							</div>
						) : slug === "daily-horoscope" ? (
							<div className="mt-8">
								<DailyHoroscopeForm />
							</div>
						) : slug === "daily-love-horoscope" ? (
							<div className="mt-8">
								<DailyLoveHoroscopeForm />
							</div>
						) : slug === "pdf-report" ? (
							<div className="mt-8">
								<PdfReportForm />
							</div>
						) : section.id === "horoscope-calculators" || section.id === "marriage" || section.id === "western" ? (
							<HoroscopeCalculatorsRouter slug={slug} title={service.label} />
						) : isPanchangSection ? (
							<div className="mt-8 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-8 text-center dark:border-orange-800 dark:bg-orange-950/25">
								<p className="font-medium text-foreground">
									Calculator unavailable
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									This service is missing API configuration.
								</p>
							</div>
						) : (
							<div className="mt-8 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-8 text-center dark:border-orange-800 dark:bg-orange-950/25">
								<p className="font-medium text-foreground">
									Calculator UI coming next
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									This page will host inputs and results for this ProKerala API
									proxy.
								</p>
								{service.apiPath && (
									<p className="mt-4 font-mono text-xs text-muted-foreground break-all">
										API: /api/prokerala/{service.apiPath}
									</p>
								)}
								{service.defaultLanguage && (
									<p className="mt-2 text-xs text-muted-foreground">
										Default language hint: {service.defaultLanguage}
									</p>
								)}
							</div>
						)}
					</main>
				</div>
			</div>

			<Footer />
		</div>
	);
}
