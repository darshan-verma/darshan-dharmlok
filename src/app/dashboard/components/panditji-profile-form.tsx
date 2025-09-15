"use client";
import React, { useState, useEffect } from "react";
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
import { toast } from "@/lib/toast";
import Image from "next/image";

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

// Interface for the panditji API response
interface PanditjiApiResponse {
	id: string;
	name: string;
	email: string;
	phone: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	bio?: string;
	category?: string;
	rank?: string;
	status: string;
	kycApproved?: number;
	addresses?: Address[];
}

// Interface for API error responses
interface ApiErrorResponse {
	error?: string;
	message?: string;
	details?: string | Record<string, unknown>;
}

export interface PanditjiProfileFormProfile {
	id: string;
	name: string;
	email: string;
	phone: string;
	addresses?: Address[];
	profileImageUrl?: string;
	bannerImageUrl?: string;
}

export interface PanditjiProfileFormProps {
	profile: PanditjiProfileFormProfile | null;
	loading: boolean;
	onSave?: (data: {
		name: string;
		email: string;
		phone: string;
		addresses: Address[];
		profileImageUrl: string;
		bannerImageUrl?: string;
	}) => Promise<void> | void;
}

export default function PanditjiProfileForm({
	profile,
	loading,
	onSave,
}: PanditjiProfileFormProps) {
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		addresses: [] as Address[],
		profileImageUrl: "",
		bannerImageUrl: "",
	});
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	useEffect(() => {
		async function fetchProfile() {
			try {
				// Use the new panditji-specific API endpoint for optimized queries
				const res = await fetch(`/api/users/panditji/${profile?.id}`);
				if (res.ok) {
					const data: PanditjiApiResponse = await res.json();
					setForm({
						name: data.name || "",
						email: data.email || "",
						phone: data.phone || "",
						addresses: data.addresses || [],
						profileImageUrl: data.profileImageUrl || "",
						bannerImageUrl: data.bannerImageUrl || "",
					});
				} else {
					const errorData: ApiErrorResponse = await res.json();
					console.error(
						"Failed to fetch profile:",
						errorData.error || res.status
					);
					toast.error(errorData.error || "Failed to load profile");
				}
			} catch (error) {
				console.error("Error fetching profile:", error);
				toast.error("Failed to load profile");
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
			// Always send profileImageUrl and bannerImageUrl but make it null if empty
			const formToSend = {
				...form,
				profileImageUrl: form.profileImageUrl || null,
				bannerImageUrl: form.bannerImageUrl || null,
			};

			// Use the new panditji-specific API endpoint for updates
			const response = await fetch(`/api/users/panditji/${profile?.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formToSend),
			});

			if (!response.ok) {
				const errorData: ApiErrorResponse = await response.json();
				throw new Error(
					errorData.error || `Failed to update profile: ${response.status}`
				);
			}

			if (profile?.id) {
				// Fetch updated profile using the new panditji-specific endpoint
				const res = await fetch(`/api/users/panditji/${profile.id}`);
				if (res.ok) {
					const data: PanditjiApiResponse = await res.json();
					const updatedForm = {
						name: data.name || "",
						email: data.email || "",
						phone: data.phone || "",
						addresses: data.addresses || [],
						// Preserve current profileImageUrl if backend doesn't return one
						profileImageUrl: data.profileImageUrl || form.profileImageUrl || "",
						bannerImageUrl: data.bannerImageUrl || form.bannerImageUrl || "",
					};
					setForm(updatedForm);
					// Call onSave with the updated data
					if (onSave) await onSave(updatedForm);
				} else {
					const errorData: ApiErrorResponse = await res.json();
					console.error(
						"Failed to fetch updated profile:",
						errorData.error || res.status
					);
				}
			} else {
				// If no profile ID, still call onSave with current form
				if (onSave) await onSave(form);
			}
			toast.success("Profile updated successfully!");
			setIsEditing(false);
		} finally {
			setSaving(false);
		}
	};

	// Handle profile image upload
	async function uploadProfileImage(file: File): Promise<string> {
		const formData = new FormData();
		formData.append("file", file);

		const res = await fetch("/api/upload/profile-image", {
			method: "POST",
			body: formData,
		});

		if (!res.ok) {
			const errorText = await res.text();
			toast.error("Failed to upload image.");
			throw new Error(`Upload failed: ${res.status} ${errorText}`);
		}

		const data = await res.json();

		// Check for both 'url' and 'imageUrl' fields (backend returns 'imageUrl')
		const uploadedUrl = data.url || data.imageUrl;
		if (!uploadedUrl) {
			toast.error("Upload successful but no URL returned.");
			throw new Error("No URL returned from upload");
		}

		return uploadedUrl;
	}

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Show loading toast and get the toast ID
		const toastId = toast.loading("Uploading image...");

		try {
			// Upload and get URL
			const uploadedUrl = await uploadProfileImage(file);
			setForm((prev) => {
				const newForm = { ...prev, profileImageUrl: uploadedUrl };
				return newForm;
			});

			// Dismiss loading toast and show success
			toast.dismiss(toastId);
			toast.success("Profile image uploaded successfully!");
		} catch (error) {
			console.error("Image upload failed:", error);

			// Dismiss loading toast and show error
			toast.dismiss(toastId);
			toast.error("Failed to upload image. Please try again.");
		}
	};

	// Banner image upload handler
	const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const toastId = toast.loading("Uploading banner image...");
		try {
			const uploadedUrl = await uploadProfileImage(file);
			setForm((prev) => ({ ...prev, bannerImageUrl: uploadedUrl }));
			toast.dismiss(toastId);
			toast.success("Banner image uploaded successfully!");
		} catch (error) {
			console.error("Banner image upload failed:", error);
			toast.dismiss(toastId);
			toast.error("Failed to upload banner image. Please try again.");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4">
						{/* Banner Image */}
						<div className="relative group w-full h-40 mb-2">
							{form.bannerImageUrl ? (
								<Image
									src={form.bannerImageUrl}
									alt="Banner Image"
									fill
									className="object-cover rounded-lg border shadow"
								/>
							) : (
								<div className="w-full h-40 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg flex items-center justify-center text-gray-400 text-lg font-semibold border">
									No banner image
								</div>
							)}
							{isEditing && (
								<label
									className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer border border-gray-200 group-hover:opacity-100 opacity-90 transition-opacity"
									title="Change banner image"
								>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleBannerChange}
									/>
									<Edit className="h-5 w-5 text-blue-600" />
								</label>
							)}
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0 relative group">
							{form.profileImageUrl ? (
								<>
									<Image
										src={form.profileImageUrl}
										alt={form.name}
										width={80}
										height={80}
										className="h-20 w-20 rounded-full border-4 border-white shadow-lg object-cover"
									/>
								</>
							) : (
								<div className="h-20 w-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
									{form.name?.[0] ?? "?"}
								</div>
							)}
							{/* Edit button overlay */}
							{isEditing && (
								<label
									className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer border border-gray-200 group-hover:opacity-100 opacity-90 transition-opacity"
									title="Change profile image"
								>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleAvatarChange}
									/>
									<Edit className="h-5 w-5 text-blue-600" />
								</label>
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
							<>
								{form.addresses.length === 0 && (
									<div className="text-center py-4 text-muted-foreground">
										No addresses added. Click &quot;Add Address&quot; to add
										one.
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
