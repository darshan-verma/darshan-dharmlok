"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star, Bookmark, Loader2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * Props for the KathavachakDharmguruCard component.
 */
interface KathavachakDharmguruCardProps extends Omit<
	React.HTMLAttributes<HTMLDivElement>,
	| "onDrag"
	| "onDragStart"
	| "onDragEnd"
	| "onAnimationStart"
	| "onAnimationEnd"
	| "onAnimationIteration"
> {
	/** The dharmguru/kathavachak data */
	dharmguru: {
		id: string;
		name: string;
		profileImageUrl?: string;
		bannerImageUrl?: string;
		bio?: string;
		description?: string;
		category?: string;
		rank?: string;
	};
	/** Optional click handler for the "Get in touch" button. */
	onGetInTouch?: () => void;
	/** Optional click handler for the bookmark icon. */
	onBookmark?: () => void;
	/** Optional loading state for the button. */
	isLoading?: boolean;
	/** Optional additional class names. */
	className?: string;
}

// Animation variants for Framer Motion
const cardVariants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "easeOut" },
	},
	hover: {
		scale: 1.03,
		transition: { duration: 0.3 },
	},
};

const contentVariants = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.3, // Start staggering after card loads
		},
	},
};

const itemVariants = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Helper function to extract plain text from BlockNote JSON
const extractPlainTextFromBlockNote = (content: string): string => {
	interface BlockNoteTextItem {
		text: string;
		[key: string]: unknown;
	}

	interface BlockNoteBlock {
		type: string;
		content?: BlockNoteTextItem[];
		[key: string]: unknown;
	}

	try {
		const blocks: BlockNoteBlock[] = JSON.parse(content);
		if (!Array.isArray(blocks)) return "";

		return blocks
			.map((block: BlockNoteBlock) => {
				if (block.type === "paragraph" && block.content) {
					return block.content
						.map((item: BlockNoteTextItem) => item.text || "")
						.join("");
				}
				return "";
			})
			.filter((text: string) => text.trim())
			.join(" ");
	} catch {
		return content;
	}
};

/**
 * A reusable, animated profile card component with frosted glass effect.
 */
export const KathavachakDharmguruCard = React.forwardRef<
	HTMLDivElement,
	KathavachakDharmguruCardProps
>(
	(
		{
			className,
			dharmguru,
			onGetInTouch,
			onBookmark,
			isLoading = false,
			...props
		},
		ref,
	) => {
		const avatarName = dharmguru.name
			.split(" ")
			.map((n) => n[0])
			.join("");

		// Get description text with BlockNote support
		const getDescription = (): string => {
			if (dharmguru.bio) {
				const trimmedBio = dharmguru.bio.trim();
				if (trimmedBio.startsWith("[") || trimmedBio.startsWith("{")) {
					const extractedText = extractPlainTextFromBlockNote(dharmguru.bio);
					return (
						extractedText ||
						`Connect with ${dharmguru.name}, an experienced and knowledgeable spiritual guide.`
					);
				}
				return dharmguru.bio;
			}
			if (dharmguru.description) {
				return dharmguru.description;
			}
			return `Connect with ${dharmguru.name}, an experienced and knowledgeable spiritual guide.`;
		};

		const description = getDescription();
		const truncatedDescription =
			description.length > 100
				? description.substring(0, 100) + "..."
				: description;

		// Fallback banner image
		const bannerSrc =
			dharmguru.bannerImageUrl ||
			"https://images.unsplash.com/photo-1750682053165-ed96153fb0b2?ixlib=rb-4.1.0&auto=format&fit=crop&q=60&w=900";
		const avatarSrc = dharmguru.profileImageUrl || "";

		return (
			<motion.div
				ref={ref}
				className={cn(
					"relative w-full max-w-sm overflow-hidden rounded-2xl shadow-lg",
					"backdrop-blur-xl bg-white/80 border border-white/30",
					className,
				)}
				variants={cardVariants}
				initial="initial"
				animate="animate"
				whileHover="hover"
				{...props}
			>
				{/* Frosted glass overlay effect */}
				<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-2xl z-0" />

				{/* Banner Image */}
				<div className="h-32 w-full relative z-10">
					{bannerSrc ? (
						<Image
							src={bannerSrc}
							alt={`${dharmguru.name}'s banner`}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, 384px"
						/>
					) : (
						<div className="h-full w-full bg-gradient-to-br from-orange-400 to-yellow-500" />
					)}
				</div>

				{/* Bookmark Button */}
				{onBookmark && (
					<Button
						variant="secondary"
						size="icon"
						className="absolute right-4 top-4 h-9 w-9 rounded-lg bg-background/50 backdrop-blur-sm text-card-foreground/80 hover:bg-background/70 z-20"
						onClick={onBookmark}
						aria-label="Bookmark profile"
					>
						<Bookmark className="h-4 w-4" />
					</Button>
				)}

				{/* Avatar (overlaps banner) */}
				<div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2 z-20">
					<Avatar className="h-20 w-20 border-4 border-white/80 shadow-lg">
						{avatarSrc ? (
							<AvatarImage src={avatarSrc} alt={dharmguru.name} />
						) : null}
						<AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-xl font-bold">
							{avatarName}
						</AvatarFallback>
					</Avatar>
				</div>

				{/* Content Area */}
				<motion.div
					className="px-6 pb-6 pt-12 backdrop-blur-md bg-white/70 rounded-b-2xl relative z-10"
					variants={contentVariants}
				>
					{/* Name, Title, and Category */}
					<motion.div className="mb-4 text-center" variants={itemVariants}>
						<h2 className="text-xl font-semibold text-card-foreground mb-1">
							{dharmguru.name}
						</h2>
						{dharmguru.category && (
							<p className="text-sm text-muted-foreground">
								{dharmguru.category}
							</p>
						)}
						{dharmguru.rank && (
							<p className="text-xs text-muted-foreground mt-1">
								{dharmguru.rank}
							</p>
						)}
					</motion.div>

					{/* Description */}
					<motion.div className="mb-4" variants={itemVariants}>
						<p className="text-sm text-muted-foreground text-center leading-relaxed">
							{truncatedDescription}
						</p>
					</motion.div>

					{/* Badges */}
					<motion.div
						className="my-6 flex items-center justify-center gap-2 flex-wrap"
						variants={itemVariants}
					>
						{/* Rating Badge */}
						<Badge variant="rating" icon={Star}>
							4.8
						</Badge>
						{/* Category Badge */}
						<Badge variant="category">
							{dharmguru.category || "Spiritual"}
						</Badge>
						{/* Availability Badge */}
						<Badge variant="available">Available</Badge>
					</motion.div>

					{/* Action Button */}
					{onGetInTouch && (
						<motion.div variants={itemVariants}>
							<Button
								className="w-full"
								size="lg"
								onClick={onGetInTouch}
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Loading...
									</>
								) : (
									"View Details"
								)}
							</Button>
						</motion.div>
					)}
				</motion.div>
			</motion.div>
		);
	},
);
KathavachakDharmguruCard.displayName = "KathavachakDharmguruCard";

// Badge component with different color variants
const Badge = ({
	children,
	variant,
	icon: Icon,
}: {
	children: React.ReactNode;
	variant: "rating" | "category" | "available";
	icon?: React.ComponentType<{ className?: string }>;
}) => {
	const variantStyles = {
		rating:
			"bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
		category:
			"bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
		available:
			"bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
				variantStyles[variant],
			)}
		>
			{Icon && <Icon className="h-3 w-3" />}
			{children}
		</span>
	);
};
