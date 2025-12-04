"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Loader2,
	Plane,
	Search,
	Sunrise,
	Sun,
	Sunset,
	Moon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { FlightResult } from "@/types/tekTravels";

interface FlightSearchForm {
	origin: string;
	destination: string;
	departureDate: string;
	returnDate?: string;
	adults: number;
	children: number;
	infants: number;
	cabinClass: string;
	journeyType: "1" | "2"; // 1: OneWay, 2: Return
	directFlight: boolean;
	oneStopFlight: boolean;
}

const timeSlots = [
	{ label: "Before 6AM", icon: Sunrise, range: [0, 6] },
	{ label: "6AM - 12PM", icon: Sun, range: [6, 12] },
	{ label: "12PM - 6PM", icon: Sunset, range: [12, 18] },
	{ label: "After 6PM", icon: Moon, range: [18, 24] },
];

export default function FlightSearch() {
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [flights, setFlights] = useState<FlightResult[]>([]);
	const [searchPerformed, setSearchPerformed] = useState(false);

	// Filter states
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
	const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 100000]);
	const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
	const [selectedDepartureTimes, setSelectedDepartureTimes] = useState<
		string[]
	>([]);
	const [selectedArrivalTimes, setSelectedArrivalTimes] = useState<string[]>(
		[]
	);

	const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);

	const form = useForm<FlightSearchForm>({
		defaultValues: {
			origin: "",
			destination: "",
			departureDate: "",
			returnDate: "",
			adults: 1,
			children: 0,
			infants: 0,
			cabinClass: "1",
			journeyType: "1",
			directFlight: true,
			oneStopFlight: false,
		},
	});

	// Auto-fill form and search if URL parameters are present
	useEffect(() => {
		const origin = searchParams.get("origin");
		const destination = searchParams.get("destination");
		const departureDate = searchParams.get("departureDate");
		const returnDate = searchParams.get("returnDate");
		const adults = searchParams.get("adults");
		const journeyType = searchParams.get("journeyType");
		const cabinClass = searchParams.get("cabinClass");

		if (origin && destination && departureDate) {
			// Fill form with URL parameters
			form.setValue("origin", origin);
			form.setValue("destination", destination);
			form.setValue("departureDate", departureDate.split("T")[0]); // Extract date part
			if (returnDate) {
				form.setValue("returnDate", returnDate.split("T")[0]);
			}
			if (adults) {
				form.setValue("adults", parseInt(adults));
			}
			if (journeyType) {
				form.setValue("journeyType", journeyType as "1" | "2");
			}
			if (cabinClass) {
				form.setValue("cabinClass", cabinClass);
			}

			// Automatically perform search
			handleAutoSearch({
				origin,
				destination,
				departureDate,
				returnDate: returnDate || undefined,
				adults: adults ? parseInt(adults) : 1,
				children: 0,
				infants: 0,
				cabinClass: cabinClass || "1",
				journeyType: (journeyType as "1" | "2") || "1",
				directFlight: true,
				oneStopFlight: false,
			});
		}
	}, [searchParams, form]);

	// Filter flights based on selected criteria
	useEffect(() => {
		const filtered = flights.filter((flight) => {
			const price = flight.Fare.OfferedFare;
			if (price < priceRange[0] || price > priceRange[1]) return false;

			if (
				selectedAirlines.length > 0 &&
				!selectedAirlines.includes(flight.AirlineCode)
			)
				return false;

			// Arrival time
			if (selectedArrivalTimes.length > 0) {
				const timeString =
					flight.Segments?.[0]?.[flight.Segments[0].length - 1]?.Destination
						?.ArrTime ||
					flight.Segments?.[0]?.[flight.Segments[0].length - 1]?.ArrivalTime;
				if (timeString) {
					const arrTime = new Date(timeString).getHours();
					if (!isNaN(arrTime)) {
						const isInSelectedSlot = selectedArrivalTimes.some((slotLabel) => {
							const slot = timeSlots.find((s) => s.label === slotLabel);
							return (
								slot && arrTime >= slot.range[0] && arrTime < slot.range[1]
							);
						});
						if (!isInSelectedSlot) return false;
					}
				}
			}

			// Departure time (for round trip)
			if (
				form.watch("journeyType") === "2" &&
				selectedDepartureTimes.length > 0
			) {
				const timeString =
					flight.Segments?.[0]?.[0]?.Origin?.DepTime ||
					flight.Segments?.[0]?.[0]?.DepartureTime;
				if (timeString) {
					const depTime = new Date(timeString).getHours();
					if (!isNaN(depTime)) {
						const isInSelectedSlot = selectedDepartureTimes.some(
							(slotLabel) => {
								const slot = timeSlots.find((s) => s.label === slotLabel);
								return (
									slot && depTime >= slot.range[0] && depTime < slot.range[1]
								);
							}
						);
						if (!isInSelectedSlot) return false;
					}
				}
			}

			return true;
		});
		setFilteredFlights(filtered);
	}, [
		flights,
		priceRange,
		selectedAirlines,
		selectedDepartureTimes,
		selectedArrivalTimes,
		form,
	]);

	// Update price range when new flights are loaded
	useEffect(() => {
		if (flights.length > 0) {
			const prices = flights.map((flight) => flight.Fare.OfferedFare);
			const minPrice = Math.min(...prices);
			const maxPrice = Math.max(...prices);
			setPriceBounds([minPrice, maxPrice]);
			setPriceRange([minPrice, maxPrice]);
		}
	}, [flights]);

	const handleAutoSearch = async (searchData: FlightSearchForm) => {
		setLoading(true);
		setSearchPerformed(true);

		try {
			const searchParams = {
				Origin: searchData.origin.toUpperCase(),
				Destination: searchData.destination.toUpperCase(),
				PreferredDepartureTime: searchData.departureDate,
				ReturnPreferredDepartureTime: searchData.returnDate,
				AdultCount: String(searchData.adults),
				ChildCount: String(searchData.children),
				InfantCount: String(searchData.infants),
				FlightCabinClass: searchData.cabinClass,
				JourneyType: searchData.journeyType,
				DirectFlight: String(searchData.directFlight),
				OneStopFlight: String(searchData.oneStopFlight),
			};

			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchParams),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Search failed");
			}

			// Extract flights from the response
			const flightResults = result.data?.Response?.Results?.[0] || [];
			setFlights(flightResults);

			if (flightResults.length === 0) {
				toast.info("No flights found for the selected criteria");
			} else {
				toast.success(`Found ${flightResults.length} flight options`);
			}
		} catch (error) {
			console.error("Flight search error:", error);
			toast.error(error instanceof Error ? error.message : "Search failed");
			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: FlightSearchForm) => {
		setLoading(true);
		setSearchPerformed(true);

		try {
			const searchParams = {
				Origin: data.origin.toUpperCase(),
				Destination: data.destination.toUpperCase(),
				PreferredDepartureTime: data.departureDate,
				ReturnPreferredDepartureTime: data.returnDate,
				AdultCount: String(data.adults),
				ChildCount: String(data.children),
				InfantCount: String(data.infants),
				FlightCabinClass: data.cabinClass,
				JourneyType: data.journeyType,
				DirectFlight: String(data.directFlight),
				OneStopFlight: String(data.oneStopFlight),
			};

			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchParams),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Search failed");
			}

			// Extract flights from the response
			const flightResults = result.data?.Response?.Results?.[0] || [];
			setFlights(flightResults);

			if (flightResults.length === 0) {
				toast.info("No flights found for the selected criteria");
			} else {
				toast.success(`Found ${flightResults.length} flight options`);
			}
		} catch (error) {
			console.error("Flight search error:", error);
			toast.error(error instanceof Error ? error.message : "Search failed");
			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const formatTime = (dateString: string) => {
		if (!dateString) return "N/A";

		console.log("Raw date string:", dateString);

		try {
			// Handle various date formats that TBO might return
			let date: Date | null;

			// If it's already a valid date string, parse it
			date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				console.log("Parsed with direct Date constructor:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try removing milliseconds if present (TBO sometimes includes them)
			const withoutMs = dateString.replace(/\.\d+/, "");
			console.log("After removing milliseconds:", withoutMs);
			date = new Date(withoutMs);
			if (!isNaN(date.getTime())) {
				console.log("Parsed after removing milliseconds:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try replacing space with T for ISO format
			const isoString = dateString.replace(" ", "T");
			console.log("After replacing space with T:", isoString);
			date = new Date(isoString);
			if (!isNaN(date.getTime())) {
				console.log("Parsed with ISO format:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try parsing as UTC if it ends with Z
			if (dateString.endsWith("Z")) {
				date = new Date(dateString + (dateString.includes("Z") ? "" : "Z"));
				if (!isNaN(date.getTime())) {
					console.log("Parsed as UTC:", date.toISOString());
					return date.toLocaleTimeString("en-IN", {
						hour: "2-digit",
						minute: "2-digit",
					});
				}
			}

			// Try manual parsing for common formats
			const manualParse = (str: string) => {
				// Match formats like: 2024-12-04T10:30:00 or 2024-12-04 10:30:00
				const match = str.match(
					/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
				);
				if (match) {
					const [, year, month, day, hour, minute, second] = match;
					return new Date(
						parseInt(year),
						parseInt(month) - 1,
						parseInt(day),
						parseInt(hour),
						parseInt(minute),
						parseInt(second)
					);
				}
				return null;
			};

			date = manualParse(dateString);
			if (date && !isNaN(date.getTime())) {
				console.log("Parsed with manual parsing:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			console.log("Could not parse date string:", dateString);
			return "Invalid Date";
		} catch (error) {
			console.log("Error parsing date:", dateString, error);
			return "Invalid Date";
		}
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";

		try {
			// Handle various date formats that TBO might return
			let date: Date | null;

			// If it's already a valid date string, parse it
			date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			// Try removing milliseconds if present (TBO sometimes includes them)
			const withoutMs = dateString.replace(/\.\d+/, "");
			date = new Date(withoutMs);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			// Try replacing space with T for ISO format
			const isoString = dateString.replace(" ", "T");
			date = new Date(isoString);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			console.log("Could not parse date string:", dateString);
			return "Invalid Date";
		} catch (error) {
			console.log("Error parsing date:", dateString, error);
			return "Invalid Date";
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plane className="h-5 w-5" />
						Flight Search
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{/* Origin */}
							<div className="space-y-2">
								<Label htmlFor="origin">From</Label>
								<Input
									id="origin"
									placeholder="DEL"
									{...form.register("origin", { required: true })}
									className="uppercase"
								/>
							</div>

							{/* Destination */}
							<div className="space-y-2">
								<Label htmlFor="destination">To</Label>
								<Input
									id="destination"
									placeholder="BOM"
									{...form.register("destination", { required: true })}
									className="uppercase"
								/>
							</div>

							{/* Departure Date */}
							<div className="space-y-2">
								<Label htmlFor="departureDate">Departure Date</Label>
								<Input
									id="departureDate"
									type="date"
									{...form.register("departureDate", { required: true })}
									min={new Date().toISOString().split("T")[0]}
								/>
							</div>

							{/* Return Date */}
							<div className="space-y-2">
								<Label htmlFor="returnDate">Return Date</Label>
								<Input
									id="returnDate"
									type="date"
									{...form.register("returnDate")}
									min={
										form.watch("departureDate") ||
										new Date().toISOString().split("T")[0]
									}
									disabled={form.watch("journeyType") === "1"}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{/* Journey Type */}
							<div className="space-y-2">
								<Label>Journey Type</Label>
								<Select
									value={form.watch("journeyType")}
									onValueChange={(value) =>
										form.setValue("journeyType", value as "1" | "2")
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">One Way</SelectItem>
										<SelectItem value="2">Return</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Cabin Class */}
							<div className="space-y-2">
								<Label>Cabin Class</Label>
								<Select
									value={form.watch("cabinClass")}
									onValueChange={(value) => form.setValue("cabinClass", value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">All</SelectItem>
										<SelectItem value="2">Economy</SelectItem>
										<SelectItem value="3">Premium Economy</SelectItem>
										<SelectItem value="4">Business</SelectItem>
										<SelectItem value="5">Premium Business</SelectItem>
										<SelectItem value="6">First</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Passengers */}
							<div className="space-y-2">
								<Label>Adults</Label>
								<Select
									value={String(form.watch("adults"))}
									onValueChange={(value) =>
										form.setValue("adults", parseInt(value))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
											<SelectItem key={num} value={String(num)}>
												{num}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Flight Preferences */}
							<div className="space-y-2">
								<Label>Flight Preferences</Label>
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="directFlight"
											checked={form.watch("directFlight")}
											onCheckedChange={(checked) =>
												form.setValue("directFlight", checked as boolean)
											}
										/>
										<Label htmlFor="directFlight" className="text-sm">
											Direct Flights
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="oneStopFlight"
											checked={form.watch("oneStopFlight")}
											onCheckedChange={(checked) =>
												form.setValue("oneStopFlight", checked as boolean)
											}
										/>
										<Label htmlFor="oneStopFlight" className="text-sm">
											One Stop
										</Label>
									</div>
								</div>
							</div>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Searching Flights...
								</>
							) : (
								<>
									<Search className="mr-2 h-4 w-4" />
									Search Flights
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Flight Results */}
			{searchPerformed && flights.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					<div className="lg:col-span-1">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Filters</CardTitle>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPriceRange(priceBounds);
										setSelectedAirlines([]);
										setSelectedDepartureTimes([]);
										setSelectedArrivalTimes([]);
									}}
								>
									Clear Filters
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{/* Price Range */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Price Range</Label>
										<div className="px-2">
											<Slider
												value={priceRange}
												onValueChange={(value) =>
													setPriceRange(value as [number, number])
												}
												max={priceBounds[1]}
												min={priceBounds[0]}
												step={500}
												className="w-full"
											/>
											<div className="flex justify-between text-xs text-muted-foreground mt-1">
												<span>₹{priceRange[0].toLocaleString()}</span>
												<span>₹{priceRange[1].toLocaleString()}</span>
											</div>
										</div>
									</div>

									{/* Departure Time Filter (for round trip) */}
									{form.watch("journeyType") === "2" && (
										<div className="space-y-3">
											<Label className="text-sm font-medium">
												Departure Time
											</Label>
											<div className="space-y-2">
												{timeSlots.map((slot) => {
													const IconComponent = slot.icon;
													return (
														<div
															key={slot.label}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`departure-${slot.label}`}
																checked={selectedDepartureTimes.includes(
																	slot.label
																)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedDepartureTimes([
																			...selectedDepartureTimes,
																			slot.label,
																		]);
																	} else {
																		setSelectedDepartureTimes(
																			selectedDepartureTimes.filter(
																				(t) => t !== slot.label
																			)
																		);
																	}
																}}
															/>
															<IconComponent className="h-4 w-4" />
															<Label
																htmlFor={`departure-${slot.label}`}
																className="text-sm"
															>
																{slot.label}
															</Label>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* Arrival Time Filter */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Arrival Time</Label>
										<div className="space-y-2">
											{timeSlots.map((slot) => {
												const IconComponent = slot.icon;
												return (
													<div
														key={slot.label}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`arrival-${slot.label}`}
															checked={selectedArrivalTimes.includes(
																slot.label
															)}
															onCheckedChange={(checked) => {
																if (checked) {
																	setSelectedArrivalTimes([
																		...selectedArrivalTimes,
																		slot.label,
																	]);
																} else {
																	setSelectedArrivalTimes(
																		selectedArrivalTimes.filter(
																			(t) => t !== slot.label
																		)
																	);
																}
															}}
														/>
														<IconComponent className="h-4 w-4" />
														<Label
															htmlFor={`arrival-${slot.label}`}
															className="text-sm"
														>
															{slot.label}
														</Label>
													</div>
												);
											})}
										</div>
									</div>

									{/* Airline Filter */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Airlines</Label>
										<div className="space-y-2 max-h-32 overflow-y-auto">
											{Array.from(
												new Set(flights.map((f) => f.AirlineCode))
											).map((airlineCode) => {
												const airlineName =
													flights.find((f) => f.AirlineCode === airlineCode)
														?.Segments?.[0]?.[0]?.Airline?.AirlineName ||
													airlineCode;
												return (
													<div
														key={airlineCode}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`airline-${airlineCode}`}
															checked={selectedAirlines.includes(airlineCode)}
															onCheckedChange={(checked) => {
																if (checked) {
																	setSelectedAirlines([
																		...selectedAirlines,
																		airlineCode,
																	]);
																} else {
																	setSelectedAirlines(
																		selectedAirlines.filter(
																			(a) => a !== airlineCode
																		)
																	);
																}
															}}
														/>
														<Label
															htmlFor={`airline-${airlineCode}`}
															className="text-sm"
														>
															{airlineName}
														</Label>
													</div>
												);
											})}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="lg:col-span-3">
						<Card>
							<CardHeader>
								<CardTitle>
									Flight Results ({filteredFlights.length} of {flights.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								{filteredFlights.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										No flights match your filter criteria. Try adjusting your
										filters.
									</div>
								) : (
									<div className="space-y-4">
										{filteredFlights.map((flight, index) => (
											<Card
												key={flight.ResultIndex || index}
												className="border-l-4 border-l-blue-500"
											>
												<CardContent className="p-4">
													<div className="flex justify-between items-start">
														<div className="flex-1">
															{/* Airline Info */}
															<div className="flex items-center gap-2 mb-2">
																<span className="font-semibold text-lg">
																	{flight.Segments?.[0]?.[0]?.Airline
																		?.AirlineName || flight.AirlineCode}
																</span>
																<span className="text-sm text-muted-foreground">
																	{
																		flight.Segments?.[0]?.[0]?.Airline
																			?.FlightNumber
																	}
																</span>
																{flight.IsLCC && (
																	<span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
																		LCC
																	</span>
																)}
															</div>

															{/* Flight Route */}
															<div className="flex items-center gap-4 mb-3">
																<div className="text-center">
																	<div className="text-lg font-bold">
																		{
																			flight.Segments?.[0]?.[0]?.Origin
																				?.AirportCode
																		}
																	</div>
																	<div className="text-sm text-muted-foreground">
																		{
																			flight.Segments?.[0]?.[0]?.Origin
																				?.CityName
																		}
																	</div>
																	<div className="text-sm font-medium">
																		{formatTime(
																			flight.Segments?.[0]?.[0]?.Origin
																				?.DepTime ||
																				flight.Segments?.[0]?.[0]?.DepartureTime
																		)}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		{formatDate(
																			flight.Segments?.[0]?.[0]?.Origin
																				?.DepTime ||
																				flight.Segments?.[0]?.[0]?.DepartureTime
																		)}
																	</div>
																</div>

																<div className="flex-1 flex flex-col items-center">
																	<div className="text-sm text-muted-foreground mb-1">
																		{formatDuration(
																			flight.Segments?.[0]?.[0]?.Duration
																		)}
																	</div>
																	<div className="w-full h-px bg-border relative">
																		<Plane className="h-3 w-3 absolute right-0 top-1/2 -translate-y-1/2 text-blue-500" />
																	</div>
																	{flight.Segments?.[0] &&
																		flight.Segments[0].length > 1 && (
																			<div className="text-xs text-muted-foreground mt-1">
																				{flight.Segments[0].length - 1} stop(s)
																			</div>
																		)}
																</div>

																<div className="text-center">
																	<div className="text-lg font-bold">
																		{
																			flight.Segments?.[0]?.[
																				flight.Segments[0].length - 1
																			]?.Destination?.AirportCode
																		}
																	</div>
																	<div className="text-sm text-muted-foreground">
																		{
																			flight.Segments?.[0]?.[
																				flight.Segments[0].length - 1
																			]?.Destination?.CityName
																		}
																	</div>
																	<div className="text-sm font-medium">
																		{formatTime(
																			flight.Segments?.[0]?.[
																				flight.Segments[0].length - 1
																			]?.Destination?.ArrTime ||
																				flight.Segments?.[0]?.[
																					flight.Segments[0].length - 1
																				]?.ArrivalTime
																		)}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		{formatDate(
																			flight.Segments?.[0]?.[
																				flight.Segments[0].length - 1
																			]?.Destination?.ArrTime ||
																				flight.Segments?.[0]?.[
																					flight.Segments[0].length - 1
																				]?.ArrivalTime
																		)}
																	</div>
																</div>
															</div>
														</div>

														{/* Price */}
														<div className="text-right">
															<div className="text-2xl font-bold text-green-600">
																₹{flight.Fare.OfferedFare.toLocaleString()}
															</div>
															<div className="text-sm text-muted-foreground">
																{flight.Fare.Currency}
															</div>
															{flight.IsRefundable && (
																<div className="text-xs text-green-600 mt-1">
																	Refundable
																</div>
															)}
															<Button size="sm" className="mt-2">
																Select Flight
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
