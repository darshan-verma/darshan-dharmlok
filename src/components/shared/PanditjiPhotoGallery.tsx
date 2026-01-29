"use client";

import { useState, useEffect } from "react";
import {
	Loader2,
	Image as ImageIcon,
} from "lucide-react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface Photo {
	id: string;
	url: string;
	title?: string;
	description?: string;
}

interface PanditjiPhotoGalleryProps {
	userId: string;
	profileImageUrl?: string;
}

export default function PanditjiPhotoGallery({
	userId,
	profileImageUrl,
}: PanditjiPhotoGalleryProps) {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch user data including images
	useEffect(() => {
		setLoading(true);
		setError(null);
		Promise.all([
			fetch(`/api/users/${userId}`).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch user data");
				return res.json();
			}),
			fetch(`/api/images?userId=${userId}`).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch images");
				return res.json();
			}),
		])
			.then(([userData, imagesData]) => {
				// Filter out profile image from the photos
				const allImages = imagesData.images || [];
				const filteredImages = allImages.filter((img: Photo) => {
					// Exclude if the image URL matches the profile image URL
					if (profileImageUrl && img.url === profileImageUrl) {
						return false;
					}
					// Also check if it matches the user's profileImageUrl from the fetched data
					if (userData.profileImageUrl && img.url === userData.profileImageUrl) {
						return false;
					}
					return true;
				});
				setPhotos(filteredImages);
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [userId, profileImageUrl]);

	if (loading) {
		return (
			<Card className="flex flex-col items-center justify-center p-12">
				<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
			</Card>
		);
	}

	if (error) {
		return (
			<div className="text-center p-4 text-red-500">
				<p>Error loading images: {error}</p>
			</div>
		);
	}

	if (photos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="bg-muted/30 p-4 rounded-full mb-4">
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
				</div>
				<p className="text-muted-foreground font-medium">
					No photos available at the moment.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			{photos.map((photo, index) => (
				<Card
					key={`${photo.url}-${index}`}
					className="shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
				>
					<Dialog>
						<DialogTrigger asChild>
							<div className="relative aspect-video bg-black cursor-pointer">
								<Image
									src={photo.url}
									alt={photo.title || `Photo ${index + 1}`}
									fill
									sizes="(max-width: 768px) 100vw, 50vw"
									className="object-cover rounded-t-lg"
								/>
							</div>
						</DialogTrigger>
						<DialogContent className="max-w-3xl">
							<DialogHeader>
								<DialogTitle className="flex justify-between items-center">
									<span>{photo.title || `Photo ${index + 1}`}</span>
								</DialogTitle>
							</DialogHeader>
							<div className="relative aspect-[4/3] w-full mt-2">
								<Image
									src={photo.url}
									alt={photo.title || `Photo ${index + 1}`}
									fill
									sizes="80vw"
									className="object-contain"
								/>
							</div>
							{photo.description && (
								<div className="mt-4 text-muted-foreground">
									{photo.description}
								</div>
							)}
						</DialogContent>
					</Dialog>
					<CardHeader className="flex flex-row items-start gap-3 pb-1 pt-3 px-4">
						<div className="flex-1">
							<CardTitle className="text-base font-semibold line-clamp-1">
								{photo.title || `Photo ${index + 1}`}
							</CardTitle>
							{photo.description && (
								<CardDescription className="text-sm mt-1 line-clamp-2">
									{photo.description}
								</CardDescription>
							)}
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
