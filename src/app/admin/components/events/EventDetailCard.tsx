import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "./types";

interface EventDetailCardProps {
	event: Event | null;
	isEditing: boolean;
	onEdit: () => void;
}

export function EventDetailCard({
	event,
	isEditing,
	onEdit,
}: EventDetailCardProps) {
	if (!event) return null;

	return (
		<Card className="md:col-span-1 h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<CardTitle className="text-center text-lg">{event.title}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center gap-1">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
							event.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{event.status}
					</span>
					{event.translationStatus && (
						<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
							{event.translationStatus}
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Category:</span>
					<span>{event.category}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Type:</span>
					<span>{event.type}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">From:</span>
					<span>
						{event.fromDate} {event.fromTime && `(${event.fromTime})`}
					</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">To:</span>
					<span>
						{event.toDate} {event.toTime && `(${event.toTime})`}
					</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Place:</span>
					<span>{event.place || "N/A"}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Address:</span>
					<span>{event.address || "N/A"}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Price:</span>
					<span>
						{event.price !== undefined && event.price !== null
							? `₹${event.price}`
							: "Free"}
					</span>
				</div>
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={onEdit}
				>
					{isEditing ? "Cancel" : "Edit Event"}
				</Button>
			</CardFooter>
		</Card>
	);
}
