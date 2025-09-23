import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import Image from "next/image";
import { PoojaCategory } from "./types";

interface Props {
	pooja: PoojaCategory | null;
}

export function PoojaCategoryDetailCard({ pooja }: Props) {
	if (!pooja) return null;

	return (
		<Card>
			<CardHeader className="pb-1 pt-3">
				<CardTitle className="text-lg">
					{pooja?.name || "Pooja Category"}
				</CardTitle>
				<CardDescription className="text-sm line-clamp-2">
					{pooja?.description}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-0.5 pt-0 pb-3 text-sm">
				<div className="flex justify-between py-0.5 border-b border-gray-100">
					<span className="font-medium">Date:</span>
					<span>
						{pooja?.date ? new Date(pooja.date).toLocaleDateString() : "-"}
					</span>
				</div>
				<div className="flex justify-between py-0.5 border-b border-gray-100">
					<span className="font-medium">Price:</span>
					<span>
						{typeof pooja?.price === "number" ? `₹${pooja.price}` : "-"}
					</span>
				</div>
				<div className="flex justify-between items-center py-0.5">
					<span className="font-medium">Status:</span>
					<span
						className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-sm ${
							pooja?.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{pooja?.status === "Active" ? "Active" : "Inactive"}
					</span>
				</div>
				{pooja?.details && (
					<div className="pt-1 mt-1 border-t border-gray-100">
						<span className="font-medium">Details:</span>
						<p className="text-sm mt-0.5 line-clamp-2">{pooja?.details}</p>
					</div>
				)}
				{pooja?.images && pooja.images.length > 0 && (
					<div className="pt-1 mt-1 border-t border-gray-100">
						<span className="font-medium">Images:</span>
						<div className="flex flex-wrap gap-2 mt-1">
							{pooja.images.map((image, index) => (
								<Image
									key={index}
									src={image}
									alt={`Image ${index + 1}`}
									width={64}
									height={64}
									className="w-16 h-16 object-cover rounded"
								/>
							))}
						</div>
					</div>
				)}
				{pooja?.videos && pooja.videos.length > 0 && (
					<div className="pt-1 mt-1 border-t border-gray-100">
						<span className="font-medium">Videos:</span>
						<div className="flex flex-wrap gap-2 mt-1">
							{pooja.videos.map((video, index) => (
								<video
									key={index}
									src={video}
									className="w-16 h-16 object-cover rounded"
									controls={false}
								/>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
