"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

interface YogaDetailsTabProps {
	yoga: Yoga;
	onEdit: () => void;
}

export default function YogaDetailsTab({ yoga, onEdit }: YogaDetailsTabProps) {
	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "N/A";
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Yoga Information</CardTitle>
					<CardDescription>
						View and manage yoga session details.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={onEdit}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Details
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Basic Information */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium text-gray-500">
								Yoga Name
							</label>
							<p className="text-sm font-medium text-gray-900 mt-1">
								{yoga.name}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-500">
								Session Date
							</label>
							<p className="text-sm font-medium text-gray-900 mt-1">
								{new Date(yoga.date).toLocaleDateString("en-IN", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-500">
								Status
							</label>
							<div className="mt-1">
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										yoga.status === "Active"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{yoga.status}
								</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium text-gray-500">
								Created At
							</label>
							<p className="text-sm text-gray-900 mt-1">
								{formatDate(yoga.createdAt)}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-500">
								Last Updated
							</label>
							<p className="text-sm text-gray-900 mt-1">
								{formatDate(yoga.updatedAt)}
							</p>
						</div>
					</div>
				</div>

				{/* Description */}
				<div>
					<label className="text-sm font-medium text-gray-500">
						Description
					</label>
					<div className="mt-2 p-4 bg-gray-50 rounded-lg border">
						<p className="text-sm text-gray-900 whitespace-pre-wrap">
							{yoga.description || "No description provided."}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
