"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/ui/profile-card";
import {
	PROKERALA_SERVICE_CATALOG,
	getServiceCardImageForSlug,
	type ProkeralaSectionDef,
} from "@/data/prokerala-service-catalog";
import { cn } from "@/lib/utils";

const COLLAPSE_THRESHOLD = 6;

function SectionBlock({ section }: { section: ProkeralaSectionDef }) {
	const [expanded, setExpanded] = useState(false);
	const needsToggle = section.items.length > COLLAPSE_THRESHOLD;
	const visibleItems = useMemo(() => {
		if (!needsToggle || expanded) return section.items;
		return section.items.slice(0, COLLAPSE_THRESHOLD);
	}, [section.items, needsToggle, expanded]);

	return (
		<div className="border-b border-border/60 py-10 last:border-b-0">
			<h2 className="mb-8 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
				{section.title}
			</h2>
			<div className="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-8 justify-items-center">
				{visibleItems.map((item) => (
					<Link
						key={item.slug}
						href={`/horoscope/${item.slug}`}
						className="block w-full max-w-[380px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 rounded-3xl"
					>
						<ProfileCard
							variant="dharamshala"
							name={item.label}
							description={item.description}
							image={getServiceCardImageForSlug(item.slug)}
							onBook={() => {}}
							className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
							enableAnimations={true}
						/>
					</Link>
				))}
			</div>
			{needsToggle && (
				<div className="mt-8 flex justify-center">
					<Button
						type="button"
						variant="outline"
						className="gap-2 border-orange-300 text-orange-900 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-100 dark:hover:bg-orange-950/40"
						onClick={() => setExpanded((e) => !e)}
					>
						{expanded ? (
							<>
								Show less <ChevronUp className="h-4 w-4" />
							</>
						) : (
							<>
								View all ({section.items.length}){" "}
								<ChevronDown className="h-4 w-4" />
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	);
}

export function HoroscopeServicesSection({ className }: { className?: string }) {
	return (
		<section className={cn("bg-[#f5f5f0] py-6 md:py-10", className)}>
			<div className="container mx-auto max-w-7xl px-4">
				<div className="mb-10 text-center">
					<h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
						ProKerala services
					</h2>
					<p className="mt-3 text-muted-foreground md:text-lg">
						Choose a calculator or report. More tools and forms are added
						regularly.
					</p>
				</div>
				<div className="rounded-2xl border border-border/40 bg-white/80 px-3 py-2 shadow-sm md:px-8">
					{PROKERALA_SERVICE_CATALOG.map((section) => (
						<SectionBlock key={section.id} section={section} />
					))}
				</div>
			</div>
		</section>
	);
}
