"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	Plane,
	Train,
	Bus,
	Car,
	MapPin,
	Clock,
	Info,
	Navigation,
} from "lucide-react";

interface TransportationData {
	byAir?: string;
	byTrain?: string;
	byBus?: string;
	byRoad?: string;
}

interface TransportationGuideProps {
	data: TransportationData;
	destinationName: string;
}

export default function TransportationGuide({
	data,
	destinationName,
}: TransportationGuideProps) {
	const [activeTab, setActiveTab] = useState("air");

	// Check if any transportation data exists
	const hasData = data.byAir || data.byTrain || data.byBus || data.byRoad;

	if (!hasData) {
		return null;
	}

	const transportOptions = [
		{
			id: "air",
			label: "By Air",
			icon: Plane,
			content: data.byAir,
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			available: !!data.byAir,
		},
		{
			id: "train",
			label: "By Train",
			icon: Train,
			content: data.byTrain,
			color: "text-green-600",
			bgColor: "bg-green-50 dark:bg-green-950/20",
			available: !!data.byTrain,
		},
		{
			id: "bus",
			label: "By Bus",
			icon: Bus,
			content: data.byBus,
			color: "text-orange-600",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			available: !!data.byBus,
		},
		{
			id: "road",
			label: "By Road",
			icon: Car,
			content: data.byRoad,
			color: "text-purple-600",
			bgColor: "bg-purple-50 dark:bg-purple-950/20",
			available: !!data.byRoad,
		},
	];

	const availableOptions = transportOptions.filter((opt) => opt.available);

	// Set first available option as default
	if (activeTab === "air" && !data.byAir && availableOptions.length > 0) {
		setActiveTab(availableOptions[0].id);
	}

	return (
		<Card className="overflow-hidden">
			<CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-primary/10 rounded-lg">
						<Navigation className="h-6 w-6 text-primary" />
					</div>
					<div>
						<CardTitle className="text-2xl">How to Reach</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Complete travel guide to {destinationName}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto p-2 bg-muted/50">
						{transportOptions.map((option) => (
							<TabsTrigger
								key={option.id}
								value={option.id}
								disabled={!option.available}
								className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<option.icon className={`h-4 w-4 ${option.color}`} />
								<span className="font-medium">{option.label}</span>
								{!option.available && (
									<Badge variant="secondary" className="ml-1 text-xs">
										N/A
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>

					{transportOptions.map((option) => (
						<TabsContent
							key={option.id}
							value={option.id}
							className="mt-6 space-y-4"
						>
							{option.available ? (
								<div className="space-y-4">
									{/* Header with icon */}
									<div
										className={`flex items-center gap-3 p-4 rounded-lg ${option.bgColor}`}
									>
										<div className="p-3 bg-background rounded-lg shadow-sm">
											<option.icon className={`h-6 w-6 ${option.color}`} />
										</div>
										<div>
											<h3 className="font-semibold text-lg">{option.label}</h3>
											<p className="text-sm text-muted-foreground">
												Detailed travel information and routes
											</p>
										</div>
									</div>

									{/* Content */}
									<div className="prose dark:prose-invert max-w-none">
										<div className="bg-muted/30 rounded-lg p-6 border border-border/50">
											<div className="flex items-start gap-3 mb-4">
												<Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
												<div className="flex-1">
													<div
														className="text-sm leading-relaxed whitespace-pre-wrap"
														dangerouslySetInnerHTML={{
															__html: option.content || "",
														}}
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Additional Tips */}
									<div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
										<div className="flex items-start gap-3">
											<MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
											<div>
												<h4 className="font-medium text-sm mb-1">Travel Tip</h4>
												<p className="text-sm text-muted-foreground">
													{option.id === "air" &&
														"Book flights in advance for better deals. Check for connecting flights if direct flights are not available."}
													{option.id === "train" &&
														"Book train tickets well in advance, especially during peak season. Check for Tatkal quotas if booking last minute."}
													{option.id === "bus" &&
														"Compare different bus operators for comfort and timing. Overnight buses can save on accommodation costs."}
													{option.id === "road" &&
														"Check road conditions before traveling. Hire local drivers if you're unfamiliar with mountain roads."}
												</p>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-12 text-muted-foreground">
									<option.icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
									<p>No information available for this transport mode</p>
								</div>
							)}
						</TabsContent>
					))}
				</Tabs>

				{/* Quick Info Bar */}
				<div className="mt-6 pt-6 border-t border-border">
					<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<span>Compare travel times before booking</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-red-500" />
							<span>Local transport available at destination</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
