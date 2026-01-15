"use client";

import { useState } from "react";
import { Eye, Plane, Hotel, Calendar, User, DollarSign, Shield, ExternalLink } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TravelLog } from "../../travel-logs/page";

interface TravelLogsTableProps {
	logs: TravelLog[];
}

interface SSRItem {
	SeatID?: string;
	Id?: string;
	Price?: number;
	[key: string]: unknown;
}

export default function TravelLogsTable({ logs }: TravelLogsTableProps) {
	const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatCurrency = (amount?: number, currency?: string) => {
		if (!amount && amount !== 0) return "N/A";
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: currency || "INR",
		}).format(amount || 0);
	};

	const getLogTypeIcon = (logType: string) => {
		return logType === "flight" ? (
			<Plane className="h-4 w-4 text-blue-500" />
		) : (
			<Hotel className="h-4 w-4 text-green-500" />
		);
	};

	const getLogTypeBadge = (logType: string) => {
		return logType === "flight" ? (
			<span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
				Flight
			</span>
		) : (
			<span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
				Hotel
			</span>
		);
	};

	const getActionBadge = (action: string) => {
		const colors: Record<string, string> = {
			booking: "bg-purple-100 text-purple-800",
			search: "bg-yellow-100 text-yellow-800",
			selection: "bg-gray-100 text-gray-800",
		};
		return (
			<span
				className={`px-2 py-1 text-xs font-semibold rounded ${
					colors[action] || "bg-gray-100 text-gray-800"
				}`}
			>
				{action.charAt(0).toUpperCase() + action.slice(1)}
			</span>
		);
	};

	const handleViewDetails = (log: TravelLog) => {
		setSelectedLog(log);
		setIsDialogOpen(true);
	};

	return (
		<>
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Provider</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-8 text-gray-500">
									No travel logs found
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
							<TableRow key={log.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										{getLogTypeIcon(log.logType)}
										{getLogTypeBadge(log.logType)}
										{(log.bookingCode || log.traceId) && (
											<Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
												<Shield className="h-3 w-3 mr-1" />
												Audit
											</Badge>
										)}
									</div>
								</TableCell>
									<TableCell>{getActionBadge(log.action)}</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">
												{log.userName || log.userEmail || "Guest"}
											</span>
											{log.userEmail && log.userName && (
												<span className="text-xs text-gray-500">
													{log.userEmail}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm">{log.provider || "N/A"}</span>
									</TableCell>
									<TableCell>
										{log.totalAmount
											? formatCurrency(log.totalAmount, log.currency)
											: "N/A"}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1 text-sm">
											<Calendar className="h-3 w-3 text-gray-400" />
											{formatDate(log.createdAt)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleViewDetails(log)}
											>
												<Eye className="h-4 w-4 mr-1" />
												View
											</Button>
											{(log.bookingCode || log.traceId) && (
												<Link
													href={`/admin/bookings/${
														log.bookingCode || log.traceId
													}/audit`}
												>
													<Button 
														variant="outline" 
														size="sm"
														className="border-blue-200 text-blue-700 hover:bg-blue-50"
													>
														<Shield className="h-4 w-4 mr-1" />
														Audit Trail
													</Button>
												</Link>
											)}
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Details Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Travel Log Details</DialogTitle>
						<DialogDescription>
							Complete information about this travel activity
						</DialogDescription>
					</DialogHeader>
					{selectedLog && (
						<div className="space-y-4 mt-4">
							{/* Basic Info */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-gray-500">Type</label>
									<div className="mt-1">{getLogTypeBadge(selectedLog.logType)}</div>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">Action</label>
									<div className="mt-1">{getActionBadge(selectedLog.action)}</div>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">Provider</label>
									<div className="mt-1">{selectedLog.provider || "N/A"}</div>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">Date</label>
									<div className="mt-1">{formatDate(selectedLog.createdAt)}</div>
								</div>
							</div>

							{/* User Info */}
							<div className="border-t pt-4">
								<h3 className="font-semibold mb-2 flex items-center gap-2">
									<User className="h-4 w-4" />
									User Information
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-gray-500">Name</label>
										<div className="mt-1">{selectedLog.userName || "N/A"}</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-500">Email</label>
										<div className="mt-1">{selectedLog.userEmail || "N/A"}</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-500">User ID</label>
										<div className="mt-1 text-xs font-mono">
											{selectedLog.userId || "N/A"}
										</div>
									</div>
								</div>
							</div>

							{/* Flight Data */}
							{selectedLog.logType === "flight" && selectedLog.flightData && (() => {
								const flightData = selectedLog.flightData;
								const origin = typeof flightData.origin === "string" ? flightData.origin : null;
								const destination = typeof flightData.destination === "string" ? flightData.destination : null;
								const airline = typeof flightData.airline === "string" ? flightData.airline : null;
								const flightNumber = typeof flightData.flightNumber === "string" ? flightData.flightNumber : null;
								const cabinClass = typeof flightData.cabinClass === "string" ? flightData.cabinClass : null;
								const departureDate = typeof flightData.departureDate === "string" ? flightData.departureDate : null;
								const adultCount = typeof flightData.adultCount === "number" ? flightData.adultCount : undefined;
								const childCount = typeof flightData.childCount === "number" ? flightData.childCount : undefined;
								
								return (
									<div className="border-t pt-4">
										<h3 className="font-semibold mb-2 flex items-center gap-2">
											<Plane className="h-4 w-4" />
											Flight Details
										</h3>
										<div className="grid grid-cols-2 gap-4">
											{origin && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Origin
													</label>
													<div className="mt-1">{origin}</div>
												</div>
											)}
											{destination && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Destination
													</label>
													<div className="mt-1">
														{destination}
													</div>
												</div>
											)}
											{airline && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Airline
													</label>
													<div className="mt-1">{airline}</div>
												</div>
											)}
											{flightNumber && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Flight Number
													</label>
													<div className="mt-1">
														{flightNumber}
													</div>
												</div>
											)}
											{cabinClass && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Cabin Class
													</label>
													<div className="mt-1">
														{cabinClass}
													</div>
												</div>
											)}
											{departureDate && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Departure
													</label>
													<div className="mt-1">
														{departureDate}
													</div>
												</div>
											)}
											{adultCount !== undefined && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Adults
													</label>
													<div className="mt-1">
														{adultCount}
													</div>
												</div>
											)}
											{childCount !== undefined && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Children
													</label>
													<div className="mt-1">
														{childCount}
													</div>
												</div>
											)}
										</div>

									{/* Seat and Meal Selections */}
									{(() => {
										const seats = flightData && flightData.seats && typeof flightData.seats === "object" && !Array.isArray(flightData.seats)
											? flightData.seats as Record<string, SSRItem>
											: null;
										const meals = flightData && flightData.meals && typeof flightData.meals === "object" && !Array.isArray(flightData.meals)
											? flightData.meals as Record<string, SSRItem>
											: null;
										const baggage = flightData && flightData.baggage && typeof flightData.baggage === "object" && !Array.isArray(flightData.baggage)
											? flightData.baggage as Record<string, SSRItem>
											: null;
										
										if (!seats && !meals && !baggage) return null;
										
										return (
											<div className="mt-4 space-y-2">
												{seats && Object.keys(seats).length > 0 && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Selected Seats
														</label>
														<div className="mt-1 text-sm">
															{Object.entries(seats).map(
																([key, seat]: [string, SSRItem]) => (
																	<div key={key} className="flex justify-between">
																		<span>{key}:</span>
																		<span>
																			{seat?.SeatID || "N/A"} -{" "}
																			{formatCurrency(seat?.Price)}
																		</span>
																	</div>
																)
															)}
														</div>
													</div>
												)}
												{meals && Object.keys(meals).length > 0 && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Selected Meals
														</label>
														<div className="mt-1 text-sm">
															{Object.entries(meals).map(
																([key, meal]: [string, SSRItem]) => (
																	<div key={key} className="flex justify-between">
																		<span>{key}:</span>
																		<span>
																			{meal?.Id || "N/A"} -{" "}
																			{formatCurrency(meal?.Price)}
																		</span>
																	</div>
																)
															)}
														</div>
													</div>
												)}
												{baggage && Object.keys(baggage).length > 0 && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Selected Baggage
														</label>
														<div className="mt-1 text-sm">
															{Object.entries(baggage).map(
																([key, baggageItem]: [string, SSRItem]) => (
																	<div key={key} className="flex justify-between">
																		<span>{key}:</span>
																		<span>
																			{baggageItem?.Id || "N/A"} -{" "}
																			{formatCurrency(baggageItem?.Price)}
																		</span>
																	</div>
																)
															)}
														</div>
													</div>
												)}
											</div>
										);
									})()}

									{/* Pricing */}
									{(() => {
										if (!flightData) return null;
										const totalFare = typeof flightData.totalFare === "number" ? flightData.totalFare : null;
										const totalTax = typeof flightData.totalTax === "number" ? flightData.totalTax : null;
										const totalSeatCharges = typeof flightData.totalSeatCharges === "number" ? flightData.totalSeatCharges : null;
										const totalMealCharges = typeof flightData.totalMealCharges === "number" ? flightData.totalMealCharges : null;
										
										if (!totalFare && !totalTax && !totalSeatCharges && !totalMealCharges) return null;
										
										return (
											<div className="mt-4 grid grid-cols-2 gap-4">
												{totalFare !== null && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Base Fare
														</label>
														<div className="mt-1">
															{formatCurrency(totalFare)}
														</div>
													</div>
												)}
												{totalTax !== null && (
													<div>
														<label className="text-sm font-medium text-gray-500">Tax</label>
														<div className="mt-1">
															{formatCurrency(totalTax)}
														</div>
													</div>
												)}
												{totalSeatCharges !== null && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Seat Charges
														</label>
														<div className="mt-1">
															{formatCurrency(totalSeatCharges)}
														</div>
													</div>
												)}
												{totalMealCharges !== null && (
													<div>
														<label className="text-sm font-medium text-gray-500">
															Meal Charges
														</label>
														<div className="mt-1">
															{formatCurrency(totalMealCharges)}
														</div>
													</div>
												)}
											</div>
										);
									})()}
									</div>
								);
							})()}

							{/* Hotel Data */}
							{selectedLog.logType === "hotel" && selectedLog.hotelData && (() => {
								if (!selectedLog.hotelData) return null;
								const hotelData = selectedLog.hotelData;
								const hotelName = typeof hotelData.hotelName === "string" ? hotelData.hotelName : null;
								const hotelCode = typeof hotelData.hotelCode === "string" ? hotelData.hotelCode : null;
								const cityName = typeof hotelData.cityName === "string" ? hotelData.cityName : null;
								const countryCode = typeof hotelData.countryCode === "string" ? hotelData.countryCode : null;
								const checkIn = typeof hotelData.checkIn === "string" ? hotelData.checkIn : null;
								const checkOut = typeof hotelData.checkOut === "string" ? hotelData.checkOut : null;
								const totalFare = typeof hotelData.totalFare === "number" ? hotelData.totalFare : null;
								const totalTax = typeof hotelData.totalTax === "number" ? hotelData.totalTax : null;
								
								return (
									<div className="border-t pt-4">
										<h3 className="font-semibold mb-2 flex items-center gap-2">
											<Hotel className="h-4 w-4" />
											Hotel Details
										</h3>
										<div className="grid grid-cols-2 gap-4">
											{hotelName && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Hotel Name
													</label>
													<div className="mt-1">{hotelName}</div>
												</div>
											)}
											{hotelCode && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Hotel Code
													</label>
													<div className="mt-1">{hotelCode}</div>
												</div>
											)}
											{cityName && (
												<div>
													<label className="text-sm font-medium text-gray-500">City</label>
													<div className="mt-1">{cityName}</div>
												</div>
											)}
											{countryCode && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Country
													</label>
													<div className="mt-1">
														{countryCode}
													</div>
												</div>
											)}
											{checkIn && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Check In
													</label>
													<div className="mt-1">{checkIn}</div>
												</div>
											)}
											{checkOut && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Check Out
													</label>
													<div className="mt-1">{checkOut}</div>
												</div>
											)}
											{totalFare !== null && (
												<div>
													<label className="text-sm font-medium text-gray-500">
														Total Fare
													</label>
													<div className="mt-1">
														{formatCurrency(totalFare)}
													</div>
												</div>
											)}
											{totalTax !== null && (
												<div>
													<label className="text-sm font-medium text-gray-500">Tax</label>
													<div className="mt-1">
														{formatCurrency(totalTax)}
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})()}

							{/* Booking Info */}
							<div className="border-t pt-4">
								<h3 className="font-semibold mb-2 flex items-center gap-2">
									<DollarSign className="h-4 w-4" />
									Booking Information
								</h3>
								<div className="grid grid-cols-2 gap-4">
									{selectedLog.bookingCode && (
										<div>
											<label className="text-sm font-medium text-gray-500">
												Booking Code
											</label>
											<div className="mt-1 font-mono text-sm">
												{selectedLog.bookingCode}
											</div>
										</div>
									)}
									{selectedLog.traceId && (
										<div>
											<label className="text-sm font-medium text-gray-500">
												Trace ID
											</label>
											<div className="mt-1 font-mono text-xs">
												{selectedLog.traceId}
											</div>
										</div>
									)}
									{selectedLog.totalAmount && (
										<div>
											<label className="text-sm font-medium text-gray-500">
												Total Amount
											</label>
											<div className="mt-1 font-semibold">
												{formatCurrency(selectedLog.totalAmount, selectedLog.currency)}
											</div>
										</div>
									)}
								</div>
								
								{/* Audit Trail Link */}
								{(selectedLog.bookingCode || selectedLog.traceId) && (
									<div className="mt-4 pt-4 border-t">
										<div className="flex items-center justify-between">
											<div>
												<label className="text-sm font-medium text-gray-500">
													Audit Trail
												</label>
												<p className="text-xs text-muted-foreground mt-1">
													View complete snapshot audit trail for legal defense
												</p>
											</div>
											<Link
												href={`/admin/bookings/${
													selectedLog.bookingCode || selectedLog.traceId
												}/audit`}
											>
												<Button variant="default" size="sm">
													<Shield className="h-4 w-4 mr-2" />
													View Audit Trail
													<ExternalLink className="h-3 w-3 ml-2" />
												</Button>
											</Link>
										</div>
									</div>
								)}
							</div>

							{/* Metadata */}
							{selectedLog.metadata && (
								<div className="border-t pt-4">
									<h3 className="font-semibold mb-2">Additional Information</h3>
									<pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
										{JSON.stringify(selectedLog.metadata, null, 2)}
									</pre>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
