"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function KathavachakActivityTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity Log</CardTitle>
				<CardDescription>
					Recent Kathavachak activities and interactions.
				</CardDescription>
			</CardHeader>
		</Card>
	);
}
