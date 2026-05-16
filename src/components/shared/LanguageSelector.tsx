"use client";

import { Globe } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
	const { locale, setLocale, t } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700",
						className,
					)}
					aria-label={t("lang.selectLanguage")}
				>
					<Globe className="w-5 h-5" />
					<span className="hidden sm:inline text-xs font-medium uppercase">
						{locale === "hi" ? "हि" : "EN"}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[140px]">
				{LOCALES.map((item) => (
					<DropdownMenuItem
						key={item.code}
						onClick={() => setLocale(item.code as Locale)}
						className={cn(
							"cursor-pointer",
							locale === item.code && "bg-orange-50 text-orange-600 font-medium",
						)}
					>
						{item.nativeLabel}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
