"use client";
import React, { useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, MapPin, Edit } from "lucide-react";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

export interface Address {
	type: "home" | "work" | "other";
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	pincode?: string;
	country: string;
	id?: string;
}

export interface KathavachakProfileFormProfile {
	id: string;
	name: string;
	email: string;
	phone: string;
	addresses?: Address[];
	avatarUrl?: string;
}

export interface KathavachakProfileFormProps {
	profile: KathavachakProfileFormProfile | null;
	loading: boolean;
	onSave?: (data: {
		name: string;
		email: string;
		phone: string;
		addresses: Address[];
	}) => Promise<void> | void;
}

import { useEffect } from "react";
import { toast } from "@/lib/toast";

export default function KathavachakProfileForm({
	profile,
	loading,
	onSave,
}: KathavachakProfileFormProps) {
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		addresses: [] as Address[],
		avatarUrl: "",
	});
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	// Fetch profile from API on mount and after save
	useEffect(() => {
		async function fetchProfile() {
			try {
				// Replace with your actual API endpoint
				const res = await fetch(`/api/users/${profile?.id}`);
				if (res.ok) {
					const data = await res.json();
					setForm({
						name: data.name || "",
						email: data.email || "",
						phone: data.phone || "",
						addresses: data.addresses || [],
						avatarUrl: data.avatarUrl || data.profileImageUrl || "",
					});
				}
			} finally {
				// No fetching state to set
			}
		}
		if (profile?.id) fetchProfile();
	}, [profile?.id]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleAddressChange = (index: number, field: string, value: string) => {
		setForm((prev) => {
			const addresses = [...prev.addresses];
			addresses[index] = { ...addresses[index], [field]: value };
			return { ...prev, addresses };
		});
	};

	const handleAddAddress = () => {
		setForm((prev) => ({
			...prev,
			addresses: [
				...prev.addresses,
				{ type: "home", line1: "", city: "", country: "India" },
			],
		}));
	};

	const handleRemoveAddress = (index: number) => {
		setForm((prev) => ({
			...prev,
			addresses: prev.addresses.filter((_, i) => i !== index),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isEditing) {
			setIsEditing(true);
			return;
		}

		setSaving(true);
		try {
			// Replace with your actual API endpoint
			await fetch(`/api/users/${profile?.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			// Optionally, refetch profile to sync with admin
			if (profile?.id) {
				const res = await fetch(`/api/users/${profile.id}`);
				if (res.ok) {
					const data = await res.json();
					setForm({
						name: data.name || "",
						email: data.email || "",
						phone: data.phone || "",
						addresses: data.addresses || [],
						avatarUrl: data.avatarUrl || data.profileImageUrl || "",
					});
				}
			}
			if (onSave) await onSave(form);
			// Show toast on success
			toast.success("Profile updated successfully!");
			setIsEditing(false);
		} finally {
			setSaving(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<Card>
				{/* Profile Image/Avatar and Header */}
				<CardHeader>
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0">
							{form.avatarUrl ? (
								<img
									src={form.avatarUrl}
									alt={form.name}
									className="h-20 w-20 rounded-full border-4 border-white shadow-lg object-cover"
								/>
							) : (
								<div className="h-20 w-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
									{form.name?.[0] ?? "?"}
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>
								Update your personal details and contact information.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								value={form.name}
								onChange={handleChange}
								disabled={loading || saving || !isEditing}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={form.email}
								onChange={handleChange}
								disabled={loading || saving || !isEditing}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								value={form.phone}
								onChange={handleChange}
								disabled={loading || saving || !isEditing}
								required
							/>
						</div>
					</div>

					<div className="space-y-6 border p-4 rounded-lg">
						<div className="flex justify-between items-center">
							<h3 className="text-base font-medium">Addresses</h3>
							{isEditing && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddAddress}
								>
									<Plus className="h-4 w-4 mr-2" /> Add Address
								</Button>
							)}
						</div>

						{!isEditing ? (
							// Collapsed address list view
							<div className="space-y-2">
								{form.addresses.length === 0 ? (
									<div className="text-center py-4 text-muted-foreground">
										No addresses added.
									</div>
								) : (
									<ul className="divide-y">
										{form.addresses.map((address, index) => (
											<li key={index} className="py-2">
												<div className="flex items-start gap-2">
													<MapPin className="h-4 w-4 text-muted-foreground mt-1" />
													<div>
														<div className="font-medium">
															{address.type.charAt(0).toUpperCase() +
																address.type.slice(1)}{" "}
															Address
															{address.type === "other" && address.label
																? ` (${address.label})`
																: ""}
														</div>
														<div className="text-sm text-muted-foreground">
															{address.line1}
															{address.line2 && <>, {address.line2}</>}
															<br />
															{address.city}
															{address.state && <>, {address.state}</>}
															{address.pincode && <>, {address.pincode}</>}
															{address.country && <>, {address.country}</>}
														</div>
													</div>
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						) : (
							// Editable address form view
							<>
								{form.addresses.length === 0 && (
									<div className="text-center py-4 text-muted-foreground">
										No addresses added. Click "Add Address" to add one.
									</div>
								)}
								{form.addresses.map((address, index) => (
									<div
										key={index}
										className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0"
									>
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-muted-foreground" />
												<h4 className="font-medium">
													{address.type.charAt(0).toUpperCase() +
														address.type.slice(1)}{" "}
													Address
													{address.type === "other" && address.label
														? ` (${address.label})`
														: ""}
												</h4>
											</div>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="text-red-500 hover:text-red-700 hover:bg-red-50"
													onClick={() => handleRemoveAddress(index)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor={`address-type-${index}`}>
													Address Type
												</Label>
												<Select
													value={address.type}
													onValueChange={(value) =>
														handleAddressChange(index, "type", value)
													}
													disabled={!isEditing}
												>
													<SelectTrigger id={`address-type-${index}`}>
														<SelectValue placeholder="Select address type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="home">Home</SelectItem>
														<SelectItem value="work">Work</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
											{address.type === "other" && (
												<div className="space-y-2">
													<Label htmlFor={`address-label-${index}`}>
														Label
													</Label>
													<Input
														id={`address-label-${index}`}
														value={address.label || ""}
														onChange={(e) =>
															handleAddressChange(
																index,
																"label",
																e.target.value
															)
														}
														placeholder="e.g., Parent's Home, Office"
														disabled={!isEditing}
													/>
												</div>
											)}
										</div>
										<div className="space-y-2">
											<Label htmlFor={`address-line1-${index}`}>
												Address Line 1
											</Label>
											<Input
												id={`address-line1-${index}`}
												value={address.line1 || ""}
												onChange={(e) =>
													handleAddressChange(index, "line1", e.target.value)
												}
												placeholder="Street address, P.O. box, etc."
												disabled={!isEditing}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`address-line2-${index}`}>
												Address Line 2 (Optional)
											</Label>
											<Input
												id={`address-line2-${index}`}
												value={address.line2 || ""}
												onChange={(e) =>
													handleAddressChange(index, "line2", e.target.value)
												}
												placeholder="Apartment, suite, unit, building, floor, etc."
												disabled={!isEditing}
											/>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor={`address-city-${index}`}>City</Label>
												<Input
													id={`address-city-${index}`}
													value={address.city || ""}
													onChange={(e) =>
														handleAddressChange(index, "city", e.target.value)
													}
													disabled={!isEditing}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`address-state-${index}`}>
													State/Province (Optional)
												</Label>
												<Input
													id={`address-state-${index}`}
													value={address.state || ""}
													onChange={(e) =>
														handleAddressChange(index, "state", e.target.value)
													}
													disabled={!isEditing}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`address-pincode-${index}`}>
													PIN Code (Optional)
												</Label>
												<Input
													id={`address-pincode-${index}`}
													value={address.pincode || ""}
													onChange={(e) =>
														handleAddressChange(
															index,
															"pincode",
															e.target.value
														)
													}
													disabled={!isEditing}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`address-country-${index}`}>
												Country
											</Label>
											<Input
												id={`address-country-${index}`}
												value={address.country || ""}
												onChange={(e) =>
													handleAddressChange(index, "country", e.target.value)
												}
												disabled={!isEditing}
												required
											/>
										</div>
									</div>
								))}
							</>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					{isEditing && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsEditing(false)}
							disabled={saving}
						>
							Cancel
						</Button>
					)}
					<Button type="submit" disabled={loading || saving}>
						{saving ? (
							<>
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Saving...
							</>
						) : isEditing ? (
							<>
								<Save className="h-4 w-4 mr-2" /> Save Changes
							</>
						) : (
							<>
								<Edit className="h-4 w-4 mr-2" /> Edit Profile
							</>
						)}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
