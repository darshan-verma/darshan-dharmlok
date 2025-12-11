"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	MapPin,
	IndianRupee,
	ArrowLeft,
	CheckCircle2,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import TransportSelector from "../../components/TransportSelector";
import TravellerSelector, {
	TravellerCount,
} from "../../../components/travel-portal/TravellerSelector";

interface Destination {
	id: string;
	name: string;
	description: string;
	image: string;
	location: string;
	category: string;
	price: number;
	travelByAir?: string;
	travelByTrain?: string;
	travelByBus?: string;
	travelByRoad?: string;
}

interface BookingFormData {
	name: string;
	email: string;
	phone: string;
	fromLocation: string;
	transportType: string;
	travelClass?: string;
	travelDate: string;
	returnDate: string;
	departureTime: string;
	travelers: number;
}

export default function BookingPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;
	const [destination, setDestination] = useState<Destination | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);

	// Get today's date in YYYY-MM-DD format for min date
	const today = new Date().toISOString().split("T")[0];
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = tomorrow.toISOString().split("T")[0];

	const form = useForm<BookingFormData>({
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			fromLocation: "",
			transportType: "",
			travelClass: "Economy",
			travelDate: "",
			returnDate: "",
			departureTime: "09:00",
			travelers: 1,
		},
	});

	const travelers = form.watch("travelers");
	const transportType = form.watch("transportType");
	const travelClass = form.watch("travelClass");

	// Keep travelClass in sync with transport type: set sensible defaults
	useEffect(() => {
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

		const currentClass = form.getValues("travelClass") || "";
		if (transportType === "train") {
			// If switching to train, default to 'All classes' unless user already chose a train class
			if (!trainClasses.includes(currentClass)) {
				form.setValue("travelClass", "All classes");
			}
		} else if (transportType) {
			// If switching away from train and previous class was a train class, reset to 'Economy'
			if (trainClasses.includes(currentClass)) {
				form.setValue("travelClass", "Economy");
			}
		}
	}, [transportType, form]);

	// Calculate price with transport multiplier
	const getTransportMultiplier = () => {
		switch (transportType) {
			case "air":
				return 2.5;
			case "train":
				return 1.2;
			case "bus":
				return 0.8;
			case "road":
				return 1.8;
			default:
				return 1.0;
		}
	};

	const basePrice = destination ? destination.price * (travelers || 1) : 0;
	const transportCost = basePrice * (getTransportMultiplier() - 1);
	const totalPrice = basePrice + transportCost;

	useEffect(() => {
		if (id) {
			setLoading(true);
			fetch(`/api/travel/${id}`)
				.then((res) => {
					if (!res.ok) throw new Error("Failed to fetch destination");
					return res.json();
				})
				.then(setDestination)
				.catch((error) => {
					console.error(error);
					toast.error("Failed to load destination details");
					router.push("/travel-portal/destinations");
				})
				.finally(() => setLoading(false));
		}
	}, [id, router]);

	const onSubmit = async (data: BookingFormData) => {
		if (!data.transportType) {
			toast.error("Please select a transportation mode");
			return;
		}

		setSubmitting(true);

		const bookingData = {
			userId: "1", // TODO: Replace with actual user ID from session
			destinationId: id,
			destination: destination?.name,
			name: data.name,
			email: data.email,
			phone: data.phone,
			fromLocation: data.fromLocation,
			transportType: data.transportType,
			travelClass: data.travelClass || "",
			travelDate: data.travelDate,
			returnDate: data.returnDate,
			departureTime: data.departureTime,
			travelers: data.travelers,
			totalAmount: totalPrice,
		};

		try {
			const res = await fetch("/api/travel/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingData),
			});

			const result = await res.json();

			if (res.ok) {
				setShowSuccessDialog(true);
				form.reset();
				toast.success("Booking confirmed successfully!");
			} else {
				toast.error(result.error || "Booking failed. Please try again.");
			}
		} catch (error) {
			console.error("Booking error:", error);
			toast.error("An error occurred. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<Skeleton className="h-8 w-32 mb-6" />
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<Skeleton className="h-[600px] w-full" />
						<Skeleton className="h-[600px] w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (!destination) return null;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Back Button */}
				<Button variant="ghost" className="mb-6" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Destination Summary */}
					<div className="lg:col-span-1">
						<Card className="lg:sticky lg:top-6">
							<CardHeader>
								<div className="space-y-2">
									<Badge className="w-fit">{destination.category}</Badge>
									<CardTitle className="text-xl">{destination.name}</CardTitle>
									<div className="flex items-center text-muted-foreground text-sm">
										<MapPin className="h-4 w-4 mr-1 text-red-500" />
										<span>{destination.location}</span>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<Image
									src={destination.image}
									alt={destination.name}
									width={400}
									height={192}
									className="w-full h-48 object-cover rounded-lg"
								/>

								<div>
									<h3 className="font-semibold text-sm mb-2">
										Package Includes
									</h3>
									<div className="space-y-1.5">
										{[
											"Guided Tours",
											"Accommodation",
											"Local Transport",
											"Meals",
										].map((item) => (
											<div key={item} className="flex items-center gap-2">
												<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
												<span className="text-xs text-muted-foreground">
													{item}
												</span>
											</div>
										))}
									</div>
								</div>

								<Separator />

								{/* Price Summary - Moved here */}
								<div className="space-y-3">
									<h4 className="font-semibold text-sm">Price Summary</h4>

									<div className="space-y-2 text-xs">
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Base package
											</span>
											<div className="flex items-center font-medium">
												<IndianRupee className="h-3 w-3" />
												<span>{destination.price.toLocaleString("en-IN")}</span>
											</div>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Travelers</span>
											<span className="font-medium">× {travelers || 1}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Subtotal</span>
											<div className="flex items-center font-medium">
												<IndianRupee className="h-3 w-3" />
												<span>{basePrice.toLocaleString("en-IN")}</span>
											</div>
										</div>

										{transportType && (
											<>
												<Separator />
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Transport (
														{transportType === "air"
															? "Air"
															: transportType === "train"
															? "Train"
															: transportType === "bus"
															? "Bus"
															: "Road"}
														)
													</span>
													<div className="flex items-center font-medium text-blue-600">
														<IndianRupee className="h-3 w-3" />
														<span>
															+{transportCost.toLocaleString("en-IN")}
														</span>
													</div>
												</div>
											</>
										)}
									</div>

									<Separator />
									<div className="flex justify-between items-center pt-1">
										<span className="font-semibold text-sm">Total Amount</span>
										<div className="flex items-center text-xl font-bold text-primary">
											<IndianRupee className="h-5 w-5" />
											<span>{totalPrice.toLocaleString("en-IN")}</span>
										</div>
									</div>

									{!transportType && (
										<p className="text-xs text-orange-600 text-center pt-2">
											Select transport mode to see final price
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Middle & Right Column - Booking Form */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Complete Your Booking</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Fill in your details to book this amazing journey
								</p>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-8"
									>
										{/* Step 1: Personal Information */}
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
													1
												</div>
												<h3 className="font-semibold text-lg">
													Personal Information
												</h3>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
												<FormField
													control={form.control}
													name="name"
													rules={{
														required: "Name is required",
														minLength: {
															value: 2,
															message: "Name must be at least 2 characters",
														},
													}}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Full Name *</FormLabel>
															<FormControl>
																<Input placeholder="John Doe" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="phone"
													rules={{
														required: "Phone number is required",
														pattern: {
															value: /^[0-9]{10}$/,
															message:
																"Please enter a valid 10-digit phone number",
														},
													}}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Phone Number *</FormLabel>
															<FormControl>
																<Input
																	type="tel"
																	placeholder="9876543210"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="pl-11">
												<FormField
													control={form.control}
													name="email"
													rules={{
														required: "Email is required",
														pattern: {
															value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
															message: "Invalid email address",
														},
													}}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Email Address *</FormLabel>
															<FormControl>
																<Input
																	type="email"
																	placeholder="john@example.com"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																Booking confirmation will be sent here
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										<Separator />

										{/* Step 2: Transportation Selection */}
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
													2
												</div>
												<h3 className="font-semibold text-lg">
													Choose Transportation
												</h3>
											</div>

											<div className="pl-11">
												<FormField
													control={form.control}
													name="transportType"
													rules={{
														required: "Please select a transportation mode",
													}}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																{destination && (
																	<TransportSelector
																		destination={destination}
																		selectedTransport={field.value}
																		onTransportChange={field.onChange}
																	/>
																)}
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										<Separator />

										{/* Step 3: Travel Details */}
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
													3
												</div>
												<h3 className="font-semibold text-lg">
													Travel Details
												</h3>
											</div>

											<div className="space-y-4 pl-11">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name="fromLocation"
														rules={{
															required: "Starting location is required",
														}}
														render={({ field }) => (
															<FormItem>
																<FormLabel>From Location *</FormLabel>
																<FormControl>
																	<Input
																		placeholder="e.g., Delhi, Mumbai"
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<div className="flex items-center">
														<div className="text-sm">
															<span className="text-muted-foreground">
																To:{" "}
															</span>
															<span className="font-medium">
																{destination?.location}
															</span>
														</div>
													</div>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name="travelDate"
														rules={{
															required: "Departure date is required",
														}}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Departure Date *</FormLabel>
																<FormControl>
																	<Input type="date" min={today} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name="returnDate"
														rules={{
															required: "Return date is required",
															validate: (value) => {
																const travelDate = form.getValues("travelDate");
																if (value && travelDate && value < travelDate) {
																	return "Return date must be after departure date";
																}
																return true;
															},
														}}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Return Date *</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		min={tomorrowStr}
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name="departureTime"
														rules={{
															required: "Preferred departure time is required",
														}}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Departure Time *</FormLabel>
																<FormControl>
																	<Input type="time" {...field} />
																</FormControl>
																<FormDescription className="text-xs">
																	Approximate - depends on availability
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name="travelers"
														rules={{
															required: "Number of travelers is required",
															min: {
																value: 1,
																message: "At least 1 traveler is required",
															},
															max: {
																value: 20,
																message: "Maximum 20 travelers allowed",
															},
														}}
														render={() => (
															<FormItem>
																<FormLabel>Travellers & Class</FormLabel>
																<FormControl>
																	<TravellerSelector
																		travellers={travelers || 1}
																		travelClass={travelClass || "Economy"}
																		transportType={transportType}
																		onTravellersChange={(
																			count: TravellerCount
																		) =>
																			form.setValue(
																				"travelers",
																				count.adults +
																					count.children +
																					count.infants
																			)
																		}
																		onClassChange={(cls: string) =>
																			form.setValue("travelClass", cls)
																		}
																	/>
																</FormControl>
																<FormDescription className="text-xs">
																	Group discounts for 4+ travelers
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>
											</div>
										</div>

										{/* Submit Button */}
										<div className="pt-4">
											<Button
												type="submit"
												className="w-full"
												size="lg"
												disabled={submitting}
											>
												{submitting ? (
													<>
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														Processing Booking...
													</>
												) : (
													<>Confirm Booking</>
												)}
											</Button>

											<p className="text-xs text-center text-muted-foreground mt-3">
												By booking, you agree to our terms and conditions. Free
												cancellation up to 24 hours before departure.
											</p>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Success Dialog */}
			<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
				<DialogContent>
					<DialogHeader>
						<div className="flex justify-center mb-4">
							<div className="rounded-full bg-green-100 p-3">
								<CheckCircle2 className="h-8 w-8 text-green-600" />
							</div>
						</div>
						<DialogTitle className="text-center text-2xl">
							Booking Confirmed!
						</DialogTitle>
						<DialogDescription className="text-center space-y-4">
							<p>
								Your trip to <strong>{destination.name}</strong> has been
								successfully booked.
							</p>
							<p>A confirmation email has been sent with all the details.</p>
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3 mt-4">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowSuccessDialog(false);
								router.push("/travel-portal/my-trips");
							}}
						>
							View My Trips
						</Button>
						<Button
							className="flex-1"
							onClick={() => {
								setShowSuccessDialog(false);
								router.push("/travel-portal/destinations");
							}}
						>
							Explore More
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
