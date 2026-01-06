"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface HotelDateSelectorProps {
	checkInDate: Date | undefined;
	checkOutDate: Date | undefined;
	onCheckInDateChange: (date: Date | undefined) => void;
	onCheckOutDateChange: (date: Date | undefined) => void;
}

export default function HotelDateSelector({
	checkInDate,
	checkOutDate,
	onCheckInDateChange,
	onCheckOutDateChange,
}: HotelDateSelectorProps) {
	const [checkInOpen, setCheckInOpen] = useState(false);
	const [checkOutOpen, setCheckOutOpen] = useState(false);

	// Calculate number of nights
	const nights =
		checkInDate && checkOutDate
			? Math.ceil(
					(checkOutDate.getTime() - checkInDate.getTime()) /
						(1000 * 60 * 60 * 24)
			  )
			: 0;

	return (
		<div className="flex gap-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 h-full">
			{/* Check-In Date */}
			<div className="flex-1">
				<Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
					<PopoverTrigger asChild>
						<button className="w-full p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left h-full">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="text-xs text-gray-500 mb-1 uppercase flex items-center gap-1">
										<CalendarIcon className="h-3 w-3" />
										Check-In
									</div>
									{checkInDate ? (
										<div className="flex flex-col">
											<div className="flex items-baseline gap-2">
												<span className="text-2xl font-bold text-gray-900">
													{format(checkInDate, "d")}
												</span>
												<span className="text-sm font-medium text-gray-700">
													{format(checkInDate, "MMM''yy")}
												</span>
											</div>
											<span className="text-xs text-gray-600 mt-0.5">
												{format(checkInDate, "EEEE")}
											</span>
										</div>
									) : (
										<span className="text-gray-400 text-sm">Select date</span>
									)}
								</div>
								<ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
							</div>
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={checkInDate}
							onSelect={(date) => {
								onCheckInDateChange(date);
								// If check-out is before or equal to new check-in, clear it
								if (date && checkOutDate && checkOutDate <= date) {
									onCheckOutDateChange(undefined);
								}
								setCheckInOpen(false);
							}}
							disabled={(date) => date < new Date()}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Check-Out Date */}
			<div className="flex-1 border-l border-gray-200">
				<Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
					<PopoverTrigger asChild>
						<button
							className="w-full p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left h-full"
							disabled={!checkInDate}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="text-xs text-gray-500 mb-1 uppercase flex items-center gap-1">
										<CalendarIcon className="h-3 w-3" />
										Check-Out
									</div>
									{checkOutDate ? (
										<div className="flex flex-col">
											<div className="flex items-baseline gap-2">
												<span className="text-2xl font-bold text-gray-900">
													{format(checkOutDate, "d")}
												</span>
												<span className="text-sm font-medium text-gray-700">
													{format(checkOutDate, "MMM''yy")}
												</span>
											</div>
											<span className="text-xs text-gray-600 mt-0.5">
												{format(checkOutDate, "EEEE")}
											</span>
										</div>
									) : (
										<span className="text-gray-400 text-sm">Select date</span>
									)}
								</div>
								<ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
							</div>
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={checkOutDate}
							onSelect={(date) => {
								onCheckOutDateChange(date);
								setCheckOutOpen(false);
							}}
							disabled={(date) => {
								const tomorrow = new Date();
								tomorrow.setDate(tomorrow.getDate() + 1);
								// Disable dates before tomorrow
								if (date < tomorrow) return true;
								// Disable dates before or equal to check-in
								if (checkInDate && date <= checkInDate) return true;
								return false;
							}}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Nights Display */}
			{nights > 0 && (
				<div className="flex items-center px-4 bg-blue-50 border-l border-gray-200">
					<div className="text-center">
						<div className="text-xs text-gray-500 mb-1 uppercase">Nights</div>
						<div className="text-2xl font-bold text-blue-600">{nights}</div>
					</div>
				</div>
			)}
		</div>
	);
}
