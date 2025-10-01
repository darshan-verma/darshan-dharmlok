"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function ActivityTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Activity Log
				</CardTitle>
				<CardDescription>
					View recent activity for this yoga session.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-gray-500">
					Activity log will be displayed here.
				</p>
			</CardContent>
		</Card>
	);
}
