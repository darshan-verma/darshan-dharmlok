import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { VideoData, VideoFormErrors } from "./types";

type Props = {
	video: VideoData | null;
	editedVideo: VideoData | null;
	isEditing: boolean;
	isUploadingThumbnail: boolean;
	thumbnailError: boolean;
	errors: VideoFormErrors;
	onEdit: () => void;
	onThumbnailUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveThumbnail: () => void;
	onThumbnailUrlChange: (value: string) => void;
};

const getStatusColor = (status: string) =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export function VideoDetailCard({
	video,
	editedVideo,
	isEditing,
	isUploadingThumbnail,
	thumbnailError,
	errors,
	onEdit,
	onThumbnailUpload,
	onRemoveThumbnail,
	onThumbnailUrlChange,
}: Props) {
	return (
		<Card className="h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<div className="relative w-24 h-16 mx-auto mb-3">
					<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
						{(isEditing ? editedVideo?.thumbnailUrl : video?.thumbnailUrl) &&
						!thumbnailError ? (
							<Image
								src={
									isEditing
										? editedVideo?.thumbnailUrl || "/placeholder.png"
										: video?.thumbnailUrl || "/placeholder.png"
								}
								alt={
									isEditing
										? editedVideo?.title || "Video"
										: video?.title || "Video"
								}
								width={96}
								height={64}
								className="w-full h-full rounded-lg object-cover"
								onError={() => {
									/* handled in parent */
								}}
							/>
						) : (
							<ImageIcon className="h-10 w-10 text-muted-foreground" />
						)}
					</div>
					{isEditing && editedVideo?.thumbnailUrl && !thumbnailError && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemoveThumbnail}
							title="Remove thumbnail"
							tabIndex={-1}
							className="absolute bottom-1 right-1 bg-white/80"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				<CardTitle className="text-center text-lg">{video?.title}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
							video ? getStatusColor(video.status) : "bg-red-100 text-red-800"
						}`}
					>
						{video?.status || "Unknown"}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Type:</span>
					<span>{video?.type}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Category:</span>
					<span>{video?.category}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Date:</span>
					<span>
						{video?.date
							? new Date(video.date).toLocaleDateString("en-IN", {
									day: "2-digit",
									month: "short",
									year: "numeric",
							  })
							: "N/A"}
					</span>
				</div>
				{isEditing && (
					<div className="space-y-2">
						<Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
						<Input
							id="thumbnailUrl"
							type="url"
							value={editedVideo?.thumbnailUrl || ""}
							onChange={(e) => onThumbnailUrlChange(e.target.value)}
							placeholder="https://example.com/thumbnail.jpg"
							className={errors.thumbnailUrl ? "border-red-500" : ""}
						/>
						<p className="text-xs text-gray-500">
							Provide a direct link to the video thumbnail or upload below.
						</p>
						<Label htmlFor="thumbnailUpload" className="block mt-2">
							Upload Thumbnail
						</Label>
						<Input
							id="thumbnailUpload"
							type="file"
							accept="image/jpeg,image/jpg,image/png,image/webp"
							onChange={onThumbnailUpload}
							disabled={isUploadingThumbnail}
						/>
						{isUploadingThumbnail && (
							<p className="text-xs text-blue-600">Uploading...</p>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={onEdit}
				>
					{isEditing ? "Cancel" : "Edit Video"}
				</Button>
			</CardFooter>
		</Card>
	);
}
