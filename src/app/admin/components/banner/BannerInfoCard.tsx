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
import { Banner, BannerFormErrors } from "./types";

const bannerCategories = [
	"Homepage",
	"Event",
	"Promotion",
	"Spiritual",
	"Mythology",
	"Other",
];

const bannerTypes = ["Image", "Video", "Slider", "Popup", "Other"];

const bannerStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

type Props = {
	banner: Banner | null;
	editedBanner: Banner | null;
	isEditing: boolean;
	isSaving: boolean;
	errors: BannerFormErrors;
	onFieldChange: (field: keyof Banner, value: string) => void;
	onSave: () => void;
};

export function BannerInfoCard({
	banner,
	editedBanner,
	isEditing,
	isSaving,
	errors,
	onFieldChange,
	onSave,
}: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Banner Information</CardTitle>
				<CardDescription>Update banner details and metadata.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{isEditing ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={editedBanner?.title || ""}
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
								value={editedBanner?.date || ""}
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
								value={editedBanner?.description || ""}
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
									value={editedBanner?.category || ""}
									onValueChange={(value) => onFieldChange("category", value)}
								>
									<SelectTrigger
										id="category"
										className={errors.category ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{bannerCategories.map((cat) => (
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
									value={editedBanner?.type || ""}
									onValueChange={(value) => onFieldChange("type", value)}
								>
									<SelectTrigger
										id="type"
										className={errors.type ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{bannerTypes.map((type) => (
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
								value={editedBanner?.status || ""}
								onValueChange={(value) => onFieldChange("status", value)}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{bannerStatuses.map((status) => (
										<SelectItem key={status.value} value={status.value}>
											{status.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.status && (
								<p className="text-sm text-red-500">{errors.status}</p>
							)}
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Title
								</h3>
								<p className="font-medium text-foreground">{banner?.title}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Type
								</h3>
								<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
									{banner?.type}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Category
								</h3>
								<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
									{banner?.category}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Status
								</h3>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										banner?.status === "Active"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{banner?.status}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Date
								</h3>
								<p className="font-medium text-foreground">
									{banner?.date
										? new Date(banner.date).toLocaleDateString("en-IN", {
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
								{banner?.description || "No description provided"}
							</p>
						</div>
						{banner?.imageUrl && (
							<div className="space-y-2 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Banner Image
								</h3>
								<div className="w-48 h-28 rounded-lg overflow-hidden border">
									<Image
										src={banner.imageUrl}
										alt={banner.title}
										width={192}
										height={112}
										className="w-full h-full object-cover"
										unoptimized={true}
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
