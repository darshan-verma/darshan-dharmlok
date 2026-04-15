"use client";

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
		<button
			onClick={onSearch}
			disabled={disabled || loading}
			className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm uppercase rounded-full px-8 py-2 h-12 my-auto min-w-[170px] shadow-lg hover:shadow-xl transition-all duration-200 tracking-wide flex justify-center items-center ${
				loading || disabled ? "opacity-50 cursor-not-allowed" : ""
			}`}
		>
			{loading ? <span>SEARCHING...</span> : "SEARCH"}
		</button>
	);
}
