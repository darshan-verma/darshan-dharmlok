"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Search, Calendar as CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import HotelLocationSelector from "@/app/(frontend)/components/travel-portal/HotelLocationSelector";

interface City {
	name: string;
	country: string;
	code?: string;
	type?: "country" | "city" | "hotel";
	hotelCode?: string;
	cityCode?: string;
	countryCode?: string;
}

interface HotelSearchFormProps {
	initialValues?: {
		location: string;
		cityCode?: string;
		checkIn: Date;
		checkOut: Date;
		rooms: number;
		adults: number;
		children: number;
	};
	onSearch: (searchData: HotelSearchData) => void;
}

export interface HotelSearchData {
	location: string;
	cityCode?: string;
	checkIn: Date;
	checkOut: Date;
	rooms: number;
	adults: number;
	children: number;
}

export default function HotelSearchForm({
	initialValues,
	onSearch,
}: HotelSearchFormProps) {
	const [location, setLocation] = useState<City>({
		name: initialValues?.location || "",
		country: "",
		cityCode: initialValues?.cityCode,
	});

	const [checkIn, setCheckIn] = useState<Date | undefined>(
		initialValues?.checkIn || undefined
	);
	const [checkOut, setCheckOut] = useState<Date | undefined>(
		initialValues?.checkOut || undefined
	);
	const [rooms, setRooms] = useState(initialValues?.rooms || 3);
	const [adults, setAdults] = useState(initialValues?.adults || 4);
	const [children, setChildren] = useState(initialValues?.children || 2);

	const handleLocationChange = (selectedLocation: City) => {
		setLocation(selectedLocation);
	};

	const handleSearch = () => {
		if (!location.name || !checkIn || !checkOut) {
			alert("Please fill all required fields");
			return;
		}

		if (!location.cityCode) {
			alert("Please select a city from the suggestions");
			return;
		}

		onSearch({
			location: location.name,
			cityCode: location.cityCode,
			checkIn,
			checkOut,
			rooms,
			adults,
			children,
		});
	};

	return (
		<Card className="p-4 bg-white shadow-md">
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
					{/* Location Selector */}
					<div className="md:col-span-2">
						<Label
							htmlFor="location"
							className="text-sm font-medium text-gray-700"
						>
							CITY, AREA OR PROPERTY
						</Label>
						<div className="mt-1">
							<HotelLocationSelector
								location={location}
								onLocationChange={handleLocationChange}
								placeholder="City, Property Name Or Location"
							/>
						</div>
					</div>

					{/* Check-in Date */}
					<div>
						<Label
							htmlFor="check-in"
							className="text-sm font-medium text-gray-700"
						>
							CHECK-IN
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal mt-1"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{checkIn ? format(checkIn, "EEE, d MMM yyyy") : "Select date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={checkIn}
									onSelect={setCheckIn}
									disabled={(date) => date < new Date()}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Check-out Date */}
					<div>
						<Label
							htmlFor="check-out"
							className="text-sm font-medium text-gray-700"
						>
							CHECK-OUT
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal mt-1"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{checkOut
										? format(checkOut, "EEE, d MMM yyyy")
										: "Select date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={checkOut}
									onSelect={setCheckOut}
									disabled={(date) => date < (checkIn || new Date())}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Rooms & Guests */}
					<div>
						<Label
							htmlFor="rooms-guests"
							className="text-sm font-medium text-gray-700"
						>
							ROOMS & GUESTS
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal mt-1"
								>
									<Users className="mr-2 h-4 w-4" />
									{rooms} Room{rooms > 1 ? "s" : ""}, {adults + children} Guest
									{adults + children > 1 ? "s" : ""}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80" align="start">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<Label>Rooms</Label>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setRooms(Math.max(1, rooms - 1))}
											>
												-
											</Button>
											<span className="w-8 text-center">{rooms}</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setRooms(Math.min(10, rooms + 1))}
											>
												+
											</Button>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<Label>Adults</Label>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setAdults(Math.max(1, adults - 1))}
											>
												-
											</Button>
											<span className="w-8 text-center">{adults}</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setAdults(Math.min(20, adults + 1))}
											>
												+
											</Button>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<Label>Children (0-17 years)</Label>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setChildren(Math.max(0, children - 1))}
											>
												-
											</Button>
											<span className="w-8 text-center">{children}</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setChildren(Math.min(10, children + 1))}
											>
												+
											</Button>
										</div>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					{/* Search Button */}
					<div>
						<Button
							onClick={handleSearch}
							className="w-full bg-blue-600 hover:bg-blue-700 mt-1"
						>
							<Search className="mr-2 h-4 w-4" />
							SEARCH
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}
