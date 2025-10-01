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
			<div className="space-y-6">
				{/* Banner Image Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5" />
							Banner Image
						</CardTitle>
						<CardDescription>
							Set a banner image for this yoga session
						</CardDescription>
					</CardHeader>
					<CardContent>
						{session.bannerImage ? (
							<div className="relative">
								<div className="relative w-full h-48">
									<Image
										src={session.bannerImage}
										alt="Banner"
										fill
										className="object-cover rounded-lg"
									/>
								</div>
								<Button
									variant="destructive"
									size="sm"
									className="absolute top-2 right-2"
									onClick={() => {
										handleSave({ ...session, bannerImage: "" });
									}}
								>
									Remove
								</Button>
							</div>
						) : (
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
								<p className="text-gray-500 mb-4">No banner image set</p>
								<p className="text-sm text-gray-400">
									Banner image will be displayed at the top of the session page
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Cover Image Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5" />
							Cover Image
						</CardTitle>
						<CardDescription>
							Set a cover image for this yoga session
						</CardDescription>
					</CardHeader>
					<CardContent>
						{session.coverImage ? (
							<div className="relative">
								<div className="relative w-full h-48">
									<Image
										src={session.coverImage}
										alt="Cover"
										fill
										className="object-cover rounded-lg"
									/>
								</div>
								<Button
									variant="destructive"
									size="sm"
									className="absolute top-2 right-2"
									onClick={() => {
										handleSave({ ...session, coverImage: "" });
									}}
								>
									Remove
								</Button>
							</div>
						) : (
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
								<p className="text-gray-500 mb-4">No cover image set</p>
								<p className="text-sm text-gray-400">
									Cover image will be displayed prominently on the session page
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Images Section */}
				<Card>
					<CardHeader>
						<CardTitle>Images</CardTitle>
						<CardDescription>Manage yoga session images</CardDescription>
					</CardHeader>
					<CardContent>
						{session.images && session.images.length > 0 ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{session.images.map((image, index) => (
									<div key={index} className="relative">
										<div className="relative w-full h-32">
											<Image
												src={image}
												alt={`Session image ${index + 1}`}
												fill
												className="object-cover rounded-lg"
											/>
										</div>
										{session.coverImage === image && (
											<div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
												Cover
											</div>
										)}
										{session.bannerImage === image && (
											<div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
												Banner
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

				{/* Action Buttons */}
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={() => handleSave({})}>Save Changes</Button>
				</div>
			</div>
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
