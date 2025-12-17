"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import FromToSelector from "./FromToSelector";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface City {
	city: string;
	airport: string;
	code: string;
}

interface CityLeg {
	id: string;
	from: City;
	to: City;
	date?: Date;
}

interface MultiCitySelectorProps {
	legs: CityLeg[];
	onLegsChange: (legs: CityLeg[]) => void;
}

export default function MultiCitySelector({
	legs,
	onLegsChange,
}: MultiCitySelectorProps) {
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

	const addLeg = () => {
		const lastLeg = legs[legs.length - 1];
		const newLeg: CityLeg = {
			id: `leg-${Date.now()}`,
			from: lastLeg.to, // Start from where the last leg ended
			to: { city: "", airport: "", code: "" },
			date: undefined,
		};
		onLegsChange([...legs, newLeg]);
	};

	const removeLeg = (id: string) => {
		if (legs.length > 2) {
			onLegsChange(legs.filter((leg) => leg.id !== id));
		}
	};

	const updateLeg = (id: string, updates: Partial<CityLeg>) => {
		const updatedLegs = legs.map((leg) =>
			leg.id === id ? { ...leg, ...updates } : leg
		);

		// If destination (to) was updated, update the next leg's origin (from)
		if (updates.to) {
			const currentIndex = updatedLegs.findIndex((leg) => leg.id === id);
			if (currentIndex >= 0 && currentIndex < updatedLegs.length - 1) {
				updatedLegs[currentIndex + 1] = {
					...updatedLegs[currentIndex + 1],
					from: updates.to,
				};
			}
		}

		onLegsChange(updatedLegs);
	};

	const swapCities = (id: string) => {
		const leg = legs.find((l) => l.id === id);
		if (leg) {
			updateLeg(id, { from: leg.to, to: leg.from });
		}
	};

	return (
		<div className="space-y-4">
			{legs.map((leg, index) => (
				<div key={leg.id} className="space-y-3">
					{/* City Pair */}
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-xs font-semibold text-gray-500 uppercase">
									Flight {index + 1}
								</span>
								{index >= 2 && (
									<button
										onClick={() => removeLeg(leg.id)}
										className="text-gray-400 hover:text-red-500 transition-colors"
										aria-label="Remove flight"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
							<FromToSelector
								from={leg.from}
								to={leg.to}
								onSwap={() => swapCities(leg.id)}
								onFromChange={(city) => updateLeg(leg.id, { from: city })}
								onToChange={(city) => updateLeg(leg.id, { to: city })}
							/>
						</div>
					</div>

					{/* Date Selector */}
					<div className="w-full lg:w-1/2">
						<Popover
							open={openPopoverId === leg.id}
							onOpenChange={(open) => setOpenPopoverId(open ? leg.id : null)}
						>
							<PopoverTrigger asChild>
								<button className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors text-left">
									<div className="text-xs text-gray-500 mb-1 uppercase">
										Departure
									</div>
									{leg.date ? (
										<div className="flex flex-col">
											<div className="flex items-baseline gap-2">
												<span className="text-3xl font-bold text-blue-600">
													{format(leg.date, "dd")}
												</span>
												<span className="text-sm font-medium text-blue-600">
													{format(leg.date, "MMM''yy")}
												</span>
											</div>
											<span className="text-xs text-gray-600 mt-0.5">
												{format(leg.date, "EEEE")}
											</span>
										</div>
									) : (
										<span className="text-gray-400 text-sm">Select date</span>
									)}
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={leg.date}
									onSelect={(date) => {
										updateLeg(leg.id, { date });
										setOpenPopoverId(null);
									}}
									disabled={(date) => date < new Date()}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			))}

			{/* Add Another City Button */}
			{legs.length < 6 && (
				<button
					onClick={addLeg}
					className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
				>
					<Plus className="h-4 w-4" />
					Add Another City
				</button>
			)}
		</div>
	);
}
