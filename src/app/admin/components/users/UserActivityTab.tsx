"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function UserActivityTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity Log</CardTitle>
				<CardDescription>
					Recent user activities and interactions.
				</CardDescription>
			</CardHeader>
		</Card>
	);
}
