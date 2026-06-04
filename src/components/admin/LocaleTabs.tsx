"use client";

import { cn } from "@/lib/utils";
import type { ContentLang, TranslationStatus } from "@/lib/content-lang";

const STATUS_DOT: Record<TranslationStatus, string> = {
	none: "bg-orange-500",
	partial: "bg-yellow-500",
	complete: "bg-green-500",
};

export interface LocaleTabsProps {
	activeLocale: ContentLang;
	onLocaleChange: (locale: ContentLang) => void;
	translationStatus?: TranslationStatus;
	className?: string;
}

export default function LocaleTabs({
	activeLocale,
	onLocaleChange,
	translationStatus = "none",
	className,
}: LocaleTabsProps) {
	return (
		<div
			className={cn("flex gap-1 rounded-lg border bg-muted/40 p-1", className)}
			role="tablist"
			aria-label="Content language"
		>
			{(["en", "hi"] as const).map((locale) => {
				const isActive = activeLocale === locale;
				const label = locale === "en" ? "English" : "हिंदी";
				const showStatus = locale === "hi";
				return (
					<button
						key={locale}
						type="button"
						role="tab"
						aria-selected={isActive}
						className={cn(
							"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						)}
						onClick={() => onLocaleChange(locale)}
					>
						{label}
						{showStatus && (
							<span
								className={cn(
									"h-2 w-2 rounded-full",
									STATUS_DOT[translationStatus]
								)}
								title={`Hindi translation: ${translationStatus}`}
							/>
						)}
					</button>
				);
			})}
		</div>
	);
}
