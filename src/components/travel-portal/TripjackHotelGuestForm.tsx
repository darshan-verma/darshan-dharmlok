"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HotelGuestTripSummary from "@/components/travel-portal/HotelGuestTripSummary";
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
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";
import { cn } from "@/lib/utils";

/** Consistent field spacing — avoids cramped labels/placeholders in guest forms */
const GUEST_FIELD = "flex flex-col gap-2";
const GUEST_LABEL = "text-sm font-medium text-gray-700";
const GUEST_INPUT = cn(
	"h-10 w-full min-w-0 rounded-md border border-input bg-white px-3.5 py-2 text-sm shadow-xs",
	"placeholder:text-muted-foreground",
);
const GUEST_SELECT = "h-10 w-full px-3.5";

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
	checkIn?: string | null;
	checkOut?: string | null;
	roomsCount?: number;
	adultsCount?: number;
	childrenCount?: number;
	panRequired: boolean;
	passportRequired: boolean;
	totalAmount: number;
	currency: string;
	showHoldBooking?: boolean;
	submitLabel?: string;
	onSubmit: (data: {
		roomTravellerInfo: RoomTravellerData[];
		deliveryInfo: DeliveryData;
		isHoldBooking: boolean;
	}) => void;
	isSubmitting: boolean;
}

const ADULT_TITLES = ["Mr", "Mrs", "Ms", "Miss"];
const CHILD_TITLES = ["Master", "Miss"];
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function leadAdultIndex(travellers: TravellerFormData[]): number {
	return travellers.findIndex((t) => t.pt === "ADULT");
}

export default function TripjackHotelGuestForm({
	rooms,
	checkIn = null,
	checkOut = null,
	roomsCount,
	adultsCount,
	childrenCount,
	panRequired,
	passportRequired,
	totalAmount,
	currency,
	showHoldBooking = true,
	submitLabel,
	onSubmit,
	isSubmitting,
}: TripjackHotelGuestFormProps) {
	const { data: session } = useSession();
	const [roomTravellers, setRoomTravellers] = useState<RoomTravellerData[]>([]);
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [dialCode, setDialCode] = useState("+91");
	const [errors, setErrors] = useState<string[]>([]);
	const [isHoldBooking, setIsHoldBooking] = useState(false);

	const totalAdults = adultsCount ?? rooms.reduce((s, r) => s + r.adults, 0);
	const totalChildren =
		childrenCount ?? rooms.reduce((s, r) => s + r.children, 0);
	const totalRooms = roomsCount ?? rooms.length;

	useEffect(() => {
		const sessionEmail = session?.user?.email?.trim();
		if (sessionEmail && !email) {
			setEmail(sessionEmail);
		}
	}, [session?.user?.email, email]);

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
				const leadIdx = leadAdultIndex(room.travellerInfo);
				if (
					panRequired &&
					ti === leadIdx &&
					t.pt === "ADULT" &&
					!t.pan?.trim()
				) {
					errs.push(
						`Room ${ri + 1}: Lead guest PAN is required for this hotel`,
					);
				}
				if (
					panRequired &&
					ti === leadIdx &&
					t.pt === "ADULT" &&
					t.pan?.trim() &&
					!PAN_REGEX.test(t.pan.trim().toUpperCase())
				) {
					errs.push(
						`Room ${ri + 1}: Enter a valid PAN (e.g. ABCDE1234F) for the lead guest`,
					);
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

		const roomTravellerInfo = roomTravellers.map((room) => ({
			travellerInfo: room.travellerInfo.map((t, ti) => {
				const leadIdx = leadAdultIndex(room.travellerInfo);
				const base: TravellerFormData = {
					ti: t.ti,
					pt: t.pt,
					fN: t.fN.trim(),
					lN: t.lN.trim(),
				};
				if (
					panRequired &&
					t.pt === "ADULT" &&
					ti === leadIdx &&
					t.pan?.trim()
				) {
					base.pan = t.pan.trim().toUpperCase();
				}
				if (passportRequired && t.pNum?.trim()) {
					base.pNum = t.pNum.trim().toUpperCase();
				}
				return base;
			}),
		}));

		onSubmit({
			roomTravellerInfo,
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
			<HotelGuestTripSummary
				checkIn={checkIn}
				checkOut={checkOut}
				rooms={totalRooms}
				adults={totalAdults}
				childCount={totalChildren}
			/>

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
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										<div className={GUEST_FIELD}>
											<Label className={GUEST_LABEL}>Title</Label>
											<Select
												value={traveller.ti}
												onValueChange={(v) =>
													updateTraveller(roomIdx, travIdx, "ti", v)
												}
											>
												<SelectTrigger className={GUEST_SELECT}>
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
										<div className={GUEST_FIELD}>
											<Label className={GUEST_LABEL}>First Name</Label>
											<Input
												className={GUEST_INPUT}
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
										<div className={GUEST_FIELD}>
											<Label className={GUEST_LABEL}>Last Name</Label>
											<Input
												className={GUEST_INPUT}
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
									</div>

									{/* Conditional PAN */}
									{panRequired &&
										traveller.pt === "ADULT" &&
										travIdx === leadAdultIndex(room.travellerInfo) && (
										<div className={cn(GUEST_FIELD, "max-w-sm")}>
											<Label className={GUEST_LABEL}>
												PAN Number (lead guest)
											</Label>
											<Input
												className={GUEST_INPUT}
												value={traveller.pan || ""}
												onChange={(e) =>
													updateTraveller(
														roomIdx,
														travIdx,
														"pan",
														e.target.value
															.toUpperCase()
															.replace(/[^A-Z0-9]/g, ""),
													)
												}
												placeholder="ABCDE1234F"
												maxLength={10}
												autoComplete="off"
												required
											/>
										</div>
									)}

									{/* Conditional Passport */}
									{passportRequired && (
										<div className={cn(GUEST_FIELD, "max-w-sm")}>
											<Label className={GUEST_LABEL}>Passport Number</Label>
											<Input
												className={GUEST_INPUT}
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
						<div className={GUEST_FIELD}>
							<Label className={GUEST_LABEL}>Email Address</Label>
							<Input
								type="email"
								className={GUEST_INPUT}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="[email protected]"
								required
							/>
						</div>
						<div className={GUEST_FIELD}>
							<Label className={GUEST_LABEL}>Phone Number</Label>
							<div className="flex gap-2 items-center">
								<Select value={dialCode} onValueChange={(v) => setDialCode(v)}>
									<SelectTrigger className="h-10 w-[5.25rem] shrink-0 px-2.5">
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
								<Input
									type="tel"
									className={cn(GUEST_INPUT, "flex-1 min-w-0")}
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
				</CardContent>
			</Card>

			{showHoldBooking && (
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
			)}

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
						{currency === "INR"
							? `₹${formatTravelPriceInr(totalAmount)}`
							: `${currency} ${Math.round(totalAmount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
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
						: submitLabel ||
							(isHoldBooking && showHoldBooking ? "Hold Room" : "Book Now")}
				</Button>
			</div>
		</form>
	);
}
