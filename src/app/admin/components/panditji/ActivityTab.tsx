"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function ActivityTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity Log</CardTitle>
				<CardDescription>
					Recent Panditji activities and interactions.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Activity log is not yet implemented.
				</p>
			</CardContent>
		</Card>
	);
}
