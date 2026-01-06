"use client";
import { useState, useEffect } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, IndianRupee } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PriceRange {
	min: number;
	max: number;
}

interface PriceRangeSelectorProps {
	priceRange: PriceRange;
	onPriceRangeChange: (range: PriceRange) => void;
	currency?: string;
	minPrice?: number;
	maxPrice?: number;
}

export default function PriceRangeSelector({
	priceRange,
	onPriceRangeChange,
	currency = "₹",
	minPrice = 0,
	maxPrice = 10000,
}: PriceRangeSelectorProps) {
	const [open, setOpen] = useState(false);
	const [localRange, setLocalRange] = useState<PriceRange>(priceRange);

	useEffect(() => {
		setLocalRange(priceRange);
	}, [priceRange]);

	const handleRangeChange = (values: number[]) => {
		setLocalRange({ min: values[0], max: values[1] });
	};

	const handleApply = () => {
		onPriceRangeChange(localRange);
		setOpen(false);
	};

	const formatPrice = (price: number) => {
		if (price >= maxPrice) {
			return `${currency}${price.toLocaleString("en-IN")}+`;
		}
		return `${currency}${price.toLocaleString("en-IN")}`;
	};

	const getPriceRangeText = () => {
		if (localRange.min === minPrice && localRange.max === maxPrice) {
			return `Any Price`;
		}
		if (localRange.max >= maxPrice) {
			return `${formatPrice(localRange.min)} - ${formatPrice(localRange.max)}`;
		}
		return `${formatPrice(localRange.min)} - ${formatPrice(localRange.max)}`;
	};

	// Predefined price ranges
	const pricePresets = [
		{ label: "₹0-₹1500", min: 0, max: 1500 },
		{ label: "₹1500-₹2500", min: 1500, max: 2500 },
		{ label: "₹2500-₹5000", min: 2500, max: 5000 },
		{ label: "₹5000+", min: 5000, max: maxPrice },
	];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left w-full h-full">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="text-xs text-gray-500 mb-1 uppercase flex items-center gap-1">
								<IndianRupee className="h-3 w-3" />
								Price Per Night
							</div>
							<div className="text-lg font-bold text-gray-900">
								{getPriceRangeText()}
							</div>
						</div>
						<ChevronDown className="h-5 w-5 text-gray-400" />
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<div className="p-6 space-y-6">
					{/* Price Range Display */}
					<div>
						<div className="text-sm font-semibold text-gray-700 mb-4">
							Price Range
						</div>
						<div className="flex items-center justify-between mb-6">
							<div className="text-center">
								<div className="text-xs text-gray-500 mb-1">Min</div>
								<div className="text-xl font-bold text-gray-900">
									{formatPrice(localRange.min)}
								</div>
							</div>
							<div className="w-8 h-0.5 bg-gray-300"></div>
							<div className="text-center">
								<div className="text-xs text-gray-500 mb-1">Max</div>
								<div className="text-xl font-bold text-gray-900">
									{formatPrice(localRange.max)}
								</div>
							</div>
						</div>

						{/* Slider */}
						<Slider
							min={minPrice}
							max={maxPrice}
							step={100}
							value={[localRange.min, localRange.max]}
							onValueChange={handleRangeChange}
							className="mb-6"
						/>
					</div>

					{/* Preset Ranges */}
					<div>
						<div className="text-sm font-semibold text-gray-700 mb-3">
							Quick Select
						</div>
						<div className="grid grid-cols-2 gap-2">
							{pricePresets.map((preset, index) => {
								const isActive =
									localRange.min === preset.min &&
									localRange.max === preset.max;
								return (
									<button
										key={index}
										onClick={() =>
											setLocalRange({ min: preset.min, max: preset.max })
										}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
											isActive
												? "bg-blue-600 text-white"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{preset.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Apply Button */}
					<button
						onClick={handleApply}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
					>
						Apply
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
