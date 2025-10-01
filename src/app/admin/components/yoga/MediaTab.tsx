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

interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	images: string[];
	videos: string[];
	coverImage?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface MediaTabProps {
	yoga: Yoga;
	onUpdate: (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: string[];
		videos?: string[];
	}) => void;
}

export default function MediaTab({ yoga, onUpdate }: MediaTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: string[];
		videos?: string[];
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
				yoga={yoga}
				onUpdate={handleSave}
				onCancel={handleCancel}
			/>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Images</CardTitle>
					<CardDescription>
						Manage yoga session images and cover photo.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Images
				</Button>
			</CardHeader>
			<CardContent>
				{yoga.images && yoga.images.length > 0 ? (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{yoga.images.map((image, index) => (
							<div key={index} className="relative">
								<div className="relative w-full h-32">
									<Image
										src={image}
										alt={`Yoga image ${index + 1}`}
										fill
										className="object-cover rounded-lg"
									/>
								</div>
								{yoga.coverImage === image && (
									<div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
										Cover
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-gray-500">No images uploaded yet.</p>
				)}
			</CardContent>
		</Card>
	);
}
