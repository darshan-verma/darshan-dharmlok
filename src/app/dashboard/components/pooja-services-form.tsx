import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, PlusCircle, X } from "lucide-react";

export interface PoojaCategoryOption {
	id: string;
	name: string;
}

export interface PoojaServiceFormValues {
	id?: string;
	categoryId: string;
	price: string;
	details: string;
	status: "Active" | "Inactive";
}

interface PoojaServicesFormProps {
	categories: PoojaCategoryOption[];
	initialValues?: PoojaServiceFormValues;
	loading?: boolean;
	onSubmit: (values: PoojaServiceFormValues) => Promise<void>;
	onCancel?: () => void;
}

export default function PoojaServicesForm({
	categories,
	initialValues,
	loading = false,
	onSubmit,
	onCancel,
}: PoojaServicesFormProps) {
	const [categoryId, setCategoryId] = useState(initialValues?.categoryId || "");
	const [price, setPrice] = useState(initialValues?.price || "");
	const [details, setDetails] = useState(initialValues?.details || "");
	const [status, setStatus] = useState<"Active" | "Inactive">(
		initialValues?.status || "Active"
	);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (initialValues) {
			setCategoryId(initialValues.categoryId);
			setPrice(initialValues.price);
			setDetails(initialValues.details);
			setStatus(initialValues.status);
		}
	}, [initialValues]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!categoryId) return;
		setSubmitting(true);
		await onSubmit({
			id: initialValues?.id,
			categoryId,
			price,
			details,
			status,
		});
		setSubmitting(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="block text-sm font-medium mb-1">
					Pooja Category <span className="text-red-500">*</span>
				</label>
				<Select
					value={categoryId}
					onValueChange={setCategoryId}
					disabled={!!initialValues?.id}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{categories.map((cat) => (
							<SelectItem key={cat.id} value={cat.id}>
								{cat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<label className="block text-sm font-medium mb-1">
					Price (₹) <span className="text-red-500">*</span>
				</label>
				<Input
					type="number"
					value={price}
					onChange={(e) => setPrice(e.target.value)}
					placeholder="Enter price"
					required
					min={0}
				/>
			</div>
			<div>
				<label className="block text-sm font-medium mb-1">Details</label>
				<Textarea
					value={details}
					onChange={(e) => setDetails(e.target.value)}
					placeholder="Describe the service"
					rows={2}
				/>
			</div>
			<div>
				<label className="block text-sm font-medium mb-1">Status</label>
				<Select
					value={status}
					onValueChange={(v) => setStatus(v as "Active" | "Inactive")}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Active">Active</SelectItem>
						<SelectItem value="Inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex gap-2 justify-end">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={submitting || loading}
					>
						<X className="h-4 w-4 mr-1" /> Cancel
					</Button>
				)}
				<Button
					type="submit"
					disabled={submitting || loading || !categoryId || !price}
				>
					{submitting || loading ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : initialValues?.id ? (
						<Save className="h-4 w-4 mr-2" />
					) : (
						<PlusCircle className="h-4 w-4 mr-2" />
					)}
					{initialValues?.id ? "Update Offering" : "Add Offering"}
				</Button>
			</div>
		</form>
	);
}
