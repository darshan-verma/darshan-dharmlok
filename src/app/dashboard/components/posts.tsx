"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	PlusCircle,
	X,
	ChevronLeft,
	ChevronRight,
	Loader2,
} from "lucide-react";
// You'll need to install the blocknote package first
// npm install @blocknote/react @blocknote/core
// For now, we'll use a simpler approach with a textarea
// import { BlockNoteView, useBlockNote } from "@blocknote/react";
// import "@blocknote/core/style.css";

interface MediaItem {
	id: string;
	type: "image" | "video";
	url: string;
}

interface Post {
	id: string;
	userId: string;
	userName: string;
	userProfileImage: string;
	caption: string;
	media: MediaItem[];
	createdAt: string;
}

interface PostsProps {
	userId: string;
	userName: string;
	profileImageUrl: string;
}

export default function Posts({
	userId,
	userName,
	profileImageUrl,
}: PostsProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [posts, setPosts] = useState<Post[]>([]);
	const [caption, setCaption] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	// Simple state for caption instead of BlockNote
	const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCaption(e.target.value);
	};

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
		// Reset form when closing menu
		if (isMenuOpen) {
			resetForm();
		}
	};

	const handleFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "image" | "video"
	) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);

		const uploadEndpoint =
			type === "image" ? "/api/upload/profile-image" : "/api/upload/video";

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const formData = new FormData();
			formData.append("file", file);
			formData.append("userId", userId);

			try {
				const response = await fetch(uploadEndpoint, {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					const data = await response.json();
					const url = type === "image" ? data.imageUrl : data.videoUrl;

					setUploadedMedia((prev) => [
						...prev,
						{
							id: `${type}-${Date.now()}-${i}`,
							type,
							url,
						},
					]);
				} else {
					console.error("Upload failed");
					// You could add error toast notification here
				}
			} catch (error) {
				console.error("Error uploading file:", error);
				// You could add error toast notification here
			}
		}

		setIsUploading(false);
		// Reset the file input
		if (type === "image" && fileInputRef.current) {
			fileInputRef.current.value = "";
		} else if (type === "video" && videoInputRef.current) {
			videoInputRef.current.value = "";
		}
	};

	const handleNextSlide = () => {
		setCurrentSlide((prev) =>
			prev === uploadedMedia.length - 1 ? 0 : prev + 1
		);
	};

	const handlePrevSlide = () => {
		setCurrentSlide((prev) =>
			prev === 0 ? uploadedMedia.length - 1 : prev - 1
		);
	};

	const handleRemoveMedia = (id: string) => {
		setUploadedMedia((prev) => {
			const newMedia = prev.filter((item) => item.id !== id);
			// Reset current slide if needed
			if (currentSlide >= newMedia.length) {
				setCurrentSlide(Math.max(0, newMedia.length - 1));
			}
			return newMedia;
		});
	};

	const resetForm = () => {
		setUploadedMedia([]);
		setCaption("");
		setCurrentSlide(0);
	};

	const handleCreatePost = () => {
		if (uploadedMedia.length === 0) {
			// You could add a toast notification here
			return;
		}

		// Create a new post
		const newPost: Post = {
			id: `post-${Date.now()}`,
			userId,
			userName,
			userProfileImage: profileImageUrl,
			caption,
			media: uploadedMedia,
			createdAt: new Date().toISOString(),
		};

		// Add post to state (in a real app, you'd send to API first)
		setPosts((prev) => [newPost, ...prev]);

		// Reset form
		resetForm();
		// Close menu
		setIsMenuOpen(false);
	};

	// Component for rendering a post in the feed
	const PostCard = ({ post }: { post: Post }) => {
		const [postCurrentSlide, setPostCurrentSlide] = useState(0);

		const handlePostNextSlide = () => {
			setPostCurrentSlide((prev) =>
				prev === post.media.length - 1 ? 0 : prev + 1
			);
		};

		const handlePostPrevSlide = () => {
			setPostCurrentSlide((prev) =>
				prev === 0 ? post.media.length - 1 : prev - 1
			);
		};

		return (
			<Card className="mb-6">
				<CardHeader className="flex flex-row items-center gap-3 pb-2">
					<Image
						src={post.userProfileImage || "/placeholder-avatar.png"}
						alt={post.userName}
						width={40}
						height={40}
						className="rounded-full object-cover"
					/>
					<div>
						<h3 className="font-medium">{post.userName}</h3>
						<p className="text-xs text-muted-foreground">
							{new Date(post.createdAt).toLocaleString()}
						</p>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					{post.media.length > 0 && (
						<div className="relative aspect-video mb-4 bg-muted rounded-md overflow-hidden">
							{post.media[postCurrentSlide].type === "image" ? (
								<Image
									src={post.media[postCurrentSlide].url}
									alt="Post image"
									fill
									className="object-contain"
								/>
							) : (
								<video
									src={post.media[postCurrentSlide].url}
									controls
									className="w-full h-full object-contain"
								/>
							)}

							{post.media.length > 1 && (
								<>
									<Button
										variant="ghost"
										size="icon"
										className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full"
										onClick={handlePostPrevSlide}
									>
										<ChevronLeft className="h-5 w-5 text-white" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full"
										onClick={handlePostNextSlide}
									>
										<ChevronRight className="h-5 w-5 text-white" />
									</Button>
									<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
										{post.media.map((_, i) => (
											<div
												key={i}
												className={`w-2 h-2 rounded-full ${
													i === postCurrentSlide ? "bg-white" : "bg-white/50"
												}`}
											/>
										))}
									</div>
								</>
							)}
						</div>
					)}

					{/* Render caption using dangerouslySetInnerHTML since it contains HTML */}
					<div
						className="prose prose-sm max-w-none"
						dangerouslySetInnerHTML={{ __html: post.caption }}
					/>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<Card className="mb-6">
				<CardHeader className="pb-2">
					<Button
						variant="outline"
						onClick={toggleMenu}
						className="flex items-center gap-2 w-full justify-start"
					>
						<PlusCircle className="h-5 w-5" />
						{isMenuOpen ? "Close" : "Create New Post"}
					</Button>
				</CardHeader>

				{isMenuOpen && (
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploading}
							>
								{isUploading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : null}
								Add Images
							</Button>
							<input
								type="file"
								ref={fileInputRef}
								onChange={(e) => handleFileUpload(e, "image")}
								accept="image/jpeg,image/png,image/webp,image/jpg"
								multiple
								className="hidden"
							/>

							<Button
								variant="outline"
								size="sm"
								onClick={() => videoInputRef.current?.click()}
								disabled={isUploading}
							>
								{isUploading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : null}
								Add Videos
							</Button>
							<input
								type="file"
								ref={videoInputRef}
								onChange={(e) => handleFileUpload(e, "video")}
								accept="video/*"
								multiple
								className="hidden"
							/>
						</div>

						{uploadedMedia.length > 0 && (
							<div className="relative aspect-video bg-muted rounded-md overflow-hidden">
								{uploadedMedia[currentSlide].type === "image" ? (
									<Image
										src={uploadedMedia[currentSlide].url}
										alt="Uploaded image"
										fill
										className="object-contain"
									/>
								) : (
									<video
										src={uploadedMedia[currentSlide].url}
										controls
										className="w-full h-full object-contain"
									/>
								)}

								{/* Remove button for current media */}
								<Button
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2 rounded-full w-8 h-8"
									onClick={() =>
										handleRemoveMedia(uploadedMedia[currentSlide].id)
									}
								>
									<X className="h-4 w-4" />
								</Button>

								{uploadedMedia.length > 1 && (
									<>
										<Button
											variant="ghost"
											size="icon"
											className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full"
											onClick={handlePrevSlide}
										>
											<ChevronLeft className="h-5 w-5 text-white" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full"
											onClick={handleNextSlide}
										>
											<ChevronRight className="h-5 w-5 text-white" />
										</Button>
										<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
											{uploadedMedia.map((_, i) => (
												<div
													key={i}
													className={`w-2 h-2 rounded-full ${
														i === currentSlide ? "bg-white" : "bg-white/50"
													}`}
												/>
											))}
										</div>
									</>
								)}
							</div>
						)}

						<div className="border rounded-md p-2">
							<textarea
								className="w-full min-h-[100px] p-2 resize-y border-0 focus:outline-none"
								placeholder="Write your caption here..."
								value={caption}
								onChange={handleCaptionChange}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={resetForm}>
								Reset
							</Button>
							<Button
								onClick={handleCreatePost}
								disabled={uploadedMedia.length === 0 || isUploading}
							>
								Post
							</Button>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Post Feed */}
			<div>
				{posts.length === 0 ? (
					<Card className="py-8">
						<CardContent className="flex flex-col items-center justify-center text-center">
							<p className="text-muted-foreground">No posts yet.</p>
							<Button
								variant="link"
								onClick={() => setIsMenuOpen(true)}
								className="mt-2"
							>
								Create your first post
							</Button>
						</CardContent>
					</Card>
				) : (
					posts.map((post) => <PostCard key={post.id} post={post} />)
				)}
			</div>
		</div>
	);
}
