"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users } from "lucide-react";
import { formatHotelDisplayDate } from "@/lib/hotelGuestUtils";
import { cn } from "@/lib/utils";

const SUMMARY_FIELD = "flex flex-col gap-2";
const SUMMARY_LABEL = "text-sm font-medium text-gray-600";
const SUMMARY_INPUT =
	"h-10 w-full rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900";

export interface HotelGuestTripSummaryProps {
	checkIn: string | null;
	checkOut: string | null;
	rooms: number;
	adults: number;
	childCount: number;
}

export default function HotelGuestTripSummary({
	checkIn,
	checkOut,
	rooms,
	adults,
	childCount,
}: HotelGuestTripSummaryProps) {
	return (
		<Card className="border-blue-100 bg-blue-50/40">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<Calendar className="w-5 h-5 text-blue-600" />
					Your trip (from search)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className={SUMMARY_FIELD}>
						<Label className={SUMMARY_LABEL}>Check-in</Label>
						<Input
							readOnly
							value={formatHotelDisplayDate(checkIn)}
							className={SUMMARY_INPUT}
						/>
					</div>
					<div className={SUMMARY_FIELD}>
						<Label className={SUMMARY_LABEL}>Check-out</Label>
						<Input
							readOnly
							value={formatHotelDisplayDate(checkOut)}
							className={SUMMARY_INPUT}
						/>
					</div>
					<div className={SUMMARY_FIELD}>
						<Label className={cn(SUMMARY_LABEL, "flex items-center gap-1")}>
							<Users className="w-3.5 h-3.5" />
							Guests
						</Label>
						<Input
							readOnly
							value={`${adults} Adult${adults !== 1 ? "s" : ""}${
								childCount > 0
									? `, ${childCount} Child${childCount !== 1 ? "ren" : ""}`
									: ""
							}`}
							className={SUMMARY_INPUT}
						/>
					</div>
					<div className={SUMMARY_FIELD}>
						<Label className={SUMMARY_LABEL}>Rooms</Label>
						<Input
							readOnly
							value={`${rooms} Room${rooms !== 1 ? "s" : ""}`}
							className={SUMMARY_INPUT}
						/>
					</div>
				</div>
				<p className="text-xs text-gray-500 mt-3">
					Dates and guest count are taken from your search. Update them by starting
					a new search if needed.
				</p>
			</CardContent>
		</Card>
	);
}
