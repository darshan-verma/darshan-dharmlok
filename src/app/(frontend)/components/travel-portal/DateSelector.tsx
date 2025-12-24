"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";
import { format } from "date-fns";

interface DateSelectorProps {
	departureDate: Date | undefined;
	returnDate: Date | undefined;
	onDepartureDateChange: (date: Date | undefined) => void;
	onReturnDateChange: (date: Date | undefined) => void;
	isRoundTrip: boolean;
}

export default function DateSelector({
	departureDate,
	returnDate,
	onDepartureDateChange,
	onReturnDateChange,
	isRoundTrip,
}: DateSelectorProps) {
	const [departureOpen, setDepartureOpen] = useState(false);
	const [returnOpen, setReturnOpen] = useState(false);

	return (
		<div className="flex gap-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 h-full">
			{/* Departure Date */}
			<div className="flex-1">
				<Popover open={departureOpen} onOpenChange={setDepartureOpen}>
					<PopoverTrigger asChild>
						<button className="w-full p-4 hover:bg-gray-100 cursor-pointer transition-colors text-left h-full">
							<div className="text-xs text-gray-500 mb-1 uppercase">
								Departure
							</div>
							{departureDate ? (
								<div className="flex flex-col">
									<div className="flex items-baseline gap-2">
										<span className="text-3xl font-bold text-blue-600">
											{format(departureDate, "dd")}
										</span>
										<span className="text-sm font-medium text-blue-600">
											{format(departureDate, "MMM''yy")}
										</span>
									</div>
									<span className="text-xs text-gray-600 mt-0.5">
										{format(departureDate, "EEEE")}
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
							selected={departureDate}
							onSelect={(date) => {
								onDepartureDateChange(date);
								setDepartureOpen(false);
							}}
							disabled={(date) => date < new Date()}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Return Date */}
			<div className="flex-1 border-l border-gray-200">
				<Popover open={returnOpen} onOpenChange={setReturnOpen}>
					<PopoverTrigger asChild>
						<button
							className={`w-full p-4 hover:bg-gray-100 cursor-pointer transition-colors text-left relative h-full ${
								!isRoundTrip ? "opacity-50 cursor-not-allowed" : ""
							}`}
							disabled={!isRoundTrip}
						>
							<div className="text-xs text-gray-500 mb-1 uppercase flex items-center justify-between">
								<span>Return</span>
								{returnDate && isRoundTrip && (
									<div
										onClick={(e) => {
											e.stopPropagation();
											onReturnDateChange(undefined);
										}}
										className="hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
									>
										<X className="h-3 w-3 text-gray-400" />
									</div>
								)}
							</div>
							{returnDate ? (
								<div className="flex flex-col">
									<div className="flex items-baseline gap-2">
										<span className="text-3xl font-bold text-blue-600">
											{format(returnDate, "dd")}
										</span>
										<span className="text-sm font-medium text-blue-600">
											{format(returnDate, "MMM''yy")}
										</span>
									</div>
									<span className="text-xs text-gray-600 mt-0.5">
										{format(returnDate, "EEEE")}
									</span>
								</div>
							) : (
								<span className="text-gray-400 text-xs">
									Book International and Domestic Flights
								</span>
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={returnDate}
							onSelect={(date) => {
								onReturnDateChange(date);
								setReturnOpen(false);
							}}
							disabled={(date) => date < (departureDate || new Date())}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
