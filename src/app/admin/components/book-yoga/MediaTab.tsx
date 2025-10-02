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
import { YogaSession } from "./BookYogaTable";
import MediaUploadTab from "./MediaUploadTab";

interface MediaTabProps {
	session: YogaSession;
	onUpdate: (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: string[];
	}) => void;
}

export default function MediaTab({ session, onUpdate }: MediaTabProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = (updates: {
		bannerImage?: string;
		coverImage?: string;
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
					<CardTitle>Media</CardTitle>
					<CardDescription>
						Manage session banner, cover image, and gallery images.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Media
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Banner Image */}
				{session.bannerImage && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Banner Image
						</label>
						<div className="relative w-full h-32">
							<Image
								src={session.bannerImage}
								alt="Banner"
								fill
								className="object-cover rounded-lg"
							/>
						</div>
					</div>
				)}

				{/* Cover Image */}
				{session.coverImage && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Cover Image
						</label>
						<div className="relative w-full h-32">
							<Image
								src={session.coverImage}
								alt="Cover"
								fill
								className="object-cover rounded-lg"
							/>
						</div>
					</div>
				)}

				{/* Gallery Images */}
				{session.images && session.images.length > 0 && (
					<div>
						<label className="text-sm font-medium text-gray-500 mb-2 block">
							Gallery Images
						</label>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{session.images.map((image, index) => (
								<div key={index} className="relative">
									<div className="relative w-full h-24">
										<Image
											src={image}
											alt={`Session image ${index + 1}`}
											fill
											className="object-cover rounded-lg"
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{!session.bannerImage &&
					!session.coverImage &&
					(!session.images || session.images.length === 0) && (
						<p className="text-sm text-gray-500">No media uploaded yet.</p>
					)}
			</CardContent>
		</Card>
	);
}
