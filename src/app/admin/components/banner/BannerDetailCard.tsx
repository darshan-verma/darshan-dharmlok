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
import { Banner, BannerFormErrors } from "./types";

type Props = {
	banner: Banner | null;
	editedBanner: Banner | null;
	isEditing: boolean;
	isUploadingImage: boolean;
	imageError: boolean;
	errors: BannerFormErrors;
	onEdit: () => void;
	onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveImage: () => void;
	onImageUrlChange: (value: string) => void;
};

const getStatusColor = (status: string) =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export function BannerDetailCard({
	banner,
	editedBanner,
	isEditing,
	isUploadingImage,
	imageError,
	errors,
	onEdit,
	onImageUpload,
	onRemoveImage,
	onImageUrlChange,
}: Props) {
	return (
		<Card className="h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<div className="relative w-24 h-16 mx-auto mb-3">
					<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
						{(isEditing ? editedBanner?.imageUrl : banner?.imageUrl) &&
						!imageError ? (
							<Image
								src={
									isEditing
										? editedBanner?.imageUrl || "/placeholder.png"
										: banner?.imageUrl || "/placeholder.png"
								}
								alt={
									isEditing
										? editedBanner?.title || "Banner"
										: banner?.title || "Banner"
								}
								width={96}
								height={64}
								className="w-full h-full rounded-lg object-cover"
								onError={() => {
									/* handled in parent */
								}}
								unoptimized={true}
							/>
						) : (
							<ImageIcon className="h-10 w-10 text-muted-foreground" />
						)}
					</div>
					{isEditing && editedBanner?.imageUrl && !imageError && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemoveImage}
							title="Remove image"
							tabIndex={-1}
							className="absolute bottom-1 right-1 bg-white/80"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				<CardTitle className="text-center text-lg">{banner?.title}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
							banner ? getStatusColor(banner.status) : "bg-red-100 text-red-800"
						}`}
					>
						{banner?.status || "Unknown"}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Type:</span>
					<span>{banner?.type}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Category:</span>
					<span>{banner?.category}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Date:</span>
					<span>
						{banner?.date
							? new Date(banner.date).toLocaleDateString("en-IN", {
									day: "2-digit",
									month: "short",
									year: "numeric",
							  })
							: "N/A"}
					</span>
				</div>
				{isEditing && (
					<div className="space-y-2">
						<Label htmlFor="imageUrl">Banner Image URL</Label>
						<Input
							id="imageUrl"
							type="url"
							value={editedBanner?.imageUrl || ""}
							onChange={(e) => onImageUrlChange(e.target.value)}
							placeholder="https://example.com/banner.jpg"
							className={errors.imageUrl ? "border-red-500" : ""}
						/>
						<p className="text-xs text-gray-500">
							Provide a direct link to the banner image or upload below.
						</p>
						<Label htmlFor="bannerImageUpload" className="block mt-2">
							Upload Banner Image
						</Label>
						<Input
							id="bannerImageUpload"
							type="file"
							accept="image/jpeg,image/jpg,image/png,image/webp"
							onChange={onImageUpload}
							disabled={isUploadingImage}
						/>
						{isUploadingImage && (
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
					{isEditing ? "Cancel" : "Edit Banner"}
				</Button>
			</CardFooter>
		</Card>
	);
}
