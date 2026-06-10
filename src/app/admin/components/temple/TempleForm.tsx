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
import { Temple } from "./TempleTable";
import LocaleTabs from "@/components/admin/LocaleTabs";
import type { ContentLang } from "@/lib/content-lang";
import { finalizeTranslationsPayload } from "@/lib/admin-locale-sync";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

interface TempleFormProps {
	initialData?: Partial<Temple>;
	onSubmit: (templeData: Omit<Temple, "id"> & { translations?: unknown }) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function TempleForm({
	initialData = {
		name: "",
		date: "",
		state: "",
		city: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: TempleFormProps) {
	const [contentLocale, setContentLocale] = useState<ContentLang>("en");
	const [enName, setEnName] = useState(initialData.name || "");
	const [hiName, setHiName] = useState("");
	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
	});

	const [shared, setShared] = useState({
		date: initialData.date || "",
		state: initialData.state || "",
		city: initialData.city || "",
		status: initialData.status || "Active",
		religiousCategories: initialReligious,
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const errors: Record<string, string> = {};
		if (!enName.trim()) errors.name = "English name is required";
		if (!shared.date?.trim()) errors.date = "Date is required";
		if (!shared.state?.trim()) errors.state = "State is required";
		if (!shared.city?.trim()) errors.city = "City is required";
		if (!shared.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm();
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			const record = {
				name: contentLocale === "en" ? enName : hiName,
				...shared,
				translations: {
					en: { name: enName },
					hi: hiName.trim() ? { name: hiName } : null,
				},
			};
			const translations = finalizeTranslationsPayload(record, "temple", contentLocale);
			await onSubmit({
				...shared,
				name: enName,
				translations,
			} as Omit<Temple, "id"> & { translations?: unknown });
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<LocaleTabs
				activeLocale={contentLocale}
				onLocaleChange={setContentLocale}
				translationStatus={
					hiName.trim() ? (enName.trim() ? "complete" : "partial") : "none"
				}
			/>
			<div className="space-y-2">
				<Label htmlFor="name">
					Temple Name * ({contentLocale === "en" ? "English" : "हिंदी"})
				</Label>
				<Input
					id="name"
					value={contentLocale === "en" ? enName : hiName}
					onChange={(e) =>
						contentLocale === "en"
							? setEnName(e.target.value)
							: setHiName(e.target.value)
					}
					placeholder="Enter temple name"
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
					value={shared.date}
					onChange={(e) => setShared({ ...shared, date: e.target.value })}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="state">State *</Label>
				<Input
					id="state"
					value={shared.state}
					onChange={(e) => setShared({ ...shared, state: e.target.value })}
					className={formErrors.state ? "border-red-500" : ""}
				/>
				{formErrors.state && (
					<p className="text-sm text-red-500">{formErrors.state}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="city">City *</Label>
				<Input
					id="city"
					value={shared.city}
					onChange={(e) => setShared({ ...shared, city: e.target.value })}
					className={formErrors.city ? "border-red-500" : ""}
				/>
				{formErrors.city && (
					<p className="text-sm text-red-500">{formErrors.city}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={shared.status}
					onValueChange={(value) => setShared({ ...shared, status: value })}
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
			<ReligiousCategoryPills
				value={shared.religiousCategories || []}
				onChange={(value: ReligiousCategory[]) =>
					setShared({ ...shared, religiousCategories: value })
				}
			/>
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Temple"}
				</Button>
			</div>
		</div>
	);
}
