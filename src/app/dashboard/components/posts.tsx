"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showToast } from "@/lib/toast";
import {
	PlusCircle,
	X,
	ChevronLeft,
	ChevronRight,
	Loader2,
	ImageIcon,
	VideoIcon,
	Send,
	RefreshCcw,
	Heart,
	MessageCircle,
	Trash2,
	Share2,
	Bookmark,
	MoreHorizontal,
	Edit,
	Upload,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type definitions
type MediaType = "image" | "video";

interface MediaItem {
	id: string;
	type: MediaType;
	url: string;
}

interface Post {
	id: string;
	caption: string;
	media: MediaItem[];
	createdAt: string;
	likes: number;
	comments: number;
	user: {
		id: string;
		name: string;
		profileImageUrl: string;
	};
}

interface PostsProps {
	userId: string;
	userName: string;
	profileImageUrl: string;
	userType: string; // made required
}

interface CommentType {
	id: string;
	text: string;
	createdAt: string;
	user: {
		id: string;
		name: string;
		profileImageUrl: string;
	};
}

// Media Carousel Component
const MediaCarousel = ({
	media,
	currentIndex,
	onNext,
	onPrev,
	onRemove = null,
}: {
	media: MediaItem[];
	currentIndex: number;
	onNext: () => void;
	onPrev: () => void;
	onRemove?: ((id: string) => void) | null;
}) => {
	if (media.length === 0) return null;

	const currentMedia = media[currentIndex];

	if (!currentMedia) return null;

	return (
		<div className="relative aspect-square sm:aspect-video bg-muted rounded-lg overflow-hidden border shadow-inner">
			{currentMedia.type === "image" ? (
				<Image
					src={currentMedia.url}
					alt="Media content"
					fill
					sizes="(max-width: 768px) 100vw, 700px"
					className="object-contain"
					unoptimized
				/>
			) : (
				<video
					src={currentMedia.url}
					controls
					className="w-full h-full object-contain"
				/>
			)}

			{onRemove && (
				<Button
					variant="destructive"
					size="icon"
					className="absolute top-2 right-2 rounded-full w-7 h-7 shadow-lg bg-black/50 hover:bg-red-600/80 border-white/20 border"
					onClick={() => onRemove(currentMedia.id)}
				>
					<X className="h-4 w-4" />
				</Button>
			)}

			{media.length > 1 && (
				<>
					<Button
						variant="ghost"
						size="icon"
						className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full h-8 w-8"
						onClick={onPrev}
					>
						<ChevronLeft className="h-5 w-5 text-white" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full h-8 w-8"
						onClick={onNext}
					>
						<ChevronRight className="h-5 w-5 text-white" />
					</Button>
					<div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
						{media.map((_, i) => (
							<div
								key={i}
								className={`w-2 h-2 rounded-full transition-all duration-300 ${
									i === currentIndex ? "bg-white scale-125" : "bg-white/50"
								}`}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

// Create Post Form Component
const CreatePostForm = ({
	userId,
	userName,
	profileImageUrl,
	onPostCreated,
	userType,
}: {
	userId: string;
	userName: string;
	profileImageUrl: string;
	onPostCreated: (post: Post) => void;
	userType: string;
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [caption, setCaption] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const handleCaptionChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setCaption(e.target.value);
		},
		[]
	);

	const handleFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		type: MediaType
	) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		const uploadEndpoint =
			type === "image" ? "/api/upload/profile-image" : "/api/upload/video";

		const uploadPromises = Array.from(files).map(async (file) => {
			const formData = new FormData();
			formData.append("file", file);
			if (type === "video") {
				formData.append("userId", userId);
			}

			const response = await fetch(uploadEndpoint, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to upload ${file.name}`);
			}

			const result = await response.json();
			const url = type === "image" ? result.imageUrl : result.videoUrl;

			if (!url) {
				throw new Error(
					`Upload for ${file.name} succeeded but no URL was returned.`
				);
			}

			return {
				id: `${type}-${Date.now()}-${file.name}`,
				type,
				url,
			};
		});

		const results = await Promise.allSettled(uploadPromises);

		const successfulUploads: MediaItem[] = [];
		let failedCount = 0;

		results.forEach((result) => {
			if (result.status === "fulfilled") {
				successfulUploads.push(result.value);
			} else {
				failedCount++;
				console.error("An upload failed:", result.reason);
			}
		});

		if (successfulUploads.length > 0) {
			setUploadedMedia((prev) => [...prev, ...successfulUploads]);
			showToast(
				"success",
				`${successfulUploads.length} file(s) uploaded successfully.`
			);
		}

		if (failedCount > 0) {
			showToast(
				"error",
				`${failedCount} file(s) failed to upload. See console for details.`
			);
		}

		setIsUploading(false);
		if (e.target) e.target.value = "";
	};

	const handleNextSlide = useCallback(() => {
		setCurrentSlide((prev) =>
			prev === uploadedMedia.length - 1 ? 0 : prev + 1
		);
	}, [uploadedMedia.length]);

	const handlePrevSlide = useCallback(() => {
		setCurrentSlide((prev) =>
			prev === 0 ? uploadedMedia.length - 1 : prev - 1
		);
	}, [uploadedMedia.length]);

	const handleRemoveMedia = useCallback(
		(id: string) => {
			setUploadedMedia((prev) => {
				const newMedia = prev.filter((item) => item.id !== id);
				if (currentSlide >= newMedia.length) {
					setCurrentSlide(Math.max(0, newMedia.length - 1));
				}
				return newMedia;
			});
		},
		[currentSlide]
	);

	const resetForm = useCallback(() => {
		setUploadedMedia([]);
		setCaption("");
		setCurrentSlide(0);
	}, []);

	const handleCreatePost = useCallback(async () => {
		if (uploadedMedia.length === 0) {
			showToast("error", "Please add at least one image or video.");
			return;
		}
		if (!caption.trim()) {
			showToast("warning", "A caption is required to create a post.");
			return;
		}

		setIsSubmitting(true);

		const postData = {
			userId,
			caption,
			media: uploadedMedia,
			userType, // add userType
			user: {
				id: userId,
				name: userName,
				profileImageUrl,
			},
		};

		try {
			const response = await fetch("/api/posts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(postData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to create post");
			}

			const createdPost = await response.json();
			onPostCreated(createdPost);
			resetForm();
			showToast("success", "Your post has been successfully published!");
		} catch (error) {
			const err = error as { message?: string };
			console.error(error);
			showToast(
				"error",
				`Could not create post: ${err.message ?? "Unknown error"}`
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		caption,
		onPostCreated,
		resetForm,
		uploadedMedia,
		userId,
		userName,
		profileImageUrl,
		userType,
	]);

	return (
		<Card className="w-full max-w-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-xl">
					<PlusCircle className="h-6 w-6" />
					Create New Post
				</CardTitle>
				<CardDescription>
					Share your spiritual journey with photos and videos.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex flex-col lg:flex-row gap-6 items-start w-full">
					{/* Left side: Media upload and preview */}
					<div className="flex-1 space-y-4 w-full lg:w-auto">
						<Tabs defaultValue="image" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="image">
									<ImageIcon className="h-4 w-4 mr-2" />
									Images
								</TabsTrigger>
								<TabsTrigger value="video">
									<VideoIcon className="h-4 w-4 mr-2" />
									Videos
								</TabsTrigger>
							</TabsList>
							<TabsContent value="image" className="mt-4">
								<Button
									variant="outline"
									className="w-full"
									onClick={() => imageInputRef.current?.click()}
									disabled={isUploading}
								>
									{isUploading ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Upload className="h-4 w-4 mr-2" />
									)}
									Add Images
								</Button>
							</TabsContent>
							<TabsContent value="video" className="mt-4">
								<Button
									variant="outline"
									className="w-full"
									onClick={() => videoInputRef.current?.click()}
									disabled={isUploading}
								>
									{isUploading ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Upload className="h-4 w-4 mr-2" />
									)}
									Add Videos
								</Button>
							</TabsContent>
						</Tabs>
						<input
							type="file"
							ref={imageInputRef}
							onChange={(e) => handleFileUpload(e, "image")}
							accept="image/jpeg,image/png,image/webp,image/jpg"
							multiple
							className="hidden"
						/>
						<input
							type="file"
							ref={videoInputRef}
							onChange={(e) => handleFileUpload(e, "video")}
							accept="video/*"
							multiple
							className="hidden"
						/>

						{uploadedMedia.length > 0 ? (
							<MediaCarousel
								media={uploadedMedia}
								currentIndex={currentSlide}
								onNext={handleNextSlide}
								onPrev={handlePrevSlide}
								onRemove={handleRemoveMedia}
							/>
						) : (
							<div className="aspect-square sm:aspect-video bg-muted rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-4">
								<Upload
									className="h-12 w-12 text-muted-foreground mb-2"
									strokeWidth={1}
								/>
								<p className="text-muted-foreground font-medium">
									Your media preview will appear here
								</p>
								<p className="text-sm text-muted-foreground/80">
									Add images or videos to get started
								</p>
							</div>
						)}
					</div>

					{/* Right side: Caption and post actions */}
					<div className="flex-1 space-y-4 w-full lg:w-auto">
						<div className="flex items-center gap-3">
							<Avatar className="h-11 w-11 border">
								<AvatarImage src={profileImageUrl} alt={userName} />
								<AvatarFallback>{userName.charAt(0)}</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold">{userName}</p>
								<p className="text-sm text-muted-foreground">
									Posting publicly
								</p>
							</div>
						</div>
						<div className="relative">
							<Textarea
								className="min-h-[200px] p-3 pr-14 resize-y focus-visible:ring-1"
								placeholder="Share your thoughts, verses, or event details..."
								value={caption}
								onChange={handleCaptionChange}
								maxLength={2200}
							/>
							<p className="absolute bottom-2 right-3 text-xs text-muted-foreground">
								{caption.length} / 2200
							</p>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="ghost"
								onClick={resetForm}
								disabled={isUploading || isSubmitting}
							>
								<RefreshCcw className="h-4 w-4 mr-2" />
								Reset
							</Button>
							<Button
								onClick={handleCreatePost}
								disabled={
									uploadedMedia.length === 0 ||
									isUploading ||
									!caption.trim() ||
									isSubmitting
								}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Posting...
									</>
								) : (
									<>
										<Send className="h-4 w-4 mr-2" />
										Post Now
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Post Item Component
interface PostItemProps {
	post: Post;
	onDelete: (postId: string) => void;
	onEdit: (post: Post) => void;
	currentUserId: string;
	currentUserName: string;
	currentUserImage: string;
}

const PostItem = ({
	post,
	onEdit,
	onDelete,
	currentUserId,
	currentUserName,
	currentUserImage,
}: PostItemProps) => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [likeCount, setLikeCount] = useState(post.likes || 0);
	const [isLiked, setIsLiked] = useState(false);
	const [likeLoading, setLikeLoading] = useState(false);
	const [comments, setComments] = useState<CommentType[]>([]);
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [commentInput, setCommentInput] = useState("");
	const [commentsLoading, setCommentsLoading] = useState(false);
	const [addingComment, setAddingComment] = useState(false);
	const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
		null
	);
	const [commentCount, setCommentCount] = useState(post.comments || 0);

	// Replace with real userId from auth/session
	const CURRENT_USER_ID = currentUserId;
	const CURRENT_USER_NAME = currentUserName;
	const CURRENT_USER_IMAGE = currentUserImage;

	useEffect(() => {
		// Fetch like status and count
		fetch(`/api/posts/${post.id}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setLikeCount(data.likes?.length || 0);
					setIsLiked(data.likes?.includes(CURRENT_USER_ID));
				}
			});
	}, [post.id]);

	const handleLike = async () => {
		setLikeLoading(true);
		try {
			const method = isLiked ? "DELETE" : "POST";
			const res = await fetch(`/api/posts/${post.id}/like`, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: CURRENT_USER_ID }),
			});
			if (res.ok) {
				const data = await res.json();
				setLikeCount(data.likes.length);
				setIsLiked(!isLiked);
			}
		} finally {
			setLikeLoading(false);
		}
	};

	const fetchComments = async () => {
		setCommentsLoading(true);
		try {
			const res = await fetch(`/api/posts/${post.id}/comments`);
			if (res.ok) {
				const data = await res.json();
				setComments(data.comments || []);
				setCommentCount((data.comments || []).length);
			}
		} finally {
			setCommentsLoading(false);
		}
	};

	const handleToggleComments = () => {
		setCommentsOpen((open) => {
			if (!open) fetchComments();
			return !open;
		});
	};

	const handleAddComment = async () => {
		const text = commentInput.trim();
		if (!text) return;
		setAddingComment(true);
		try {
			const res = await fetch(`/api/posts/${post.id}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: CURRENT_USER_ID, text }),
			});
			if (res.ok) {
				const data = await res.json();
				setComments((prev) => [data.comment, ...prev]);
				setCommentInput("");
				setCommentCount((prev) => prev + 1);
			}
		} finally {
			setAddingComment(false);
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		setDeletingCommentId(commentId);
		try {
			const res = await fetch(`/api/comments/${commentId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setComments((prev) => prev.filter((c) => c.id !== commentId));
				setCommentCount((prev) => Math.max(0, prev - 1));
			}
		} finally {
			setDeletingCommentId(null);
		}
	};

	const handleNext = useCallback(() => {
		setCurrentSlide((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
	}, [post.media.length]);

	const handlePrev = useCallback(() => {
		setCurrentSlide((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
	}, [post.media.length]);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/posts/${post.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to delete post");
			}

			showToast("success", "Your post has been successfully deleted.");
			onDelete(post.id);
			setShowDeleteConfirm(false);
		} catch (error) {
			const err = error as { message?: string };
			console.error("Error deleting post:", error);
			showToast(
				"error",
				`Could not delete post: ${err.message ?? "Unknown error"}`
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Card className="w-full max-w-none rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-background">
			<CardHeader className="p-0">
				<div className="flex items-center p-4">
					<Avatar className="h-9 w-9 mr-3">
						<AvatarImage src={post.user.profileImageUrl} alt={post.user.name} />
						<AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
					</Avatar>
					<div className="flex-grow">
						<span className="font-semibold">{post.user.name}</span>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => onEdit(post)}>
								<Edit className="mr-2 h-4 w-4" />
								<span>Edit</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => setShowDeleteConfirm(true)}
								className="text-red-500 focus:text-red-500 focus:bg-red-50"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								<span>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<MediaCarousel
					media={post.media}
					currentIndex={currentSlide}
					onNext={handleNext}
					onPrev={handlePrev}
				/>
				<div className="p-4 space-y-3">
					<div className="flex items-center">
						<Button
							variant="link"
							size="icon"
							className="-ml-2 p-0 h-auto w-auto min-w-0 min-h-0 border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent"
							onClick={handleLike}
							disabled={likeLoading}
						>
							<Heart
								className={`h-6 w-6 transition-all ${
									isLiked
										? "fill-red-500 text-red-500"
										: "text-muted-foreground"
								}`}
							/>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full"
							onClick={handleToggleComments}
						>
							<MessageCircle className="h-6 w-6 text-muted-foreground" />
						</Button>
						<Button variant="ghost" size="icon" className="rounded-full">
							<Share2 className="h-6 w-6 text-muted-foreground" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="ml-auto rounded-full -mr-2"
						>
							<Bookmark className="h-6 w-6 text-muted-foreground" />
						</Button>
					</div>
					<div className="px-1">
						<p className="text-sm font-semibold">{likeCount} likes</p>
						<p
							className="text-sm text-muted-foreground cursor-pointer hover:underline"
							onClick={handleToggleComments}
						>
							View all {commentCount} comments
						</p>
					</div>
					<div className="px-1 text-sm">
						<span className="font-semibold cursor-pointer hover:underline">
							{post.user.name}
						</span>{" "}
						<span>{post.caption}</span>
					</div>
					{/* Comments Section */}
					{commentsOpen && (
						<div className="mt-3 border-t pt-3">
							<div className="flex gap-2 mb-2">
								<Image
									src={CURRENT_USER_IMAGE}
									alt={CURRENT_USER_NAME}
									width={32}
									height={32}
									className="rounded-full"
								/>
								<input
									type="text"
									value={commentInput}
									onChange={(e) => setCommentInput(e.target.value)}
									placeholder="Add a comment..."
									className="flex-1 border rounded px-3 py-2 text-sm"
									disabled={addingComment}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleAddComment();
									}}
								/>
								<Button
									size="sm"
									disabled={addingComment || !commentInput.trim()}
									onClick={handleAddComment}
								>
									Comment
								</Button>
							</div>
							<div className="space-y-2 max-h-40 overflow-y-auto">
								{commentsLoading ? (
									<div className="text-xs text-gray-500">
										Loading comments...
									</div>
								) : comments.length > 0 ? (
									comments.map((c) => (
										<div
											key={c.id}
											className="flex items-start gap-2 text-sm bg-white rounded p-2 border"
										>
											<Image
												src={
													c.user?.profileImageUrl ||
													"/uploads/placeholder-avatar.svg"
												}
												alt={c.user?.name || "User"}
												width={28}
												height={28}
												className="rounded-full"
											/>
											<div className="flex-1">
												<div className="font-semibold">
													{c.user?.name || "User"}
												</div>
												<div>{c.text}</div>
												<div className="text-xs text-gray-400">
													{new Date(c.createdAt).toLocaleString()}
												</div>
											</div>
											{c.user?.id === CURRENT_USER_ID && (
												<Button
													size="icon"
													variant="ghost"
													className="text-red-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
													onClick={() => handleDeleteComment(c.id)}
													disabled={deletingCommentId === c.id}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									))
								) : (
									<div className="text-xs text-gray-400">No comments yet.</div>
								)}
							</div>
						</div>
					)}
				</div>
			</CardContent>
			<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete post</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this post? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirm(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};

// Main Posts Component
export default function Posts({
	userId,
	userName,
	profileImageUrl,
	userType,
}: PostsProps) {
	const [posts, setPosts] = useState<Post[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const [updatedCaption, setUpdatedCaption] = useState("");

	const handlePostDeleted = (postId: string) => {
		setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
	};

	const handleEditClick = (post: Post) => {
		setEditingPost(post);
		setUpdatedCaption(post.caption);
		setIsEditDialogOpen(true);
	};

	const handleUpdatePost = async () => {
		if (!editingPost) return;

		try {
			const response = await fetch(`/api/posts/${editingPost.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ caption: updatedCaption }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to update post");
			}

			const updatedPostFromServer = await response.json();

			setPosts((prevPosts) =>
				prevPosts.map((p) =>
					p.id === editingPost.id ? { ...p, ...updatedPostFromServer } : p
				)
			);
			showToast("success", "Post updated successfully");
			setIsEditDialogOpen(false);
		} catch (error) {
			const err = error as { message?: string };
			console.error("Error updating post:", error);
			showToast("error", err.message || "Failed to update post");
		}
	};

	const handlePostCreated = useCallback((newPost: Post) => {
		setPosts((prevPosts) => [newPost, ...prevPosts]);
	}, []);

	useEffect(() => {
		const fetchPosts = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(
					`/api/posts?userId=${userId}&userType=${userType}`
				);
				if (!res.ok) {
					throw new Error("Failed to fetch posts");
				}
				const data: Post[] = await res.json();
				setPosts(data);
			} catch (error) {
				console.error("Error fetching posts:", error);
				showToast("error", "Could not load posts. Please refresh the page.");
			} finally {
				setIsLoading(false);
			}
		};
		fetchPosts();
	}, [userId, userType]);

	return (
		<div className="w-full max-w-none">
			<div className="space-y-10 w-full max-w-none">
				<CreatePostForm
					userId={userId}
					userName={userName}
					profileImageUrl={profileImageUrl}
					onPostCreated={handlePostCreated}
					userType={userType}
				/>

				{isLoading ? (
					<Card className="flex flex-col items-center justify-center p-12">
						<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
						<p className="mt-4 text-muted-foreground">Loading posts...</p>
					</Card>
				) : posts.length > 0 ? (
					<div className="space-y-10">
						{posts.map((post) => (
							<PostItem
								key={post.id}
								post={post}
								onDelete={handlePostDeleted}
								onEdit={handleEditClick}
								currentUserId={userId}
								currentUserName={userName}
								currentUserImage={profileImageUrl}
							/>
						))}
					</div>
				) : (
					<Card className="flex flex-col items-center justify-center p-12 border-dashed">
						<CardHeader className="text-center">
							<CardTitle>No Posts Yet</CardTitle>
							<CardDescription>
								Be the first to post! Your created posts will appear here.
							</CardDescription>
						</CardHeader>
					</Card>
				)}
			</div>
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit post</DialogTitle>
						<DialogDescription>
							Make changes to your post here. Click save when you&apos;re done.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<Textarea
							id="caption"
							value={updatedCaption}
							onChange={(e) => setUpdatedCaption(e.target.value)}
							className="min-h-[100px]"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleUpdatePost}>Save changes</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
