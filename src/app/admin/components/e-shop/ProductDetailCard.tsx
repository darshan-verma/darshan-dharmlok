import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product, getStatusColor, formatDate } from "./types";

interface Props {
	product: Product | null;
	isEditing: boolean;
	onEdit: () => void;
}

export function ProductDetailCard({ product, isEditing, onEdit }: Props) {
	if (!product) return null;

	return (
		<Card className="md:col-span-1 h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<CardTitle className="text-center text-lg">{product.name}</CardTitle>
				<CardDescription>
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
							product.status
						)}`}
					>
						{product.status}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Category:</span>
					<span>
						{Array.isArray(product.category)
							? product.category[0]
							: product.category}
					</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Date:</span>
					<span>{product.date ? formatDate(product.date) : "N/A"}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Price per Unit:</span>
					<span>₹{product.pricePerUnit?.toLocaleString("en-IN")}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Available Stock:</span>
					<span>{product.availableQty}</span>
				</div>
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={onEdit}
				>
					{isEditing ? "Cancel" : "Edit Product"}
				</Button>
			</CardFooter>
		</Card>
	);
}
