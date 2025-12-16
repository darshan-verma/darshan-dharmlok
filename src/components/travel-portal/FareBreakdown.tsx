"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Info, HelpCircle } from "lucide-react";
import type { FlightResult } from "@/types/tbo";
import {
	getFareBreakdown,
	validateFareCalculations,
} from "@/lib/tboFareCalculations";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface FareBreakdownProps {
	flight: FlightResult;
	agencyMarkup?: number;
	showValidation?: boolean;
}

const InfoTooltip = ({ content }: { content: string }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help inline ml-1" />
			</TooltipTrigger>
			<TooltipContent>
				<p className="max-w-xs text-xs">{content}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);

const SectionHeader = ({
	title,
	isOpen,
	onToggle,
}: {
	title: string;
	isOpen: boolean;
	onToggle: () => void;
}) => (
	<div
		className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
		onClick={onToggle}
	>
		<h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
			{title}
		</h4>
		{isOpen ? (
			<ChevronUp className="h-4 w-4 text-gray-500" />
		) : (
			<ChevronDown className="h-4 w-4 text-gray-500" />
		)}
	</div>
);

export default function FareBreakdown({
	flight,
	agencyMarkup = 0,
	showValidation = false,
}: FareBreakdownProps) {
	const fare = flight.Fare;

	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({
		summary: true,
		priceComponents: false,
		agencyFees: false,
		commission: false,
		tds: false,
		settlement: false,
		airlineTerms: false,
		fareRules: false,
	});

	const [overallExpanded, setOverallExpanded] = useState(false);

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	if (!fare) {
		return (
			<Card className="w-full border-t-4 border-t-red-600 shadow-sm">
				<CardContent className="pt-4">
					<div className="text-center py-8 text-gray-500">
						<Info className="h-12 w-12 mx-auto mb-3 opacity-20" />
						<p>Fare information not available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const breakdown = getFareBreakdown(fare, agencyMarkup);
	const validation = showValidation
		? validateFareCalculations(fare, agencyMarkup)
		: null;

	// Helper for Cabin Class
	const getCabinClass = (code: string | undefined) => {
		switch (code) {
			case "2":
				return "Premium Economy";
			case "3":
				return "Business";
			case "4":
				return "Premium Business";
			case "5":
			case "6":
				return "First";
			default:
				return "Economy";
		}
	};

	return (
		<Card className="w-full border-t-4 border-t-blue-600 shadow-sm">
			<CardHeader className="pb-3 border-b bg-gray-50/50">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						Fare Breakdown
						{validation && !validation.isValid && (
							<Badge variant="destructive" className="text-xs font-normal">
								⚠ Issues Found
							</Badge>
						)}
					</CardTitle>
					<button
						onClick={() => setOverallExpanded(!overallExpanded)}
						className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
					>
						{overallExpanded ? (
							<>
								<span>Collapse</span>
								<ChevronUp className="h-4 w-4" />
							</>
						) : (
							<>
								<span>Expand</span>
								<ChevronDown className="h-4 w-4" />
							</>
						)}
					</button>
				</div>
			</CardHeader>

			<CardContent className="space-y-6 pt-4">
				{!overallExpanded ? (
					<div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
						<div className="flex flex-col items-center justify-center">
							<div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
								Total Fare
								<InfoTooltip content="Total amount payable by customer (Published Fare)" />
							</div>
							<div className="text-3xl font-bold text-blue-700">
								₹{breakdown.publishedFare.toLocaleString()}
							</div>
						</div>
					</div>
				) : (
					<>
						{/* 1. Fare Summary (Customer Price) */}
						<div className="space-y-3">
							<div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
								<div className="flex flex-col items-center justify-center">
									<div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
										Total Fare
										<InfoTooltip content="Total amount payable by customer (Published Fare)" />
									</div>
									<div className="text-3xl font-bold text-blue-700">
										₹{breakdown.publishedFare.toLocaleString()}
									</div>
								</div>
							</div>
						</div>{" "}
						{/* 2. Price Components */}
						<div className="border-b pb-2">
							<SectionHeader
								title="Price Components"
								isOpen={expandedSections.priceComponents}
								onToggle={() => toggleSection("priceComponents")}
							/>
							{expandedSections.priceComponents && (
								<div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm py-2 animate-in slide-in-from-top-2 duration-200">
									<div className="flex justify-between">
										<span className="text-gray-600">Base Fare</span>
										<span className="font-medium">
											₹{breakdown.baseFare.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">
											Airline Surcharges (YQ/YR)
											<InfoTooltip content="Fuel surcharges and other airline fees" />
										</span>
										<span className="font-medium">
											₹{breakdown.yqTax.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">
											Govt. Taxes (GST, Cess)
										</span>
										<span className="font-medium">
											₹{(breakdown.tax + breakdown.gst.total).toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">
											Airport Fees (UDF/PSF)
											<InfoTooltip content="User Development Fee / Passenger Service Fee" />
										</span>
										<span className="font-medium">
											₹{breakdown.otherCharges.toLocaleString()}
										</span>
									</div>
								</div>
							)}
						</div>
						{/* 3. Agency Fees */}
						<div className="border-b pb-2">
							<SectionHeader
								title="Agency Fees"
								isOpen={expandedSections.agencyFees}
								onToggle={() => toggleSection("agencyFees")}
							/>
							{expandedSections.agencyFees && (
								<div className="grid grid-cols-1 gap-2 text-sm py-2 animate-in slide-in-from-top-2 duration-200">
									<div className="flex justify-between">
										<span className="text-gray-600">
											Convenience Fee (OTA Fee)
										</span>
										<span className="font-medium">
											₹{breakdown.fees.serviceFee.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Payment Gateway / UDF</span>
										<span className="font-medium">
											₹{breakdown.fees.additionalTxnFeePub.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">
											Airline Transaction Fee
										</span>
										<span className="font-medium">
											₹{breakdown.fees.airlineTransFee.toLocaleString()}
										</span>
									</div>
								</div>
							)}
						</div>
						{/* 4. Commission & Incentives */}
						<div className="border-b pb-2">
							<SectionHeader
								title="Commission & Incentives"
								isOpen={expandedSections.commission}
								onToggle={() => toggleSection("commission")}
							/>
							{expandedSections.commission && (
								<div className="space-y-3 py-2 animate-in slide-in-from-top-2 duration-200">
									<div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Commission</span>
											<span className="text-green-600 font-medium">
												₹{breakdown.commission.commission.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">
												PLB
												<InfoTooltip content="Productivity Linked Bonus" />
											</span>
											<span className="text-green-600 font-medium">
												₹{breakdown.commission.plb.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">
												Incentive
												<InfoTooltip content="Additional performance-based incentive" />
											</span>
											<span className="text-green-600 font-medium">
												₹{breakdown.commission.incentive.toLocaleString()}
											</span>
										</div>
									</div>
									<div className="bg-green-50 p-3 rounded border border-green-100 flex justify-between items-center">
										<span className="text-sm font-medium text-green-800">
											Total Income
										</span>
										<span className="text-base font-bold text-green-700">
											₹{breakdown.commission.total.toLocaleString()}
										</span>
									</div>
								</div>
							)}
						</div>
						{/* 5. TDS Deductions */}
						<div className="border-b pb-2">
							<SectionHeader
								title="TDS Deductions"
								isOpen={expandedSections.tds}
								onToggle={() => toggleSection("tds")}
							/>
							{expandedSections.tds && (
								<div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm py-2 animate-in slide-in-from-top-2 duration-200">
									<div className="flex justify-between">
										<span className="text-gray-600">
											TDS on Commission
											<InfoTooltip content="Tax Deducted at Source on Commission" />
										</span>
										<span className="text-red-600 font-medium">
											₹{breakdown.tds.onCommission.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">TDS on PLB</span>
										<span className="text-red-600 font-medium">
											₹{breakdown.tds.onPLB.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">TDS on Incentive</span>
										<span className="text-red-600 font-medium">
											₹{breakdown.tds.onIncentive.toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between border-t pt-1 mt-1 col-span-2">
										<span className="font-medium text-gray-700">Total TDS</span>
										<span className="text-red-600 font-bold">
											₹{breakdown.tds.total.toLocaleString()}
										</span>
									</div>
								</div>
							)}
						</div>
						{/* 6. Settlement Calculation (Hidden as per request) */}
						{/* 
				<div>
					<SectionHeader
						title="Settlement Calculation"
						isOpen={expandedSections.settlement}
						onToggle={() => toggleSection("settlement")}
					/>
					{expandedSections.settlement && (
						<div className="py-2 animate-in slide-in-from-top-2 duration-200">
							<div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
								<div className="flex justify-between text-gray-600">
									<span>Gross Fare</span>
									<span>₹{breakdown.publishedFare.toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-green-600">
									<span>– Commission & Incentives</span>
									<span>-₹{breakdown.commission.total.toLocaleString()}</span>
								</div>
								{breakdown.fees.additionalTxnFeePub > 0 && (
									<div className="flex justify-between text-green-600">
										<span>– Additional Txn Fee</span>
										<span>
											-₹{breakdown.fees.additionalTxnFeePub.toLocaleString()}
										</span>
									</div>
								)}
								<div className="border-t border-gray-300 my-2 pt-2 flex justify-between items-center">
									<span className="font-bold text-blue-900">
										Net Payable to Supplier
									</span>
									<span className="text-xl font-bold text-blue-700">
										₹{breakdown.netPayable.toLocaleString()}
									</span>
								</div>
								<div className="text-xs text-gray-500 text-right">
									(Gross Fare - Commission - Add. Txn Fee)
								</div>
							</div>
						</div>
					)}
				</div>
				*/}
						{/* 7. Fare Rules (New) */}
						<div className="border-t pt-4">
							<SectionHeader
								title="Fare Rules"
								isOpen={expandedSections.fareRules}
								onToggle={() => toggleSection("fareRules")}
							/>
							{expandedSections.fareRules && (
								<div className="py-2 animate-in slide-in-from-top-2 duration-200 text-sm space-y-2">
									<div className="flex justify-between border-b pb-2">
										<span className="text-gray-600">Change Fee</span>
										<span className="font-medium">As per airline policy</span>
									</div>
									<div className="flex justify-between border-b pb-2">
										<span className="text-gray-600">Cancellation Fee</span>
										<span className="font-medium">As per airline policy</span>
									</div>
									<div className="flex justify-between border-b pb-2">
										<span className="text-gray-600">No-show Fee</span>
										<span className="font-medium">As per airline policy</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Rescheduling</span>
										<span className="font-medium">Allowed (Fees apply)</span>
									</div>
									<div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mt-2">
										Note: Detailed fare rules are available before final
										booking.
									</div>
								</div>
							)}
						</div>
						{/* 8. Airline T&Cs (Professionalism) */}
						<div className="border-t pt-4">
							<SectionHeader
								title="Flight Details & Baggage"
								isOpen={expandedSections.airlineTerms}
								onToggle={() => toggleSection("airlineTerms")}
							/>
							{expandedSections.airlineTerms && (
								<div className="grid grid-cols-2 gap-4 text-sm py-2 animate-in slide-in-from-top-2 duration-200">
									<div>
										<span className="block text-xs text-gray-500 uppercase mb-1">
											Refund Policy
										</span>
										{flight.IsRefundable ? (
											<div className="flex items-center gap-1 text-green-700 font-medium">
												<div className="h-2 w-2 rounded-full bg-green-600" />
												Refundable
											</div>
										) : (
											<div className="flex items-center gap-1 text-red-700 font-medium">
												<div className="h-2 w-2 rounded-full bg-red-600" />
												Non-Refundable
											</div>
										)}
									</div>
									<div>
										<span className="block text-xs text-gray-500 uppercase mb-1">
											Booking Class
										</span>
										<span className="font-medium">
											{flight.Segments?.[0]?.[0]?.Airline?.FareClass || "N/A"} (
											{getCabinClass(
												flight.Segments?.[0]?.[0]?.Airline?.FareClass
											)}
											)
										</span>
									</div>
									<div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
										<div>
											<span className="block text-xs text-gray-500 uppercase">
												Check-in Baggage
											</span>
											<span className="font-medium">
												{flight.Segments?.[0]?.[0]?.Baggage ||
													"Check Airline Policy"}
											</span>
										</div>
										<div>
											<span className="block text-xs text-gray-500 uppercase">
												Cabin Baggage
											</span>
											<span className="font-medium">
												{flight.Segments?.[0]?.[0]?.CabinBaggage ||
													"7 Kg (Est.)"}
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
						{/* Validation Issues (Hidden unless critical) */}
						{validation && !validation.isValid && (
							<div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm">
								<h4 className="font-medium text-red-800 mb-2">
									Calculation Discrepancies
								</h4>
								<ul className="space-y-1 text-red-700">
									{validation.issues.map((issue, index) => (
										<li key={index} className="flex items-start gap-2">
											<Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
											{issue}
										</li>
									))}
								</ul>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
