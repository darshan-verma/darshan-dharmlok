import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { BookOpen, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Ebook } from "./types";

interface EbookProfileCardProps {
	ebook: Ebook | null;
	editedEbook: Ebook | null;
	isEditing: boolean;
	isUploadingBookCover: boolean;
	isUploadingBook: boolean;
	handleBookCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemoveBookCover: () => void;
	handleBookUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemoveBookFile: () => void;
}

export default function EbookProfileCard({
	ebook,
	editedEbook,
	isEditing,
	isUploadingBookCover,
	isUploadingBook,
	handleBookCoverUpload,
	handleRemoveBookCover,
	handleBookUpload,
	handleRemoveBookFile,
}: EbookProfileCardProps) {
	const coverUrl = editedEbook?.bookCover || ebook?.bookCover || "";
	const pdfUrl = editedEbook?.bookFile || ebook?.bookFile || "";
	const status = ebook?.status || "Unknown";
	const statusColor =
		status === "Active"
			? "bg-green-100 text-green-800"
			: "bg-red-100 text-red-800";

	return (
		<Card className="h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
				<CardTitle className="text-center text-lg">{ebook?.title}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}
					>
						{status}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				{/* Book PDF upload (edit mode) */}
				{isEditing && (
					<div className="space-y-2">
						<label htmlFor="bookFile">Book PDF *</label>
						<div className="relative flex items-center gap-2">
							<input
								id="bookFile"
								type="file"
								accept="application/pdf"
								onChange={handleBookUpload}
								disabled={isUploadingBook}
								className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
							/>
							{pdfUrl && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={handleRemoveBookFile}
									title="Remove PDF"
									tabIndex={-1}
								>
									<Trash2 className="h-4 w-4 text-red-500" />
								</Button>
							)}
						</div>
						{pdfUrl && (
							<div className="flex items-center gap-2 mt-2">
								<a
									href={pdfUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-blue-700 underline break-all"
								>
									{pdfUrl.split("/").pop()}
								</a>
							</div>
						)}
						<p className="text-xs text-gray-500 mt-1">
							{pdfUrl
								? "PDF uploaded successfully!"
								: "Upload a PDF file for the ebook (max 20MB)"}
						</p>
					</div>
				)}
				{/* Book Cover upload (edit mode) */}
				{isEditing && (
					<div className="space-y-2">
						<label htmlFor="bookCover">Book Cover (Image)</label>
						<div className="relative">
							<input
								id="bookCover"
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handleBookCoverUpload}
								disabled={isUploadingBookCover}
							/>
							{coverUrl && (
								<div className="flex items-center gap-2 mt-2">
									<Image
										src={coverUrl}
										alt="Book Cover"
										width={96}
										height={128}
										className="w-16 h-20 object-cover rounded border"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleRemoveBookCover}
										title="Remove book cover"
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							)}
						</div>
						{isUploadingBookCover && (
							<p className="text-xs text-blue-600">Uploading book cover...</p>
						)}
						<p className="text-xs text-gray-500">
							Upload a cover image for the book (JPEG, PNG, WebP, max 5MB)
						</p>
					</div>
				)}
				{/* Book Cover display (view mode) */}
				{!isEditing && coverUrl && (
					<div className="flex flex-col items-center gap-2 mt-2">
						<Image
							src={coverUrl}
							alt="Book Cover"
							width={96}
							height={128}
							className="w-16 h-20 object-cover rounded border"
						/>
					</div>
				)}
				{/* Book PDF display (view mode) */}
				{!isEditing && pdfUrl && (
					<div className="flex flex-col items-center gap-2 mt-2">
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-blue-700 underline break-all"
						>
							{pdfUrl.split("/").pop()}
						</a>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
