"use client";

interface SearchButtonProps {
	onSearch: () => void;
}

export default function SearchButton({ onSearch }: SearchButtonProps) {
	return (
		<div className="flex justify-center pt-4">
			<button
				onClick={onSearch}
				className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base uppercase rounded-full px-12 py-4 shadow-lg hover:shadow-xl transition-all duration-200 tracking-wide"
			>
				SEARCH
			</button>
		</div>
	);
}
