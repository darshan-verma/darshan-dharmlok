"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlightResult, PassengerDetail } from "@/types/tbo";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
	User,
	ArrowRight,
	ChevronDown,
	ChevronUp,
	Plane,
	Users,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getFareBreakdown } from "@/lib/tboFareCalculations";

interface FormPassenger {
	type: string;
	title: string;
	firstName: string;
	lastName: string;
	gender: string;
	dob: string;
	passportNo?: string;
	passportExpiry?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	countryCode?: string;
	cellCountryCode?: string;
	contactNo?: string;
	email?: string;
	isLeadPax?: boolean;
}

interface PassengerDetailsProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	onBookingSubmit: (data: PassengerDetail[]) => void;
	onPassengersChange?: (passengers: PassengerDetail[]) => void;
	flightResult: FlightResult;
	isSubmitting?: boolean;
	/** When true, passport number and expiry are required (from FareQuote IsPassportRequiredAtBook). */
	requirePassport?: boolean;
	/** When true, passport issue date is also required (from FareQuote IsPassportFullDetailRequiredAtBook). */
	requirePassportFull?: boolean;
	ssrCharges?: {
		baggage?: Record<string, { Price: number } | null>;
		meals?: Record<string, { Price: number } | null>;
		seats?: Record<string, { Price: number } | null>;
		specialServices?: Record<string, { Price: number }[]>;
	};
}

export default function PassengerDetails({
	adultCount,
	childCount,
	infantCount,
	onBookingSubmit,
	onPassengersChange,
	flightResult,
	isSubmitting = false,
	requirePassport = false,
	requirePassportFull = false,
	ssrCharges,
}: PassengerDetailsProps) {
	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: {},
	} = useForm({
		defaultValues: {
			passengers: [
				...Array(adultCount).fill({
					type: "Adult",
					title: "Mr",
					firstName: "",
					lastName: "",
					gender: "1",
					dob: "",
					passportNo: "",
					passportExpiry: "",
					addressLine1: "",
					addressLine2: "",
					city: "",
					countryCode: "IN",
					cellCountryCode: "+91",
					contactNo: "",
					email: "",
					isLeadPax: false,
				}),
				...Array(childCount).fill({
					type: "Child",
					title: "Mstr",
					firstName: "",
					lastName: "",
					gender: "1",
					dob: "",
					passportNo: "",
					passportExpiry: "",
				}),
				...Array(infantCount).fill({
					type: "Infant",
					title: "Mstr",
					firstName: "",
					lastName: "",
					gender: "1",
					dob: "",
					passportNo: "",
					passportExpiry: "",
				}),
			],
		},
	});

	const { fields } = useFieldArray({
		control,
		name: "passengers",
	});

	const watchedPassengers = watch("passengers");

	useEffect(() => {
		if (onPassengersChange) {
			// Transform form data to PassengerDetail format for SSR selection
			const transformedPassengers = watchedPassengers.map((p, index) => ({
				Title: p.title,
				FirstName: p.firstName,
				LastName: p.lastName,
				PaxType: (p.type === "Adult" ? 1 : p.type === "Child" ? 2 : 3) as
					| 1
					| 2
					| 3,
				DateOfBirth: `${p.dob}T00:00:00`,
				Gender: parseInt(p.gender) as 1 | 2,
				PassportNo: p.passportNo || "",
				PassportExpiry: p.passportExpiry ? `${p.passportExpiry}T00:00:00` : "",
				AddressLine1: p.addressLine1 || "",
				AddressLine2: p.addressLine2 || "",
				City: p.city || "",
				CountryCode: p.countryCode || "IN",
				CountryName: "India",
				ContactNo: p.contactNo || "",
				Email: p.email || "",
				IsLeadPax: index === 0,
				FFAirlineCode: undefined,
				FFNumber: "",
			}));
			onPassengersChange(transformedPassengers);
		}
	}, [watchedPassengers, onPassengersChange]);

	const calculateTotalFare = () => {
		let total = flightResult.Fare
			? getFareBreakdown(flightResult.Fare).publishedFare
			: 0;

		// Add SSR charges
		if (ssrCharges) {
			// Add Baggage
			if (ssrCharges.baggage) {
				Object.values(ssrCharges.baggage).forEach((item) => {
					if (item) total += item.Price;
				});
			}

			// Add Meals
			if (ssrCharges.meals) {
				Object.values(ssrCharges.meals).forEach((item) => {
					if (item) total += item.Price;
				});
			}

			// Add Seats
			if (ssrCharges.seats) {
				Object.values(ssrCharges.seats).forEach((item) => {
					if (item) total += item.Price;
				});
			}

			// Add Special Services
			if (ssrCharges.specialServices) {
				Object.values(ssrCharges.specialServices).forEach((services) => {
					services.forEach((service) => {
						if (service) total += service.Price;
					});
				});
			}
		}

		return total;
	};

	// Flight route helpers
	const firstSegment = flightResult?.Segments?.[0]?.[0];
	const lastGroup =
		flightResult?.Segments?.[flightResult?.Segments?.length - 1];
	const lastSegment = lastGroup?.[lastGroup.length - 1];

	const formatTime = (iso?: string) =>
		iso
			? new Date(iso).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
			  })
			: "--";

	const [openPassengers, setOpenPassengers] = useState<Record<number, boolean>>(
		{
			0: true,
		}
	);

	const togglePassenger = (index: number) => {
		setOpenPassengers((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	const onSubmit = (data: { passengers: FormPassenger[] }) => {
		// Transform data to match API requirements
		const formattedPassengers = data.passengers.map(
			(p: FormPassenger, index: number) => {
				const basePassenger: PassengerDetail = {
					Title: p.title,
					FirstName: p.firstName,
					LastName: p.lastName,
					PaxType: (p.type === "Adult" ? 1 : p.type === "Child" ? 2 : 3) as
						| 1
						| 2
						| 3,
					DateOfBirth: `${p.dob}T00:00:00`,
					Gender: parseInt(p.gender) as 1 | 2,
					PassportNo: p.passportNo || "",
					PassportExpiry: p.passportExpiry
						? `${p.passportExpiry}T00:00:00`
						: "",
					AddressLine1: p.addressLine1 || "",
					AddressLine2: p.addressLine2 || "",
					City: p.city || "",
					CountryCode: p.countryCode || "IN",
					CountryName: "India", // Default country name
					ContactNo: p.contactNo || "",
					Email: p.email || "",
					IsLeadPax: index === 0, // First passenger is lead pax
					FFAirlineCode: undefined,
					FFNumber: "",
				};

				return basePassenger;
			}
		);

		onBookingSubmit(formattedPassengers);
	};

	return (
		<>
			<Card className="shadow-sm mt-6 w-full min-w-0">
				<CardHeader className="pb-2 border-b">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						<User className="h-5 w-5 text-blue-600" />
						Passenger Details
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6">
					<form
						id="passenger-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-8"
					>
						{fields.map((field, index) => {
							const isAdult = field.type === "Adult";
							const isOpen = openPassengers[index];
							const isCollapsible = fields.length > 1;

							return (
								<div
									key={field.id}
									className={cn(
										"space-y-4",
										isCollapsible && "border p-4 rounded-lg"
									)}
								>
									<div
										className={cn(
											"flex items-center justify-between mb-4",
											isCollapsible && "cursor-pointer"
										)}
										onClick={() => isCollapsible && togglePassenger(index)}
									>
										<div className="flex items-center gap-2">
											<div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
												Passenger {index + 1} ({field.type})
											</div>
											{index === 0 && (
												<div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
													Lead Passenger
												</div>
											)}
										</div>
										{isCollapsible && (
											<Button variant="ghost" size="sm" type="button">
												{isOpen ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
											</Button>
										)}
									</div>

									<div className={cn(isCollapsible && !isOpen && "hidden")}>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label>Title</Label>
												<Select
													defaultValue={field.title}
													onValueChange={() => {
														// Handle select change manually if needed or use Controller
													}}
													{...register(`passengers.${index}.title`)}
												>
													<SelectTrigger>
														<SelectValue placeholder="Title" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Mr">Mr</SelectItem>
														<SelectItem value="Ms">Ms</SelectItem>
														<SelectItem value="Mrs">Mrs</SelectItem>
														<SelectItem value="Mstr">Mstr</SelectItem>
														<SelectItem value="Miss">Miss</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>First Name</Label>
												<Input
													{...register(`passengers.${index}.firstName`, {
														required: true,
													})}
													placeholder="First Name"
												/>
											</div>

											<div className="space-y-2">
												<Label>Last Name</Label>
												<Input
													{...register(`passengers.${index}.lastName`, {
														required: true,
													})}
													placeholder="Last Name"
												/>
											</div>

											<div className="space-y-2">
												<Label>Gender</Label>
												<Select
													defaultValue={field.gender}
													{...register(`passengers.${index}.gender`)}
												>
													<SelectTrigger>
														<SelectValue placeholder="Gender" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="1">Male</SelectItem>
														<SelectItem value="2">Female</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>Date of Birth</Label>
												<Input
													type="date"
													{...register(`passengers.${index}.dob`, {
														required: true,
													})}
												/>
											</div>

											{isAdult && (
												<>
													<div className="space-y-2">
														<Label>Passport No {requirePassport || requirePassportFull ? "(Required for this flight)" : "(Optional)"}</Label>
														<Input
															{...register(`passengers.${index}.passportNo`, { required: requirePassport || requirePassportFull })}
															placeholder="Passport Number"
														/>
													</div>
													<div className="space-y-2">
														<Label>Passport Expiry {requirePassport || requirePassportFull ? "(Required for this flight)" : "(Optional)"}</Label>
														<Input
															type="date"
															{...register(`passengers.${index}.passportExpiry`, { required: requirePassport || requirePassportFull })}
														/>
													</div>
												</>
											)}
										</div>

										{isAdult && (
											<>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
													<div className="space-y-2">
														<Label>Address Line 1</Label>
														<Input
															{...register(`passengers.${index}.addressLine1`, {
																required: true,
															})}
															placeholder="Address Line 1"
														/>
													</div>
													<div className="space-y-2">
														<Label>Address Line 2</Label>
														<Input
															{...register(`passengers.${index}.addressLine2`)}
															placeholder="Address Line 2"
														/>
													</div>
													<div className="space-y-2">
														<Label>City</Label>
														<Input
															{...register(`passengers.${index}.city`, {
																required: true,
															})}
															placeholder="City"
														/>
													</div>
													<div className="space-y-2">
														<Label>Contact No</Label>
														<Input
															{...register(`passengers.${index}.contactNo`, {
																required: true,
															})}
															placeholder="Contact Number"
														/>
													</div>
													<div className="space-y-2">
														<Label>Email</Label>
														<Input
															type="email"
															{...register(`passengers.${index}.email`, {
																required: true,
															})}
															placeholder="Email Address"
														/>
													</div>
												</div>
											</>
										)}
									</div>

									{index < fields.length - 1 && !isCollapsible && (
										<Separator className="my-6" />
									)}
								</div>
							);
						})}
					</form>
				</CardContent>
			</Card>

			<div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-4xl sm:rounded-2xl sm:border sm:shadow-2xl">
				<div className="px-4 py-4 sm:px-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						{/* Left Side: Price & Flight Info */}
						<div className="flex items-center justify-between sm:justify-start sm:gap-8">
							{/* Price */}
							<div>
								<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
									Total Fare
								</p>
								<div className="flex items-baseline gap-1">
									<span className="text-sm font-semibold text-gray-600">
										{flightResult.Fare?.Currency || "INR"}
									</span>
									<span className="text-2xl font-bold text-blue-600">
										{calculateTotalFare().toLocaleString()}
									</span>
								</div>
							</div>

							{/* Flight Route */}
							<div className="hidden sm:block h-10 w-px bg-gray-200"></div>

							<div className="hidden sm:flex flex-col">
								<div className="flex items-center gap-2 text-sm font-medium text-gray-900">
									<span>{firstSegment?.Origin?.Airport?.CityCode || "--"}</span>
									<Plane className="h-4 w-4 text-gray-400" />
									<span>
										{lastSegment?.Destination?.Airport?.CityCode || "--"}
									</span>
								</div>
								<div className="text-xs text-gray-500 mt-0.5">
									{formatTime(firstSegment?.Origin?.DepTime)} —{" "}
									{formatTime(lastSegment?.Destination?.ArrTime)}
								</div>
							</div>

							{/* Passengers & Refundable Status */}
							<div className="hidden md:block h-10 w-px bg-gray-200"></div>

							<div className="hidden md:flex items-center gap-6">
								<div className="flex items-center gap-2">
									<div className="p-2 bg-blue-50 rounded-full text-blue-600">
										<Users className="h-4 w-4" />
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">Passengers</span>
										<span className="text-sm font-medium text-gray-900">
											{(adultCount || 0) +
												(childCount || 0) +
												(infantCount || 0)}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{flightResult.IsRefundable ? (
										<div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium border border-green-100">
											<CheckCircle2 className="h-3.5 w-3.5" />
											Refundable
										</div>
									) : (
										<div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-full text-xs font-medium border border-red-100">
											<XCircle className="h-3.5 w-3.5" />
											Non-refundable
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Right Side: Action Button */}
						<div className="w-full sm:w-auto">
							<Button
								size="lg"
								className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40"
								type="submit"
								form="passenger-form"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Creating booking…" : "Proceed to Pay"} <ArrowRight className="ml-2 h-4 w-4" />
							</Button>
							<div className="mt-2 text-center sm:hidden flex items-center justify-center gap-2 text-xs text-gray-500">
								<span>
									{flightResult.IsRefundable ? "Refundable" : "Non-refundable"}
								</span>
								<span>•</span>
								<span>
									{(adultCount || 0) + (childCount || 0) + (infantCount || 0)}{" "}
									Passengers
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

		</>
	);
}
