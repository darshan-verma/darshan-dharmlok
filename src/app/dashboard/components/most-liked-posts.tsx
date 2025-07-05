"use client";

import Image from "next/image";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, ChevronRight, TrendingUp } from "lucide-react";

interface Post {
	id: string;
	user: {
		name: string;
		avatar: string;
		bio: string;
	};
	image: string;
	content: string;
	timestamp: string;
	likes: number;
	comments: number;
}

export default function MostLikedPosts() {
	// Sample static data for the 3 posts
	const posts: Post[] = [
		{
			id: "post1",
			user: {
				name: "Radha Krishna",
				avatar: "/dharmlok-logo.svg",
				bio: "Devotee of Lord Krishna and spiritual guide",
			},
			image: "/dharmlok-logo.svg",
			content:
				"The journey of spiritual enlightenment begins with self-awareness and devotion. Join us for the upcoming event at the temple this weekend.",
			timestamp: "2 hours ago",
			likes: 328,
			comments: 42,
		},
		{
			id: "post2",
			user: {
				name: "Dharmlok Temple",
				avatar: "/dharmlok-logo.svg",
				bio: "Official account of Dharmlok Temple",
			},
			image: "/dharmlok-logo.svg",
			content:
				"Celebrating the festival of colors with devotion and joy. See our gallery for more beautiful moments from this year's celebration.",
			timestamp: "1 day ago",
			likes: 254,
			comments: 36,
		},
		{
			id: "post3",
			user: {
				name: "Vedic Wisdom",
				avatar: "/dharmlok-logo.svg",
				bio: "Sharing ancient wisdom for modern life",
			},
			image: "/dharmlok-logo.svg",
			content:
				"The essence of Bhagavad Gita explained in simple terms. Swipe to read more about karma yoga and its relevance today.",
			timestamp: "3 days ago",
			likes: 187,
			comments: 29,
		},
	];

	return (
		<Card className="w-full shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<TrendingUp className="h-5 w-5 text-primary" />
					Most Liked Posts
				</CardTitle>
			</CardHeader>

			<Separator />

			<CardContent className="p-0">
				<div className="divide-y">
					{posts.map((post) => (
						<div
							key={post.id}
							className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
						>
							<div className="flex items-start gap-3 mb-3">
								<Avatar className="h-10 w-10 border">
									<AvatarImage src={post.user.avatar} alt={post.user.name} />
									<AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<h3 className="font-medium text-sm truncate">
										{post.user.name}
									</h3>
									<p className="text-xs text-muted-foreground line-clamp-1">
										{post.user.bio}
									</p>
								</div>
							</div>

							<div className="relative aspect-video rounded-md overflow-hidden mb-3">
								<Image
									src={post.image}
									alt="Post image"
									fill
									sizes="(max-width: 768px) 100vw, 300px"
									className="object-cover"
									unoptimized
								/>
							</div>

							<p className="text-sm line-clamp-2 mb-3">{post.content}</p>

							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>{post.timestamp}</span>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1">
										<Heart className="h-3.5 w-3.5 text-red-500" />
										<span>{post.likes}</span>
									</div>
									<div className="flex items-center gap-1">
										<MessageCircle className="h-3.5 w-3.5" />
										<span>{post.comments}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				<Separator />

				<div className="p-2">
					<Button
						variant="ghost"
						className="w-full text-sm text-primary hover:text-primary"
					>
						View all posts
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
