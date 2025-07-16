"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Save, Plus, Trash2, MapPin } from "lucide-react";
import { Seller, FormErrors, Address } from "./types";
import { Dispatch, SetStateAction } from "react";

interface DetailsTabProps {
	isEditing: boolean;
	editedSeller: Partial<Seller> | null;
	errors: FormErrors;
	setEditedSeller: Dispatch<SetStateAction<Partial<Seller> | null>>;
	setAddressesToDelete: Dispatch<SetStateAction<string[]>>;
	handleSaveChanges: () => void;
	isSaving: boolean;
}

export default function DetailsTab({
	isEditing,
	editedSeller,
	errors,
	setEditedSeller,
	setAddressesToDelete,
	handleSaveChanges,
	isSaving,
}: DetailsTabProps) {
	const handleAddressChange = (
		index: number,
		field: keyof Address,
		value: string
	) => {
		setEditedSeller((prev) => {
			if (!prev || !prev.addresses) return prev;
			const newAddresses = [...prev.addresses];
			newAddresses[index] = { ...newAddresses[index], [field]: value };
			return { ...prev, addresses: newAddresses };
		});
	};

	const addNewAddress = () => {
		setEditedSeller((prev) => {
			if (!prev) return prev;
			const newAddress: Address = {
				type: "home",
				line1: "",
				city: "",
				country: "India",
			};
			return { ...prev, addresses: [...(prev.addresses || []), newAddress] };
		});
	};

	const removeAddress = (index: number) => {
		setEditedSeller((prev) => {
			if (!prev || !prev.addresses) return prev;
			const addressToRemove = prev.addresses[index];
			if (addressToRemove.id) {
				setAddressesToDelete((current) => [...current, addressToRemove.id!]);
			}
			const newAddresses = prev.addresses.filter((_, i) => i !== index);
			return { ...prev, addresses: newAddresses };
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Personal Information</CardTitle>
				<CardDescription>
					Update seller&apos;s personal details and contact information.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{isEditing ? (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									value={editedSeller?.name || ""}
									onChange={(e) =>
										setEditedSeller({
											...editedSeller,
											name: e.target.value,
										})
									}
									className={errors.name ? "border-red-500" : ""}
								/>
								{errors.name && (
									<p className="text-sm text-red-500">{errors.name}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={editedSeller?.email || ""}
									onChange={(e) =>
										setEditedSeller({
											...editedSeller,
											email: e.target.value,
										})
									}
									className={errors.email ? "border-red-500" : ""}
								/>
								{errors.email && (
									<p className="text-sm text-red-500">{errors.email}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<div className="relative">
									<Input
										id="phone"
										type="tel"
										value={editedSeller?.phone || ""}
										onChange={(e) =>
											setEditedSeller({
												...editedSeller,
												phone: e.target.value,
											})
										}
										placeholder="+91 9876543210"
										className={`pl-12 ${errors.phone ? "border-red-500" : ""}`}
									/>
									<span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
										+91
									</span>
								</div>
								{errors.phone && (
									<p className="text-sm text-red-500">{errors.phone}</p>
								)}
							</div>
						</div>

						<div className="space-y-6 border p-4 rounded-lg">
							<div className="flex justify-between items-center">
								<h3 className="text-base font-medium">Addresses</h3>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addNewAddress}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Address
								</Button>
							</div>

							{editedSeller?.addresses?.map((address, index) => (
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
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="text-red-500 hover:text-red-700 hover:bg-red-50"
											onClick={() => removeAddress(index)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor={`address-type-${index}`}>
												Address Type
											</Label>
											<Select
												value={address.type}
												onValueChange={(value) =>
													handleAddressChange(
														index,
														"type",
														value as "home" | "work" | "other"
													)
												}
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
												<Label htmlFor={`address-label-${index}`}>Label</Label>
												<Input
													id={`address-label-${index}`}
													value={address.label || ""}
													onChange={(e) =>
														handleAddressChange(index, "label", e.target.value)
													}
													placeholder="e.g., Parent's Home, Office"
													className={
														errors.addresses?.[index]?.label
															? "border-red-500"
															: ""
													}
												/>
												{errors.addresses?.[index]?.label && (
													<p className="text-sm text-red-500">
														{errors.addresses[index].label}
													</p>
												)}
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
											className={
												errors.addresses?.[index]?.line1 ? "border-red-500" : ""
											}
										/>
										{errors.addresses?.[index]?.line1 && (
											<p className="text-sm text-red-500">
												{errors.addresses[index].line1}
											</p>
										)}
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
												className={
													errors.addresses?.[index]?.city
														? "border-red-500"
														: ""
												}
											/>
											{errors.addresses?.[index]?.city && (
												<p className="text-sm text-red-500">
													{errors.addresses[index].city}
												</p>
											)}
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
													handleAddressChange(index, "pincode", e.target.value)
												}
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`address-country-${index}`}>Country</Label>
										<Input
											id={`address-country-${index}`}
											value={address.country || ""}
											onChange={(e) =>
												handleAddressChange(index, "country", e.target.value)
											}
											className={
												errors.addresses?.[index]?.country
													? "border-red-500"
													: ""
											}
										/>
										{errors.addresses?.[index]?.country && (
											<p className="text-sm text-red-500">
												{errors.addresses[index].country}
											</p>
										)}
									</div>
								</div>
							))}

							{editedSeller?.addresses?.length === 0 && (
								<div className="text-center py-4 text-muted-foreground">
									No addresses added. Click &ldquo;Add Address&rdquo; to add
									one.
								</div>
							)}
						</div>
					</>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Full Name
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.name}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Email
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.email}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Phone
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.phone}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Member Since
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.createdAt
										? new Date(editedSeller.createdAt).toLocaleDateString()
										: "N/A"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Last Login
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.lastLoginAt
										? new Date(editedSeller.lastLoginAt).toLocaleString()
										: "Never"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Last Logout
								</h3>
								<p className="font-medium text-foreground">
									{editedSeller?.lastLogoutAt
										? new Date(editedSeller.lastLogoutAt).toLocaleString()
										: "N/A"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Seller Type
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
										{editedSeller?.SellerType || "Not specified"}
									</span>
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Status
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{editedSeller?.status || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{editedSeller?.addresses && editedSeller.addresses.length > 0 && (
							<div className="space-y-4 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Addresses
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{editedSeller.addresses.map((address, index) => (
										<Card key={index} className="border-border">
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<MapPin className="h-4 w-4 text-muted-foreground" />
													<CardTitle className="text-base">
														{address.type.charAt(0).toUpperCase() +
															address.type.slice(1)}
														{address.type === "other" && address.label
															? ` (${address.label})`
															: ""}
													</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="text-sm space-y-1">
												<p className="font-medium">
													{address.line1}
													{address.line2 && `, ${address.line2}`}
												</p>
												<p>
													{address.city}
													{address.state && `, ${address.state}`}
													{address.pincode && ` - ${address.pincode}`}
												</p>
												<p>{address.country}</p>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
			{isEditing && (
				<CardFooter>
					<Button onClick={handleSaveChanges} disabled={isSaving}>
						{isSaving ? (
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
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</>
						)}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
