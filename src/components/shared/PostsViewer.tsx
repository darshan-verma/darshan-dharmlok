"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { showToast } from "@/lib/toast";
import Image from "next/image";

interface MediaItem {
	id: string;
	type: "image" | "video";
	url: string;
}

interface Post {
	id: string;
	caption: string;
	media: MediaItem[];
	createdAt: string;
	likes: number | string[];
	commentCount: number;
	user: {
		id: string;
		name: string;
		profileImageUrl: string;
	};
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

interface PostsViewerProps {
	userId: string;
	userType: string;
}

// Media Carousel Component
const MediaCarousel = ({
	media,
	currentIndex,
	onNext,
	onPrev,
}: {
	media: MediaItem[];
	currentIndex: number;
	onNext: () => void;
	onPrev: () => void;
}) => {
	if (media.length === 0) return null;

	return (
		<div className="relative w-full aspect-[4/3] bg-gray-100">
			{media[currentIndex].type === "image" ? (
				<Image
					src={media[currentIndex].url}
					alt="Post media"
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, 600px"
				/>
			) : (
				<video
					src={media[currentIndex].url}
					controls
					className="w-full h-full object-cover"
				/>
			)}
			{media.length > 1 && (
				<>
					<Button
						variant="ghost"
						size="icon"
						className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
						onClick={onPrev}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
						onClick={onNext}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
						{media.map((_, idx) => (
							<div
								key={idx}
								className={`h-1.5 rounded-full transition-all ${
									idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
								}`}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

// Post Item Component
const PostItem = ({ post }: { post: Post }) => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [likeCount, setLikeCount] = useState(
		Array.isArray(post.likes) ? post.likes.length : post.likes || 0
	);
	const [isLiked, setIsLiked] = useState(false);
	const [comments, setComments] = useState<CommentType[]>([]);
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [commentInput, setCommentInput] = useState("");
	const [commentsLoading, setCommentsLoading] = useState(false);
	const [commentCount, setCommentCount] = useState(post.commentCount || 0);

	useEffect(() => {
		// Fetch like status and count
		fetch(`/api/posts/${post.id}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setLikeCount(Array.isArray(data.likes) ? data.likes.length : data.likes || 0);
					// For public view, we can't determine if current user liked it without auth
					setIsLiked(false);
				}
			})
			.catch(() => {});
	}, [post.id]);

	const handleLike = async () => {
		// In public view, likes might require authentication
		// For now, just show a message
		showToast("info", "Please sign in to like posts");
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
		showToast("info", "Please sign in to comment");
	};

	const handleNext = useCallback(() => {
		setCurrentSlide((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
	}, [post.media.length]);

	const handlePrev = useCallback(() => {
		setCurrentSlide((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
	}, [post.media.length]);

	return (
		<Card className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-background">
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
						{commentCount > 0 && (
							<p
								className="text-sm text-muted-foreground cursor-pointer hover:underline"
								onClick={handleToggleComments}
							>
								View all {commentCount} comments
							</p>
						)}
					</div>
					<div className="px-1 text-sm">
						<span>{post.caption}</span>
					</div>
					{/* Comments Section */}
					{commentsOpen && (
						<div className="mt-3 border-t pt-3">
							{commentsLoading ? (
								<div className="flex justify-center py-4">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="space-y-3 max-h-64 overflow-y-auto">
									{comments.map((comment) => (
										<div key={comment.id} className="flex gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={comment.user.profileImageUrl}
													alt={comment.user.name}
												/>
												<AvatarFallback>
													{comment.user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<p className="text-sm">
													<span className="font-semibold">
														{comment.user.name}
													</span>{" "}
													{comment.text}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
							<div className="mt-3 flex gap-2">
								<input
									type="text"
									placeholder="Add a comment..."
									value={commentInput}
									onChange={(e) => setCommentInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleAddComment();
										}
									}}
									className="flex-1 text-sm border-none outline-none bg-transparent"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleAddComment}
									disabled={!commentInput.trim()}
								>
									Post
								</Button>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default function PostsViewer({ userId, userType }: PostsViewerProps) {
	const [posts, setPosts] = useState<Post[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchPosts = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/posts?userId=${userId}&userType=${userType}`);
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
			<div className="space-y-6 w-full max-w-none">
				{isLoading ? (
					<Card className="flex flex-col items-center justify-center p-12">
						<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
						<p className="mt-4 text-muted-foreground">Loading posts...</p>
					</Card>
				) : posts.length > 0 ? (
					posts.map((post) => (
						<PostItem key={post.id} post={post} />
					))
				) : (
					<Card className="flex flex-col items-center justify-center p-12 border-dashed">
						<CardHeader className="text-center">
							<CardTitle>No Posts Yet</CardTitle>
							<CardDescription>
								This kathavachak hasn&apos;t posted anything yet.
							</CardDescription>
						</CardHeader>
					</Card>
				)}
			</div>
		</div>
	);
}
