"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { MotivationSpeaker } from "./MotivationSpeakerTable";
import VideoUploadTab from "./VideoUploadTab";

interface VideoTabProps {
	speaker: MotivationSpeaker;
	onUpdate?: (updates: { videos?: string[] }) => void;
}

export default function VideoTab({ speaker, onUpdate }: VideoTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleUpdate = (updates: { videos?: string[] }) => {
		if (onUpdate) {
			onUpdate(updates);
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Edit Videos</h3>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
				</div>
				<VideoUploadTab
					speaker={speaker}
					onUpdate={handleUpdate}
					onCancel={handleCancel}
				/>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Videos</CardTitle>
					<CardDescription>Manage motivation speaker videos.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Videos
				</Button>
			</CardHeader>
			<CardContent>
				{speaker.videos && speaker.videos.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{speaker.videos.map((video, index) => (
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
