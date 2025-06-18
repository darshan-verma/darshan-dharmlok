"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Coupon } from "./CouponTable";

interface CouponFormProps {
	initialData?: Partial<Coupon>;
	onSubmit: (couponData: Omit<Coupon, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function CouponForm({
	initialData = {
		name: "",
		date: "",
		discount: 0,
		userLimit: 1,
		timeUsed: 0,
		validity: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: CouponFormProps) {
	const [couponData, setCouponData] = useState<Omit<Coupon, "id">>({
		name: initialData.name || "",
		date: initialData.date || "",
		discount: initialData.discount ?? 0,
		userLimit: initialData.userLimit ?? 1,
		timeUsed: initialData.timeUsed ?? 0,
		validity: initialData.validity || "",
		status: initialData.status || "Active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof couponData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Coupon name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (
			data.discount === undefined ||
			isNaN(Number(data.discount)) ||
			Number(data.discount) < 0
		)
			errors.discount = "Discount is required and must be >= 0";
		if (
			data.userLimit === undefined ||
			isNaN(Number(data.userLimit)) ||
			Number(data.userLimit) < 1
		)
			errors.userLimit = "User limit is required and must be >= 1";
		if (!data.validity?.trim()) errors.validity = "Validity date is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(couponData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(couponData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof couponData,
		value: string | number
	) => {
		setCouponData({ ...couponData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Coupon Name *</Label>
				<Input
					id="name"
					value={couponData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter coupon name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={couponData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="discount">Discount (%) *</Label>
				<Input
					id="discount"
					type="number"
					min={0}
					step="any"
					value={couponData.discount}
					onChange={(e) =>
						handleInputChange("discount", Number(e.target.value))
					}
					placeholder="Enter discount percentage"
					className={formErrors.discount ? "border-red-500" : ""}
				/>
				{formErrors.discount && (
					<p className="text-sm text-red-500">{formErrors.discount}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="userLimit">User Limit *</Label>
				<Input
					id="userLimit"
					type="number"
					min={1}
					step={1}
					value={couponData.userLimit}
					onChange={(e) =>
						handleInputChange("userLimit", Number(e.target.value))
					}
					placeholder="Enter user limit"
					className={formErrors.userLimit ? "border-red-500" : ""}
				/>
				{formErrors.userLimit && (
					<p className="text-sm text-red-500">{formErrors.userLimit}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="timeUsed">Time Used</Label>
				<Input
					id="timeUsed"
					type="number"
					min={0}
					step={1}
					value={couponData.timeUsed}
					onChange={(e) =>
						handleInputChange("timeUsed", Number(e.target.value))
					}
					placeholder="How many times used (auto or manual)"
					disabled
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="validity">Validity *</Label>
				<Input
					id="validity"
					type="date"
					value={couponData.validity}
					onChange={(e) => handleInputChange("validity", e.target.value)}
					className={formErrors.validity ? "border-red-500" : ""}
				/>
				{formErrors.validity && (
					<p className="text-sm text-red-500">{formErrors.validity}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={couponData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger
						id="status"
						className={formErrors.status ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Active">Active</SelectItem>
						<SelectItem value="Inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
				{formErrors.status && (
					<p className="text-sm text-red-500">{formErrors.status}</p>
				)}
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Coupon"}
				</Button>
			</div>
		</div>
	);
}
