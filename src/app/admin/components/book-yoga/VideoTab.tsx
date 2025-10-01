"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Edit } from "lucide-react";
import { YogaSession } from "./BookYogaTable";
import VideoUploadTab from "./VideoUploadTab";

interface VideoTabProps {
	session: YogaSession;
	onUpdate: (videos: string[]) => void;
}

export default function VideoTab({ session, onUpdate }: VideoTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = (videos: string[]) => {
		onUpdate(videos);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<VideoUploadTab
				session={session}
				onUpdate={handleSave}
				onCancel={handleCancel}
			/>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Videos</CardTitle>
					<CardDescription>Manage yoga session videos.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Videos
				</Button>
			</CardHeader>
			<CardContent>
				{session.videos && session.videos.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{session.videos.map((video, index) => (
							<div key={index} className="relative">
								<video
									src={video}
									controls
									className="w-full h-48 object-cover rounded-lg"
									preload="metadata"
								/>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-gray-500">No videos uploaded yet.</p>
				)}
			</CardContent>
		</Card>
	);
}
