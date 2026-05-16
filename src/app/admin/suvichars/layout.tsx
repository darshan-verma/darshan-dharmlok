"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "classnames";

const tabs = [
	{ href: "/admin/suvichars/texts", label: "Text Library" },
	{ href: "/admin/suvichars/frames", label: "Frame Library" },
	{ href: "/admin/suvichars/schedule", label: "Daily Scheduler" },
];

export default function SuvicharsAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Daily Suvichar</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage quote texts, frames, and the daily publishing schedule.
				</p>
			</div>
			<nav className="flex flex-wrap gap-2 border-b pb-2">
				{tabs.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"rounded-lg px-4 py-2 text-sm font-medium transition-colors",
							pathname.startsWith(tab.href)
								? "bg-orange-100 text-orange-700"
								: "text-muted-foreground hover:bg-muted",
						)}
					>
						{tab.label}
					</Link>
				))}
			</nav>
			{children}
		</div>
	);
}
