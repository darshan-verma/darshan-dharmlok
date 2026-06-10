import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import Image from "next/image";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { Ebook } from "./types";

interface EbookInfoCardProps {
	ebook: Ebook | null;
}

export default function EbookInfoCard({ ebook }: EbookInfoCardProps) {
	if (!ebook) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>Ebook Information</CardTitle>
				<CardDescription>Read-only ebook details.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">Title</h3>
						<p className="font-medium text-foreground">{ebook.title}</p>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">Type</h3>
						<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
							{ebook.type}
						</span>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">
							Category
						</h3>
						<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
							{ebook.category}
						</span>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">
							Religious Category
						</h3>
						<ReligiousCategoryBadges
							religiousCategories={ebook.religiousCategories}
						/>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">
							Status
						</h3>
						<span
							className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
								ebook.status === "Active"
									? "bg-green-100 text-green-800"
									: "bg-red-100 text-red-800"
							}`}
						>
							{ebook.status}
						</span>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">Date</h3>
						<p className="font-medium text-foreground">{ebook.date}</p>
					</div>
				</div>
				<div className="space-y-2 pt-2 border-t border-border">
					<h3 className="text-sm font-medium text-muted-foreground">
						Description
					</h3>
					<p className="font-medium text-foreground whitespace-pre-wrap">
						{ebook.description || "No description provided"}
					</p>
				</div>
				<div className="space-y-2 pt-2 border-t border-border">
					<h3 className="text-sm font-medium text-muted-foreground">Detail</h3>
					<p className="font-medium text-foreground whitespace-pre-wrap">
						{ebook.detail || "No detail provided"}
					</p>
				</div>
				{ebook.bookFile && (
					<div className="space-y-2 pt-2 border-t border-border">
						<h3 className="text-sm font-medium text-muted-foreground">
							Book PDF
						</h3>
						<a
							href={ebook.bookFile}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 underline break-all"
						>
							{ebook.bookFile}
						</a>
					</div>
				)}
				{ebook.bookCover && (
					<div className="space-y-2 pt-2 border-t border-border">
						<h3 className="text-sm font-medium text-muted-foreground">
							Book Cover
						</h3>
						<div className="w-24 h-32 rounded-lg overflow-hidden border">
							<Image
								src={ebook.bookCover}
								alt="Book Cover"
								width={96}
								height={128}
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
