"use client";
import { useState, useEffect } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Minus, Plus } from "lucide-react";

export interface TravellerCount {
	adults: number;
	children: number;
	infants: number;
}

interface TravellerSelectorProps {
	travellers: TravellerCount | number;
	travelClass: string;
	transportType?: string;
	onTravellersChange: (count: TravellerCount) => void;
	onClassChange: (classType: string) => void;
	/** TBO allows max 9 passengers (adults + children + infants). */
	maxPassengers?: number;
}

export default function TravellerSelector({
	travellers,
	travelClass,
	transportType,
	onTravellersChange,
	onClassChange,
	maxPassengers,
}: TravellerSelectorProps) {
	const [open, setOpen] = useState(false);

	// Initialize state based on props
	const getInitialState = () => {
		if (typeof travellers === "number") {
			return {
				adults: Math.max(1, travellers),
				children: 0,
				infants: 0,
			};
		}
		return {
			adults: travellers.adults || 1,
			children: travellers.children || 0,
			infants: travellers.infants || 0,
		};
	};

	const [adults, setAdults] = useState(getInitialState().adults);
	const [children, setChildren] = useState(getInitialState().children);
	const [infants, setInfants] = useState(getInitialState().infants);

	useEffect(() => {
		if (typeof travellers === "number") {
			setAdults(Math.max(1, travellers));
			setChildren(0);
			setInfants(0);
		} else {
			setAdults(travellers.adults);
			setChildren(travellers.children);
			setInfants(travellers.infants);
		}
	}, [travellers]);

	const totalTravellers = adults + children + infants;
	const atMaxPassengers =
		maxPassengers != null && totalTravellers >= maxPassengers;

	const canAddTraveller = () =>
		maxPassengers == null || totalTravellers < maxPassengers;

	const emitCounts = (
		nextAdults: number,
		nextChildren: number,
		nextInfants: number,
	) => {
		setAdults(nextAdults);
		setChildren(nextChildren);
		setInfants(nextInfants);
		onTravellersChange({
			adults: nextAdults,
			children: nextChildren,
			infants: nextInfants,
		});
	};

	// Default classes for air, bus, road etc.
	const defaultClasses = ["Economy", "Premium Economy", "Business"];

	// Train-specific classes as requested
	const trainClasses = [
		"All classes",
		"Sleeper",
		"Third AC",
		"Second AC",
		"First AC",
		"Second Seating",
		"Vistadome AC",
		"AC Chair Car",
		"First Class",
		"Third AC Economy",
	];

	const classes = transportType === "train" ? trainClasses : defaultClasses;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left w-full h-full">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-xs text-gray-500 mb-1 uppercase">
								Travellers & Class
							</div>
							<div className="text-lg font-bold text-gray-900">
								{totalTravellers} Traveller{totalTravellers > 1 ? "s" : ""}
							</div>
							<div className="text-xs text-gray-600">{travelClass}</div>
						</div>
						<ChevronDown className="h-5 w-5 text-gray-400" />
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<div className="p-4 space-y-4">
					{/* Adults */}
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-900">Adults</div>
							<div className="text-xs text-gray-500">(12+ years)</div>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => {
									const nextAdults = Math.max(1, adults - 1);
									const nextInfants = Math.min(infants, nextAdults);
									emitCounts(nextAdults, children, nextInfants);
								}}
								disabled={adults <= 1}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Minus className="h-4 w-4" />
							</button>
							<span className="w-6 text-center font-semibold">{adults}</span>
							<button
								onClick={() => {
									if (canAddTraveller()) emitCounts(adults + 1, children, infants);
								}}
								disabled={atMaxPassengers}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Children */}
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-900">Children</div>
							<div className="text-xs text-gray-500">(2-12 years)</div>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => {
									emitCounts(adults, Math.max(0, children - 1), infants);
								}}
								disabled={children <= 0}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Minus className="h-4 w-4" />
							</button>
							<span className="w-6 text-center font-semibold">{children}</span>
							<button
								onClick={() => {
									if (canAddTraveller()) emitCounts(adults, children + 1, infants);
								}}
								disabled={atMaxPassengers}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Infants */}
					<div className="flex items-center justify-between pb-4 border-b border-gray-200">
						<div>
							<div className="text-sm font-medium text-gray-900">Infants</div>
							<div className="text-xs text-gray-500">(Under 2 years)</div>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => {
									emitCounts(adults, children, Math.max(0, infants - 1));
								}}
								disabled={infants <= 0}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Minus className="h-4 w-4" />
							</button>
							<span className="w-6 text-center font-semibold">{infants}</span>
							<button
								onClick={() => {
									if (canAddTraveller() && infants < adults) {
										emitCounts(adults, children, infants + 1);
									}
								}}
								disabled={atMaxPassengers || infants >= adults}
								className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Class Selection */}
					<div>
						<div className="text-sm font-medium text-gray-900 mb-2">
							Choose Travel Class
						</div>
						<div className="grid grid-cols-1 gap-2">
							{classes.map((cls) => (
								<button
									key={cls}
									onClick={() => onClassChange(cls)}
									className={`p-2 border rounded text-sm text-left transition-colors ${
										travelClass === cls
											? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									{cls}
								</button>
							))}
						</div>
					</div>

					{maxPassengers != null && (
						<p className="text-xs text-gray-500">
							Maximum {maxPassengers} passengers (TBO limit)
						</p>
					)}

					{/* Done — counts are applied live on each change */}
					<button
						onClick={() => setOpen(false)}
						className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
					>
						DONE
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
