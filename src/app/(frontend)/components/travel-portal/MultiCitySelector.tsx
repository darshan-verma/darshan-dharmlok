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
			leg.id === id ? { ...leg, ...updates } : leg,
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
				<div
					key={leg.id}
					className="relative bg-white rounded-xl border border-gray-200 p-4"
				>
					<div className="flex flex-col lg:flex-row items-stretch gap-4">
						{/* City Pair */}
						<div className="flex-1 min-w-0">
							<FromToSelector
								from={leg.from}
								to={leg.to}
								onSwap={() => swapCities(leg.id)}
								onFromChange={(city) => updateLeg(leg.id, { from: city })}
								onToChange={(city) => updateLeg(leg.id, { to: city })}
								compact={true}
							/>
						</div>

						{/* Separator for mobile */}
						<div className="h-px w-full bg-gray-100 lg:hidden"></div>
						{/* Separator for desktop */}
						<div className="hidden lg:block w-px bg-gray-100 h-auto self-stretch"></div>

						{/* Date Selector */}
						<div className="lg:w-[200px] flex-shrink-0 relative group">
							<Popover
								open={openPopoverId === leg.id}
								onOpenChange={(open) => setOpenPopoverId(open ? leg.id : null)}
							>
								<PopoverTrigger asChild>
									<button className="w-full h-full bg-transparent hover:bg-gray-50 rounded-lg px-4 py-3 text-left transition-colors flex flex-col justify-center min-h-[80px]">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
												Departure
											</span>
											<span className="text-[10px] text-gray-400">
												Leg {index + 1}
											</span>
										</div>
										{leg.date ? (
											<div>
												<div className="flex items-baseline gap-1.5">
													<span className="text-lg font-bold text-slate-900">
														{format(leg.date, "dd")}
													</span>
													<span className="text-sm font-semibold text-slate-600">
														{format(leg.date, "MMM''yy")}
													</span>
												</div>
												<span className="text-[10px] text-gray-400 font-medium uppercase mt-0.5 block">
													{format(leg.date, "EEEE")}
												</span>
											</div>
										) : (
											<span className="text-sm font-semibold text-gray-400 mt-1 block">
												Select Date
											</span>
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
										disabled={(date) => {
											const prevLeg = index > 0 ? legs[index - 1] : null;
											const minDate = prevLeg?.date || new Date();
											return date < minDate;
										}}
										modifiers={{
											previousDepartureDay:
												index > 0 && legs[index - 1]?.date
													? [legs[index - 1].date]
													: [],
										}}
										modifiersClassNames={{
											previousDepartureDay:
												"bg-green-100 text-green-800 font-semibold ring-2 ring-green-400 ring-offset-2",
										}}
										initialFocus
									/>
									{index > 0 && legs[index - 1]?.date && (
										<div className="px-3 pb-3 pt-2 text-xs text-gray-600 border-t">
											<span className="font-semibold">
												Previous Leg {index}:{" "}
											</span>
											<span className="text-green-700">
												{format(legs[index - 1].date!, "dd MMM yyyy, EEEE")}
											</span>
										</div>
									)}
								</PopoverContent>
							</Popover>

							{/* Remove Button (Absolute positioned to top-right of the date block) */}
							{index >= 2 && (
								<button
									onClick={() => removeLeg(leg.id)}
									className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
									title="Remove Flight"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
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
