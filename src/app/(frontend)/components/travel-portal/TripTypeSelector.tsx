"use client";

interface TripTypeSelectorProps {
	tripType: string;
	onTripTypeChange: (type: string) => void;
	align?: "left" | "center";
}

export default function TripTypeSelector({
	tripType,
	onTripTypeChange,
	align = "center",
}: TripTypeSelectorProps) {
	const options = [
		{ value: "one-way", label: "One Way" },
		{ value: "round-trip", label: "Round Trip" },
		{ value: "multi-city", label: "Multi City" },
	];

	return (
		<div
			className={`flex flex-wrap items-center gap-4 ${
				align === "center" ? "justify-center" : "justify-start"
			}`}
		>
			{options.map((option) => (
				<label
					key={option.value}
					className="flex items-center gap-2 cursor-pointer group"
				>
					<div className="relative flex items-center justify-center">
						<input
							type="radio"
							name="tripType"
							value={option.value}
							checked={tripType === option.value}
							onChange={(e) => onTripTypeChange(e.target.value)}
							className="sr-only"
						/>
						<div
							className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
								tripType === option.value
									? "border-blue-600 bg-blue-600"
									: "border-gray-400 bg-white"
							}`}
						>
							{tripType === option.value && (
								<div className="w-1.5 h-1.5 rounded-full bg-white"></div>
							)}
						</div>
					</div>
					<span
						className={`text-sm ${
							tripType === option.value
								? "text-gray-900 font-semibold"
								: "text-gray-600"
						}`}
					>
						{option.label}
					</span>
				</label>
			))}
		</div>
	);
}
