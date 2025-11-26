"use client";
import { Checkbox } from "@/components/ui/checkbox";

interface ZeroCancellationOptionProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}

export default function ZeroCancellationOption({
	checked,
	onCheckedChange,
}: ZeroCancellationOptionProps) {
	return (
		<div className="flex items-start space-x-3">
			<Checkbox
				id="zero-cancellation"
				checked={checked}
				onCheckedChange={onCheckedChange}
				className="mt-0.5"
			/>
			<label
				htmlFor="zero-cancellation"
				className="text-sm text-gray-700 cursor-pointer leading-relaxed"
			>
				<span className="font-medium">Add Zero Cancellation</span> Get 100%
				refund on cancellation{" "}
				<button className="text-blue-600 hover:underline font-normal">
					View Details
				</button>
			</label>
		</div>
	);
}
