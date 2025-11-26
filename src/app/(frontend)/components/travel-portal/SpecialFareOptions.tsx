"use client";

interface SpecialFareOptionsProps {
	selectedFare: string;
	onFareChange: (fare: string) => void;
}

export default function SpecialFareOptions({
	selectedFare,
	onFareChange,
}: SpecialFareOptionsProps) {
	const fares = [
		{ name: "Regular", discount: "Regular fares" },
		{ name: "Student", discount: "Extra discounts/baggage" },
		{ name: "Armed Forces", discount: "Up to ₹ 600 off" },
		{ name: "Senior Citizen", discount: "Up to ₹ 600 off" },
		{ name: "Doctor and Nurses", discount: "Up to ₹ 600 off" },
	];

	return (
		<div className="space-y-3">
			<h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
				SPECIAL FARES
			</h3>
			<div className="flex flex-wrap gap-3">
				{fares.map((fare) => (
					<button
						key={fare.name}
						onClick={() => onFareChange(fare.name)}
						className={`px-4 py-2 border rounded-lg text-xs transition-all ${
							selectedFare === fare.name
								? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
								: "border-gray-200 hover:border-gray-300 text-gray-700"
						}`}
					>
						<div className="font-medium">{fare.name}</div>
						<div className="text-[10px] text-gray-500">{fare.discount}</div>
					</button>
				))}
			</div>
		</div>
	);
}
