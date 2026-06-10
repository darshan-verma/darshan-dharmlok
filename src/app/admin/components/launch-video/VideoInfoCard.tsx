import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Save } from "lucide-react";
import { VideoData, VideoFormErrors } from "./types";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import type { ReligiousCategory } from "@/lib/religious-categories";

const videoCategories = [
	"Tutorial",
	"Sermon",
	"Event",
	"Music",
	"Documentary",
	"Other",
];
const videoTypes = ["MP4", "YouTube", "Vimeo", "Other"];
const videoStatuses = ["Draft", "Active", "Inactive"];

type Props = {
	video: VideoData | null;
	editedVideo: VideoData | null;
	isEditing: boolean;
	isSaving: boolean;
	errors: VideoFormErrors;
	onFieldChange: (field: keyof VideoData, value: string) => void;
	onSave: () => void;
	setEditedVideo?: React.Dispatch<React.SetStateAction<VideoData | null>>;
};

export function VideoInfoCard({
	video,
	editedVideo,
	isEditing,
	isSaving,
	errors,
	onFieldChange,
	onSave,
	setEditedVideo,
}: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Video Information</CardTitle>
				<CardDescription>Update video details and metadata.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{isEditing ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={editedVideo?.title || ""}
								onChange={(e) => onFieldChange("title", e.target.value)}
								className={errors.title ? "border-red-500" : ""}
							/>
							{errors.title && (
								<p className="text-sm text-red-500">{errors.title}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="date">Date *</Label>
							<Input
								id="date"
								type="date"
								value={editedVideo?.date || ""}
								onChange={(e) => onFieldChange("date", e.target.value)}
								className={errors.date ? "border-red-500" : ""}
							/>
							{errors.date && (
								<p className="text-sm text-red-500">{errors.date}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description *</Label>
							<Textarea
								id="description"
								value={editedVideo?.description || ""}
								onChange={(e) => onFieldChange("description", e.target.value)}
								rows={3}
								className={errors.description ? "border-red-500" : ""}
							/>
							{errors.description && (
								<p className="text-sm text-red-500">{errors.description}</p>
							)}
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="category">Category *</Label>
								<Select
									value={editedVideo?.category || ""}
									onValueChange={(value) => onFieldChange("category", value)}
								>
									<SelectTrigger
										id="category"
										className={errors.category ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{videoCategories.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{cat}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.category && (
									<p className="text-sm text-red-500">{errors.category}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="type">Type *</Label>
								<Select
									value={editedVideo?.type || ""}
									onValueChange={(value) => onFieldChange("type", value)}
								>
									<SelectTrigger
										id="type"
										className={errors.type ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{videoTypes.map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.type && (
									<p className="text-sm text-red-500">{errors.type}</p>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status *</Label>
							<Select
								value={editedVideo?.status || ""}
								onValueChange={(value) => onFieldChange("status", value)}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{videoStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.status && (
								<p className="text-sm text-red-500">{errors.status}</p>
							)}
						</div>
						{setEditedVideo && (
							<ReligiousCategoryPills
								value={editedVideo?.religiousCategories || []}
								onChange={(value: ReligiousCategory[]) =>
									setEditedVideo((prev) =>
										prev ? { ...prev, religiousCategories: value } : prev
									)
								}
							/>
						)}
						<div className="space-y-2">
							<Label htmlFor="videoUrl">Video URL *</Label>
							<Input
								id="videoUrl"
								type="url"
								value={editedVideo?.videoUrl || ""}
								onChange={(e) => onFieldChange("videoUrl", e.target.value)}
								className={errors.videoUrl ? "border-red-500" : ""}
							/>
							{errors.videoUrl && (
								<p className="text-sm text-red-500">{errors.videoUrl}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
							<Input
								id="thumbnailUrl"
								type="url"
								value={editedVideo?.thumbnailUrl || ""}
								onChange={(e) => onFieldChange("thumbnailUrl", e.target.value)}
							/>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Title
								</h3>
								<p className="font-medium text-foreground">{video?.title}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Type
								</h3>
								<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
									{video?.type}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Category
								</h3>
								<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
									{video?.category}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Religious Category
								</h3>
								<ReligiousCategoryBadges
									religiousCategories={video?.religiousCategories}
								/>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Status
								</h3>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										video?.status === "Active"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{video?.status}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Date
								</h3>
								<p className="font-medium text-foreground">
									{video?.date
										? new Date(video.date).toLocaleDateString("en-IN", {
												day: "2-digit",
												month: "short",
												year: "numeric",
										  })
										: "N/A"}
								</p>
							</div>
						</div>
						<div className="space-y-2 pt-2 border-t border-border">
							<h3 className="text-sm font-medium text-muted-foreground">
								Description
							</h3>
							<p className="font-medium text-foreground whitespace-pre-wrap">
								{video?.description || "No description provided"}
							</p>
						</div>
						{video?.videoUrl && (
							<div className="space-y-2 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Video URL
								</h3>
								<a
									href={video.videoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 underline break-all"
								>
									{video.videoUrl}
								</a>
							</div>
						)}
						{video?.thumbnailUrl && (
							<div className="space-y-2 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Thumbnail
								</h3>
								<div className="w-48 h-28 rounded-lg overflow-hidden border">
									<Image
										src={video.thumbnailUrl}
										alt={video.title}
										width={192}
										height={112}
										className="w-full h-full object-cover"
									/>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
			{isEditing && (
				<CardFooter>
					<Button onClick={onSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</>
						)}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
