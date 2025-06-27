import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TempleData } from "./types";

type Props = {
	temple: TempleData | null;
	isEditing: boolean;
	errors: Record<string, string>;
	onEdit: () => void;
};

export function TempleDetailCard({ temple, isEditing, errors, onEdit }: Props) {
	if (!temple) return null;

	return (
		<Card className="h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<CardTitle className="text-center text-lg">{temple.name}</CardTitle>
				<CardDescription>
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
							temple.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{temple.status}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">State:</span>
					<span>{temple.state}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">City:</span>
					<span>{temple.city}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">Date:</span>
					<span>{temple.date ? temple.date.split("T")[0] : "N/A"}</span>
				</div>
				{isEditing && errors.name && (
					<p className="text-sm text-red-500">{errors.name}</p>
				)}
				{isEditing && errors.date && (
					<p className="text-sm text-red-500">{errors.date}</p>
				)}
				{isEditing && errors.state && (
					<p className="text-sm text-red-500">{errors.state}</p>
				)}
				{isEditing && errors.city && (
					<p className="text-sm text-red-500">{errors.city}</p>
				)}
				{isEditing && errors.status && (
					<p className="text-sm text-red-500">{errors.status}</p>
				)}
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={onEdit}
				>
					{isEditing ? "Cancel" : "Edit Temple"}
				</Button>
			</CardFooter>
		</Card>
	);
}
