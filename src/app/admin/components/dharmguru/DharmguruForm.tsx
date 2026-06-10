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
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	buildDualWriteReligiousFields,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";
import { Dharmguru, DharmguruRanks } from "./DharmguruTable";

interface DharmguruFormProps {
	initialData?: Partial<Dharmguru>;
	onSubmit: (dharmguruData: Omit<Dharmguru, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function DharmguruForm({
	initialData = {
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: DharmguruFormProps) {
	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
		category: initialData.category,
	});

	const [dharmguruData, setDharmguruData] = useState<Omit<Dharmguru, "id">>({
		name: initialData.name || "",
		category: initialData.category || initialReligious[0] || "",
		religiousCategories: initialReligious,
		phone: initialData.phone || "",
		email: initialData.email || "",
		status: initialData.status || "Active",
		rank: initialData.rank || "",
		isApproved:
			initialData.isApproved !== undefined ? initialData.isApproved : false,
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [buttonLoading, setButtonLoading] = useState(false);

	const validateForm = (data: typeof dharmguruData) => {
		const errors: Record<string, string> = {};

		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		if (!data.religiousCategories || data.religiousCategories.length === 0) {
			errors.religiousCategories = "Select at least one religious category";
		}

		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		if (!data.phone) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit Indian phone number";
		}

		if (!data.rank) {
			errors.rank = "Rank is required";
		}

		return errors;
	};

	const handleSubmit = async () => {
		if (buttonLoading) return;
		setButtonLoading(true);
		const errors = validateForm(dharmguruData);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) {
			setButtonLoading(false);
			return;
		}

		try {
			const { religiousCategories, category } = buildDualWriteReligiousFields({
				religiousCategories: dharmguruData.religiousCategories,
			});
			await onSubmit({
				...dharmguruData,
				religiousCategories,
				category: category || "",
			});
		} catch (error) {
			console.error("Error in form submission:", error);
		} finally {
			setButtonLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof typeof dharmguruData,
		value: string | boolean | ReligiousCategory[]
	) => {
		setDharmguruData({ ...dharmguruData, [field]: value });
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	const handleReligiousChange = (value: ReligiousCategory[]) => {
		const { religiousCategories, category } = buildDualWriteReligiousFields({
			religiousCategories: value,
		});
		setDharmguruData({
			...dharmguruData,
			religiousCategories,
			category: category || "",
		});
		if (formErrors.religiousCategories) {
			setFormErrors({ ...formErrors, religiousCategories: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Full Name *</Label>
				<Input
					id="name"
					value={dharmguruData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter full name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">Email *</Label>
				<Input
					id="email"
					type="email"
					value={dharmguruData.email}
					onChange={(e) => handleInputChange("email", e.target.value)}
					placeholder="Enter email address"
					className={formErrors.email ? "border-red-500" : ""}
				/>
				{formErrors.email && (
					<p className="text-sm text-red-500">{formErrors.email}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="phone">Phone Number *</Label>
				<Input
					id="phone"
					type="tel"
					value={dharmguruData.phone}
					onChange={(e) => handleInputChange("phone", e.target.value)}
					placeholder="Enter phone number"
					className={formErrors.phone ? "border-red-500" : ""}
				/>
				{formErrors.phone && (
					<p className="text-sm text-red-500">{formErrors.phone}</p>
				)}
			</div>

			<ReligiousCategoryPills
				value={dharmguruData.religiousCategories || []}
				onChange={handleReligiousChange}
				allowEmpty={false}
			/>
			{formErrors.religiousCategories && (
				<p className="text-sm text-red-500">{formErrors.religiousCategories}</p>
			)}

			<div className="space-y-2">
				<Label htmlFor="rank">Rank *</Label>
				<Select
					value={dharmguruData.rank}
					onValueChange={(value) => handleInputChange("rank", value)}
				>
					<SelectTrigger
						id="rank"
						className={formErrors.rank ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select rank" />
					</SelectTrigger>
					<SelectContent>
						{DharmguruRanks.map((rank) => (
							<SelectItem key={rank} value={rank}>
								{rank}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.rank && (
					<p className="text-sm text-red-500">{formErrors.rank}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={dharmguruData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Active">Active</SelectItem>
						<SelectItem value="Inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center space-x-2 py-2">
				<input
					type="checkbox"
					id="isApproved"
					checked={dharmguruData.isApproved}
					onChange={(e) => handleInputChange("isApproved", e.target.checked)}
					className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<Label
					htmlFor="isApproved"
					className="text-sm font-medium text-gray-700"
				>
					Approved
				</Label>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={isLoading || buttonLoading}
				>
					{isLoading || buttonLoading ? "Saving..." : "Save Dharmguru"}
				</Button>
			</div>
		</div>
	);
}
