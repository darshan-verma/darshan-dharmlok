"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchablePages, categories } from "@/lib/searchable-pages";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";

interface SearchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children?: React.ReactNode;
}

export function SearchDialog({
	open,
	onOpenChange,
	children,
}: SearchDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const router = useRouter();

	// Configure Fuse.js for fuzzy search
	const fuse = useMemo(
		() =>
			new Fuse(searchablePages, {
				keys: [
					{ name: "title", weight: 2 },
					{ name: "description", weight: 1 },
					{ name: "keywords", weight: 1.5 },
					{ name: "category", weight: 0.5 },
				],
				threshold: 0.4, // Lower = more strict matching
				includeScore: true,
				minMatchCharLength: 2,
				ignoreLocation: true,
			}),
		[],
	);

	// Perform fuzzy search
	const searchResults = useMemo(() => {
		if (!searchQuery.trim()) {
			// If no search query, show all pages filtered by category
			const filtered =
				selectedCategory === "All"
					? searchablePages
					: searchablePages.filter(
							(page) => page.category === selectedCategory,
						);
			return filtered;
		}

		// Perform fuzzy search
		const results = fuse.search(searchQuery);
		const pages = results.map((result) => result.item);

		// Filter by category if not "All"
		if (selectedCategory !== "All") {
			return pages.filter((page) => page.category === selectedCategory);
		}

		return pages;
	}, [searchQuery, selectedCategory, fuse]);

	// Reset search when dialog closes
	useEffect(() => {
		if (!open) {
			setSearchQuery("");
			setSelectedCategory("All");
		}
	}, [open]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Open search with Cmd/Ctrl + K
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				onOpenChange(!open);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	const handleNavigate = (href: string) => {
		onOpenChange(false);
		router.push(href);
	};

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				className="w-[420px] p-0 mr-4 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl"
				align="end"
				sideOffset={8}
				style={{
					backdropFilter: "blur(40px) saturate(180%)",
					WebkitBackdropFilter: "blur(40px) saturate(180%)",
				}}
			>
				<div className="px-4 pt-4 pb-3 border-b border-white/30">
					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
						<Input
							type="text"
							placeholder="Search pages..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="border-0 focus-visible:ring-0 text-sm px-0 h-auto py-0 bg-transparent"
							autoFocus
						/>
						<button
							onClick={() => onOpenChange(false)}
							className="p-1 hover:bg-white/50 rounded-full transition-colors flex-shrink-0"
						>
							<X className="w-4 h-4 text-gray-500" />
						</button>
					</div>
				</div>

				{/* Category Filters */}
				<div className="px-4 py-2 border-b border-white/30 bg-white/20 overflow-x-auto">
					<div className="flex gap-1.5 min-w-max">
						{categories.map((category) => (
							<Badge
								key={category}
								variant={selectedCategory === category ? "default" : "outline"}
								className={`cursor-pointer transition-colors text-xs ${
									selectedCategory === category
										? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
										: "hover:bg-white/50 border-white/40"
								}`}
								onClick={() => setSelectedCategory(category)}
							>
								{category}
							</Badge>
						))}
					</div>
				</div>

				{/* Search Results */}
				<div className="overflow-y-auto max-h-[50vh] px-4 py-3">
					{searchResults.length === 0 ? (
						<div className="text-center py-8">
							<Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
							<p className="text-gray-600 text-sm font-medium">
								No results found
							</p>
							<p className="text-gray-500 text-xs mt-1">
								Try adjusting your search
							</p>
						</div>
					) : (
						<div className="space-y-1.5">
							{searchResults.map((page, index) => (
								<button
									key={`${page.href}-${index}`}
									onClick={() => handleNavigate(page.href)}
									className="w-full text-left p-3 rounded-lg hover:bg-white/50 transition-colors group border border-transparent hover:border-orange-200/50"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<h3 className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
													{page.title}
												</h3>
												<Badge
													variant="secondary"
													className="text-[10px] px-1.5 py-0"
												>
													{page.category}
												</Badge>
											</div>
											<p className="text-xs text-gray-600 line-clamp-1">
												{page.description}
											</p>
										</div>
										<ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5" />
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-4 py-2 border-t border-white/30 bg-white/20">
					<div className="flex items-center justify-between text-xs text-gray-600">
						<span className="text-[11px]">
							{searchResults.length}{" "}
							{searchResults.length === 1 ? "result" : "results"}
						</span>
						<div className="flex items-center gap-1.5">
							<kbd className="px-1.5 py-0.5 bg-white/50 border border-white/40 rounded text-[10px]">
								Esc
							</kbd>
							<span className="text-[11px]">Close</span>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
