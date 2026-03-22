"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROKERALA_SERVICE_CATALOG } from "@/data/prokerala-service-catalog";
import { cn } from "@/lib/utils";

function NavLinks({
	currentSlug,
	onNavigate,
	className,
}: {
	currentSlug: string;
	onNavigate?: () => void;
	className?: string;
}) {
	return (
		<nav className={cn("space-y-6", className)} aria-label="ProKerala services">
			{PROKERALA_SERVICE_CATALOG.map((section) => (
				<div key={section.id}>
					<h3 className="mb-2 text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
						{section.title}
					</h3>
					<ul className="space-y-0.5 border-l border-orange-200/80 pl-2.5 dark:border-orange-900/40">
						{section.items.map((item) => {
							const active = item.slug === currentSlug;
							return (
								<li key={item.slug}>
									<Link
										href={`/horoscope/${item.slug}`}
										onClick={onNavigate}
										className={cn(
											"block rounded-md py-1.5 pl-2 text-sm leading-snug transition-colors",
											active
												? "bg-orange-100 font-semibold text-orange-950 dark:bg-orange-950/50 dark:text-orange-50"
												: "text-foreground hover:bg-orange-50/80 hover:text-orange-900 dark:hover:bg-orange-950/30 dark:hover:text-orange-100"
										)}
										aria-current={active ? "page" : undefined}
									>
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}

export function ProkeralaServiceSidebar({ currentSlug }: { currentSlug: string }) {
	const [open, setOpen] = useState(false);

	return (
		<>
			{/* Mobile */}
			<div className="mb-6 lg:hidden">
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-full gap-2 border-orange-300 text-orange-900 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-100 dark:hover:bg-orange-950/40"
						>
							<Menu className="h-4 w-4" />
							Browse all services
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-[min(100vw,20rem)] p-0">
						<SheetHeader className="border-b px-4 py-3 text-left">
							<SheetTitle className="font-serif text-lg">Services</SheetTitle>
						</SheetHeader>
						<ScrollArea className="h-[calc(100vh-5rem)] px-4 py-4">
							<NavLinks
								currentSlug={currentSlug}
								onNavigate={() => setOpen(false)}
							/>
						</ScrollArea>
					</SheetContent>
				</Sheet>
			</div>

			{/* Desktop: wider column, hugging left gutter */}
			<aside className="hidden w-72 shrink-0 self-start lg:block">
				<div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-orange-200/90 bg-gradient-to-b from-orange-50/40 to-card p-4 text-left shadow-sm dark:border-orange-900/45 dark:from-orange-950/20 dark:to-card">
					<h2 className="mb-4 font-serif text-lg font-semibold text-orange-950 dark:text-orange-50">
						All services
					</h2>
					<NavLinks currentSlug={currentSlug} />
				</div>
			</aside>
		</>
	);
}
