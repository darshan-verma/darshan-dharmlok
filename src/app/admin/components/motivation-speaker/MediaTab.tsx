"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Edit } from "lucide-react";
import MediaUploadTab from "./MediaUploadTab";
import { MotivationSpeaker } from "./MotivationSpeakerTable";

interface MediaTabProps {
	speaker: MotivationSpeaker;
	onUpdate: (updates: {
		coverImage?: string;
		bannerImage?: string;
		images?: string[];
	}) => void;
}

export default function MediaTab({ speaker, onUpdate }: MediaTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = (updates: {
		coverImage?: string;
		bannerImage?: string;
		images?: string[];
	}) => {
		onUpdate(updates);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<MediaUploadTab
				speaker={speaker}
				onUpdate={handleSave}
				onCancel={handleCancel}
			/>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Media</CardTitle>
					<CardDescription>
						Manage speaker cover image, banner, and gallery images.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Media
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Cover Image */}
				{speaker.coverImage && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Cover Image
						</label>
						<div className="relative w-full h-32">
							<Image
								src={speaker.coverImage}
								alt={`${speaker.name} cover`}
								fill
								className="object-cover rounded-lg"
							/>
						</div>
					</div>
				)}

				{/* Banner Image */}
				{speaker.bannerImage && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Banner Image
						</label>
						<div className="relative w-full h-32">
							<Image
								src={speaker.bannerImage}
								alt={`${speaker.name} banner`}
								fill
								className="object-cover rounded-lg"
							/>
						</div>
					</div>
				)}

				{/* Gallery Images */}
				{speaker.images && speaker.images.length > 0 && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Gallery Images
						</label>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{speaker.images.map((image, index) => (
								<div key={index} className="relative">
									<div className="relative w-full h-24">
										<Image
											src={image}
											alt={`Speaker image ${index + 1}`}
											fill
											className="object-cover rounded-lg"
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{!speaker.coverImage &&
					!speaker.bannerImage &&
					(!speaker.images || speaker.images.length === 0) && (
						<p className="text-sm text-gray-500">No media uploaded yet.</p>
					)}
			</CardContent>
		</Card>
	);
}
