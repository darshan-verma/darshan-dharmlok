"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Mail, Phone, AlertCircle } from "lucide-react";

interface TravellerFormData {
	ti: string;
	pt: "ADULT" | "CHILD";
	fN: string;
	lN: string;
	pan?: string;
	pNum?: string;
}

interface RoomTravellerData {
	travellerInfo: TravellerFormData[];
}

interface DeliveryData {
	emails: string[];
	contacts: string[];
	code: string[];
}

interface RoomConfig {
	adults: number;
	children: number;
}

interface TripjackHotelGuestFormProps {
	rooms: RoomConfig[];
	panRequired: boolean;
	passportRequired: boolean;
	totalAmount: number;
	currency: string;
	onSubmit: (data: {
		roomTravellerInfo: RoomTravellerData[];
		deliveryInfo: DeliveryData;
		isHoldBooking: boolean;
	}) => void;
	isSubmitting: boolean;
}

const ADULT_TITLES = ["Mr", "Mrs", "Ms", "Miss"];
const CHILD_TITLES = ["Master", "Miss"];

export default function TripjackHotelGuestForm({
	rooms,
	panRequired,
	passportRequired,
	totalAmount,
	currency,
	onSubmit,
	isSubmitting,
}: TripjackHotelGuestFormProps) {
	const [roomTravellers, setRoomTravellers] = useState<RoomTravellerData[]>([]);
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [dialCode, setDialCode] = useState("+91");
	const [errors, setErrors] = useState<string[]>([]);
	const [isHoldBooking, setIsHoldBooking] = useState(false);

	// Initialize form state from room config
	useEffect(() => {
		const initial = rooms.map((room) => {
			const travellers: TravellerFormData[] = [];
			for (let i = 0; i < room.adults; i++) {
				travellers.push({ ti: "Mr", pt: "ADULT", fN: "", lN: "" });
			}
			for (let i = 0; i < room.children; i++) {
				travellers.push({ ti: "Master", pt: "CHILD", fN: "", lN: "" });
			}
			return { travellerInfo: travellers };
		});
		setRoomTravellers(initial);
	}, [rooms]);

	const updateTraveller = (
		roomIdx: number,
		travIdx: number,
		field: keyof TravellerFormData,
		value: string,
	) => {
		setRoomTravellers((prev) => {
			const updated = prev.map((room, ri) => {
				if (ri !== roomIdx) return room;
				return {
					travellerInfo: room.travellerInfo.map((t, ti) => {
						if (ti !== travIdx) return t;
						return { ...t, [field]: value };
					}),
				};
			});
			return updated;
		});
	};

	const validate = (): string[] => {
		const errs: string[] = [];

		// Validate travellers
		const leadNames = new Set<string>();
		for (let ri = 0; ri < roomTravellers.length; ri++) {
			const room = roomTravellers[ri];
			for (let ti = 0; ti < room.travellerInfo.length; ti++) {
				const t = room.travellerInfo[ti];
				if (!t.fN.trim())
					errs.push(`Room ${ri + 1}, Guest ${ti + 1}: First name is required`);
				if (!t.lN.trim())
					errs.push(`Room ${ri + 1}, Guest ${ti + 1}: Last name is required`);
				if (panRequired && !t.pan?.trim()) {
					errs.push(`Room ${ri + 1}, Guest ${ti + 1}: PAN number is required`);
				}
				if (passportRequired && !t.pNum?.trim()) {
					errs.push(
						`Room ${ri + 1}, Guest ${ti + 1}: Passport number is required`,
					);
				}
			}

			// Lead pax (first adult) name must be unique across rooms
			if (room.travellerInfo.length > 0) {
				const lead = room.travellerInfo[0];
				const leadKey = `${lead.fN.trim().toLowerCase()}_${lead.lN.trim().toLowerCase()}`;
				if (leadKey !== "_" && leadNames.has(leadKey)) {
					errs.push(
						`Room ${ri + 1}: Lead guest name must be unique across rooms`,
					);
				}
				leadNames.add(leadKey);
			}
		}

		// Validate delivery info
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errs.push("A valid email address is required");
		}
		if (!phone.trim() || !/^\d{7,15}$/.test(phone.trim())) {
			errs.push("A valid phone number is required (7-15 digits)");
		}

		return errs;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const validationErrors = validate();
		setErrors(validationErrors);

		if (validationErrors.length > 0) return;

		onSubmit({
			roomTravellerInfo: roomTravellers,
			deliveryInfo: {
				emails: [email.trim()],
				contacts: [phone.trim()],
				code: [dialCode],
			},
			isHoldBooking,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Guest Details per Room */}
			{roomTravellers.map((room, roomIdx) => (
				<Card key={roomIdx}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Users className="w-5 h-5" />
							Room {roomIdx + 1} — Guest Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{room.travellerInfo.map((traveller, travIdx) => {
							const titles =
								traveller.pt === "CHILD" ? CHILD_TITLES : ADULT_TITLES;
							return (
								<div
									key={travIdx}
									className="border rounded-lg p-4 space-y-4 bg-gray-50"
								>
									<p className="text-sm font-medium text-gray-700">
										{traveller.pt === "ADULT" ? "Adult" : "Child"} {travIdx + 1}
										{travIdx === 0 && traveller.pt === "ADULT" && (
											<span className="text-blue-600 ml-1">(Lead Guest)</span>
										)}
									</p>
									<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
										<div>
											<Label>Title</Label>
											<Select
												value={traveller.ti}
												onValueChange={(v) =>
													updateTraveller(roomIdx, travIdx, "ti", v)
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{titles.map((t) => (
														<SelectItem key={t} value={t}>
															{t}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="sm:col-span-1">
											<Label>First Name</Label>
											<Input
												value={traveller.fN}
												onChange={(e) =>
													updateTraveller(
														roomIdx,
														travIdx,
														"fN",
														e.target.value,
													)
												}
												placeholder="First name"
												required
											/>
										</div>
										<div className="sm:col-span-1">
											<Label>Last Name</Label>
											<Input
												value={traveller.lN}
												onChange={(e) =>
													updateTraveller(
														roomIdx,
														travIdx,
														"lN",
														e.target.value,
													)
												}
												placeholder="Last name"
												required
											/>
										</div>
										<div className="sm:col-span-1">
											{/* Spacer for alignment */}
										</div>
									</div>

									{/* Conditional PAN */}
									{panRequired && (
										<div className="max-w-xs">
											<Label>PAN Number</Label>
											<Input
												value={traveller.pan || ""}
												onChange={(e) =>
													updateTraveller(
														roomIdx,
														travIdx,
														"pan",
														e.target.value.toUpperCase(),
													)
												}
												placeholder="AAACA1111A"
												maxLength={10}
												pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
											/>
										</div>
									)}

									{/* Conditional Passport */}
									{passportRequired && (
										<div className="max-w-xs">
											<Label>Passport Number</Label>
											<Input
												value={traveller.pNum || ""}
												onChange={(e) =>
													updateTraveller(
														roomIdx,
														travIdx,
														"pNum",
														e.target.value.toUpperCase(),
													)
												}
												placeholder="Passport number"
											/>
										</div>
									)}
								</div>
							);
						})}
					</CardContent>
				</Card>
			))}

			{/* Contact / Delivery Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Mail className="w-5 h-5" />
						Contact Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<Label>Email Address</Label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="[email protected]"
								required
							/>
						</div>
						<div>
							<Label>Phone Number</Label>
							<div className="flex gap-2">
								<Select value={dialCode} onValueChange={(v) => setDialCode(v)}>
									<SelectTrigger className="w-24">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="+91">+91</SelectItem>
										<SelectItem value="+1">+1</SelectItem>
										<SelectItem value="+44">+44</SelectItem>
										<SelectItem value="+971">+971</SelectItem>
										<SelectItem value="+61">+61</SelectItem>
										<SelectItem value="+65">+65</SelectItem>
									</SelectContent>
								</Select>
								<div className="flex-1">
									<Input
										type="tel"
										value={phone}
										onChange={(e) =>
											setPhone(e.target.value.replace(/\D/g, ""))
										}
										placeholder="Phone number"
										required
									/>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Booking Type Toggle */}
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-gray-900">Booking Type</p>
							<p className="text-sm text-gray-500">
								{isHoldBooking
									? "Hold the room without payment. Confirm before the deadline."
									: "Instant booking — room is confirmed immediately with payment."}
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								variant={!isHoldBooking ? "default" : "outline"}
								size="sm"
								onClick={() => setIsHoldBooking(false)}
							>
								Instant Book
							</Button>
							<Button
								type="button"
								variant={isHoldBooking ? "default" : "outline"}
								size="sm"
								onClick={() => setIsHoldBooking(true)}
							>
								Hold Room
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Validation Errors */}
			{errors.length > 0 && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<ul className="list-disc list-inside space-y-1">
							{errors.map((err, i) => (
								<li key={i} className="text-sm">
									{err}
								</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Submit */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-600">Total Amount</p>
					<p className="text-2xl font-bold text-blue-600">
						{currency === "INR" ? "₹" : currency}{" "}
						{totalAmount.toLocaleString("en-IN")}
					</p>
				</div>
				<Button
					type="submit"
					size="lg"
					className="bg-blue-600 hover:bg-blue-700 px-8"
					disabled={isSubmitting}
				>
					<Phone className="w-4 h-4 mr-2" />
					{isSubmitting
						? "Processing..."
						: isHoldBooking
							? "Hold Room"
							: "Book Now"}
				</Button>
			</div>
		</form>
	);
}
