"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Plane,
	Train,
	Bus,
	Car,
	CheckCircle2,
	Clock,
	TrendingUp,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface TransportOption {
	id: "air" | "train" | "bus" | "road";
	name: string;
	icon: LucideIcon;
	color: string;
	bgColor: string;
	available: boolean;
	benefits: string[];
	estimatedTime?: string;
	priceMultiplier: number; // 1.0 = base price
	bestFor: string;
}

interface TransportSelectorProps {
	destination: {
		name: string;
		location: string;
		travelByAir?: string;
		travelByTrain?: string;
		travelByBus?: string;
		travelByRoad?: string;
	};
	selectedTransport: string;
	onTransportChange: (transportId: string) => void;
}

export default function TransportSelector({
	destination,
	selectedTransport,
	onTransportChange,
}: TransportSelectorProps) {
	const [options, setOptions] = useState<TransportOption[]>([]);

	useEffect(() => {
		const transportOptions: TransportOption[] = [
			{
				id: "air",
				name: "By Air",
				icon: Plane,
				color: "text-blue-600",
				bgColor: "bg-blue-50 dark:bg-blue-950/20",
				available: !!destination.travelByAir,
				benefits: [
					"Fastest travel time",
					"Most comfortable journey",
					"Direct connectivity to major cities",
					"Best for long distances",
				],
				estimatedTime: "2-4 hours",
				priceMultiplier: 2.5,
				bestFor: "Time-conscious travelers and long-distance journeys",
			},
			{
				id: "train",
				name: "By Train",
				icon: Train,
				color: "text-green-600",
				bgColor: "bg-green-50 dark:bg-green-950/20",
				available: !!destination.travelByTrain,
				benefits: [
					"Cost-effective option",
					"Scenic journey views",
					"Reliable and punctual",
					"Comfortable for families",
				],
				estimatedTime: "6-12 hours",
				priceMultiplier: 1.2,
				bestFor: "Budget travelers and those who enjoy scenic routes",
			},
			{
				id: "bus",
				name: "By Bus",
				icon: Bus,
				color: "text-orange-600",
				bgColor: "bg-orange-50 dark:bg-orange-950/20",
				available: !!destination.travelByBus,
				benefits: [
					"Most economical choice",
					"Frequent departures",
					"Door-to-door connectivity",
					"Flexible timing options",
				],
				estimatedTime: "8-14 hours",
				priceMultiplier: 0.8,
				bestFor: "Budget-conscious travelers and flexible schedules",
			},
			{
				id: "road",
				name: "By Road (Self-Drive/Taxi)",
				icon: Car,
				color: "text-purple-600",
				bgColor: "bg-purple-50 dark:bg-purple-950/20",
				available: !!destination.travelByRoad,
				benefits: [
					"Complete flexibility",
					"Stop anywhere en route",
					"Privacy and comfort",
					"Best for groups",
				],
				estimatedTime: "Variable",
				priceMultiplier: 1.8,
				bestFor: "Families and groups wanting flexibility",
			},
		];

		const availableOptions = transportOptions.filter((opt) => opt.available);
		setOptions(availableOptions);

		// Auto-select first available option if none selected
		if (!selectedTransport && availableOptions.length > 0) {
			onTransportChange(availableOptions[0].id);
		}
	}, [destination, selectedTransport, onTransportChange]);

	// Find selected option details for compact banner
	const selectedOption = options.find((o) => o.id === selectedTransport);
	const BannerIcon = selectedOption ? selectedOption.icon : Plane;

	if (options.length === 0) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground text-center">
						No transportation information available for this destination.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			<RadioGroup value={selectedTransport} onValueChange={onTransportChange}>
				<div className="grid gap-3">
					{options.map((option) => {
						const Icon = option.icon;
						const isSelected = selectedTransport === option.id;

						return (
							<Card
								key={option.id}
								className={`cursor-pointer transition-all ${
									isSelected
										? "ring-2 ring-primary shadow-md"
										: "hover:shadow-sm hover:bg-accent/50"
								}`}
								onClick={() => onTransportChange(option.id)}
							>
								<CardContent className="p-3">
									<div className="flex items-start gap-3">
										{/* Radio Button */}
										<RadioGroupItem
											value={option.id}
											id={option.id}
											className="mt-1"
										/>

										{/* Icon */}
										<div
											className={`p-2 rounded-lg ${option.bgColor} flex-shrink-0`}
										>
											<Icon className={`h-5 w-5 ${option.color}`} />
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<Label
														htmlFor={option.id}
														className="text-sm font-semibold cursor-pointer flex items-center gap-1.5"
													>
														{option.name}
														{isSelected && (
															<CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
														)}
													</Label>
													<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
														{option.bestFor}
													</p>
												</div>

												<div className="flex flex-col items-end gap-1 flex-shrink-0">
													<Badge
														variant={isSelected ? "default" : "secondary"}
														className="text-[10px] px-1.5 py-0"
													>
														{option.priceMultiplier > 1.5
															? "Premium"
															: option.priceMultiplier < 1
															? "Budget"
															: "Standard"}
													</Badge>
													{option.estimatedTime && (
														<div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
															<Clock className="h-2.5 w-2.5" />
															<span>{option.estimatedTime}</span>
														</div>
													)}
												</div>
											</div>

											{/* Compact Benefits - Show only 2 main benefits */}
											<div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
												{option.benefits.slice(0, 2).map((benefit, idx) => (
													<div
														key={idx}
														className="flex items-center gap-1 text-[11px]"
													>
														<CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
														<span className="text-muted-foreground">
															{benefit}
														</span>
													</div>
												))}
											</div>

											{/* Price Indicator - Only show when selected */}
											{isSelected && (
												<div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
													<TrendingUp className="h-3 w-3 text-muted-foreground" />
													<span className="text-xs text-muted-foreground">
														Multiplier:{" "}
														<span className="font-semibold text-foreground">
															{option.priceMultiplier}x
														</span>
													</span>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</RadioGroup>

			{/* Compact Info Banner */}
			<div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
				<BannerIcon className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
				<p className="text-[11px] text-muted-foreground leading-relaxed">
					{selectedOption ? (
						<>
							{selectedOption.name} costs are additional. Final price shown in
							summary.
						</>
					) : (
						"Transportation costs are additional. Final price shown in summary."
					)}
				</p>
			</div>
		</div>
	);
}
