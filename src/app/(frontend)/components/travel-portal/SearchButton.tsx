"use client";

import { Loader2 } from "lucide-react";

interface SearchButtonProps {
	onSearch: () => void;
	loading?: boolean;
	disabled?: boolean;
}

export default function SearchButton({
	onSearch,
	loading = false,
	disabled = false,
}: SearchButtonProps) {
	return (
		<div className="flex justify-center pt-4">
			<button
				onClick={onSearch}
				disabled={disabled || loading}
				className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base uppercase rounded-full px-12 py-4 shadow-lg hover:shadow-xl transition-all duration-200 tracking-wide ${
					loading || disabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
			>
				{loading ? (
					<div className="flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>SEARCHING...</span>
					</div>
				) : (
					"SEARCH"
				)}
			</button>
		</div>
	);
}
