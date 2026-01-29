"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
	parseBlogContent,
	getBlockText,
	type BlockNoteBlock,
} from "@/lib/blog-content";

interface Blog {
	id: string;
	title: string;
	content: string;
	coverImage?: string;
	bannerImage?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export default function BlogDetailPage() {
	const params = useParams();
	const blogId = Array.isArray(params.blogId) ? params.blogId[0] : params.blogId;

	const [blog, setBlog] = useState<Blog | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!blogId) return;

		const fetchBlog = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(`/api/blogs/${blogId}`);
				if (!response.ok) {
					if (response.status === 404) {
						setError("Blog not found");
						setBlog(null);
						return;
					}
					throw new Error("Failed to fetch blog");
				}
				const data = await response.json();
				setBlog({
					id: data.id,
					title: data.title,
					content: data.content,
					coverImage: data.coverImage,
					bannerImage: data.bannerImage,
					status: data.status,
					createdAt: data.createdAt,
					updatedAt: data.updatedAt,
				});
			} catch (err) {
				console.error("Error fetching blog:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load blog"
				);
				setBlog(null);
			} finally {
				setLoading(false);
			}
		};

		fetchBlog();
	}, [blogId]);

	function renderBlock(block: BlockNoteBlock, index: number) {
		const text = getBlockText(block);
		if (!text) return null;

		switch (block.type) {
			case "heading": {
				const level = (block.props?.level as number) || 1;
				const levelNum = Math.min(6, Math.max(1, level));
				const className =
					"font-serif font-bold text-gray-900 mt-8 mb-3 first:mt-0";
				if (levelNum === 1)
					return (
						<h1 key={index} className={`text-3xl ${className}`}>
							{text}
						</h1>
					);
				if (levelNum === 2)
					return (
						<h2 key={index} className={`text-2xl ${className}`}>
							{text}
						</h2>
					);
				if (levelNum === 3)
					return (
						<h3 key={index} className={`text-xl ${className}`}>
							{text}
						</h3>
					);
				if (levelNum === 4)
					return (
						<h4 key={index} className={`text-lg ${className}`}>
							{text}
						</h4>
					);
				if (levelNum === 5)
					return (
						<h5 key={index} className={`text-base ${className}`}>
							{text}
						</h5>
					);
				return (
					<h6 key={index} className={`text-sm ${className}`}>
						{text}
					</h6>
				);
			}
			case "paragraph":
			default:
				return (
					<p
						key={index}
						className="text-gray-700 leading-relaxed mb-4"
						style={{ fontFamily: "var(--font-jost), sans-serif" }}
					>
						{text}
					</p>
				);
		}
	}

	if (loading && !blog) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg text-muted-foreground">
						Loading blog...
					</p>
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !blog) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<p className="text-lg text-red-500">
						{error || "Blog not found"}
					</p>
				</div>
				<Footer />
			</div>
		);
	}

	const bannerImage =
		blog.bannerImage ||
		blog.coverImage ||
		"/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
	const blocks = parseBlogContent(blog.content);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section */}
			<section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={blog.title}
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/40" />
				</div>

				<div className="relative z-10 h-full flex items-end pb-12">
					<div className="container mx-auto px-4">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white drop-shadow-2xl max-w-4xl">
							{blog.title}
						</h1>
						{blog.createdAt && (
							<p className="text-white/90 mt-2 text-sm md:text-base">
								{new Date(blog.createdAt).toLocaleDateString(
									"en-IN",
									{
										day: "numeric",
										month: "long",
										year: "numeric",
									}
								)}
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Blog Content */}
			<section className="py-12 md:py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-3xl">
					<article className="bg-white rounded-2xl shadow-sm border border-border/20 p-6 md:p-10">
						{blocks.length > 0 ? (
							blocks.map((block, index) => renderBlock(block, index))
						) : (
							<p className="text-gray-600">No content available.</p>
						)}
					</article>
				</div>
			</section>

			<Footer />
		</div>
	);
}
