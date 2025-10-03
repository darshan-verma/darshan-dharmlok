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

interface YogaImage {
	url: string;
	caption?: string;
	alt?: string;
	order: number;
}

interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	images: YogaImage[];
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
		images?: YogaImage[];
		videos?: string[];
	}) => void;
}

export default function MediaTab({ yoga, onUpdate }: MediaTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: YogaImage[];
		videos?: string[];
	}) => {
		onUpdate(updates);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	const getOrdinalSuffix = (num: number) => {
		const j = num % 10;
		const k = num % 100;
		if (j === 1 && k !== 11) return num + "st";
		if (j === 2 && k !== 12) return num + "nd";
		if (j === 3 && k !== 13) return num + "rd";
		return num + "th";
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
					<div className="space-y-4">
						{yoga.images
							.sort((a, b) => a.order - b.order)
							.map((image) => (
								<div key={image.url} className="border rounded-lg p-4">
									<div className="flex items-start gap-4">
										{/* Image */}
										<div className="relative w-32 h-32 flex-shrink-0">
											<Image
												src={image.url}
												alt={image.alt || `Yoga image ${image.order}`}
												fill
												className="object-cover rounded-lg"
											/>
											{yoga.coverImage === image.url && (
												<div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
													Cover
												</div>
											)}
										</div>

										{/* Image Details */}
										<div className="flex-1">
											<h4 className="font-medium mb-2">
												{getOrdinalSuffix(image.order)} Image
											</h4>
											{image.caption && (
												<p className="text-sm text-gray-600 mb-1">
													<strong>Caption:</strong> {image.caption}
												</p>
											)}
											<p className="text-sm text-gray-600">
												<strong>Alt Text:</strong> {image.alt}
											</p>
										</div>
									</div>
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
