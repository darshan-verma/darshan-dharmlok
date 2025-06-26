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
import { Dharmguru, FormErrors } from "./types";
import { getCategoryColor, getRankColor } from "./DharmguruTable";

interface DetailsTabProps {
	dharmguru: Dharmguru | null;
	editedDharmguru: Partial<Dharmguru> | null;
	setEditedDharmguru: React.Dispatch<
		React.SetStateAction<Partial<Dharmguru> | null>
	>;
	isEditing: boolean;
	isSaving: boolean;
	errors: FormErrors;
	setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
	handleSaveChanges: () => Promise<void>;
	formatDate: (dateString: string | Date) => string;
	formatPhoneNumber: (value: string) => string;
	setAddressesToDelete: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function DetailsTab({
	dharmguru,
	editedDharmguru,
	setEditedDharmguru,
	isEditing,
	isSaving,
	errors,
	setErrors,
	handleSaveChanges,
	formatDate,
	formatPhoneNumber,
	setAddressesToDelete,
}: DetailsTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Personal Information</CardTitle>
				<CardDescription>
					Update Dharmguru&apos;s personal details and contact information.
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
									value={editedDharmguru?.name || ""}
									onChange={(e) =>
										setEditedDharmguru({
											...editedDharmguru,
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
									value={editedDharmguru?.email || ""}
									onChange={(e) =>
										setEditedDharmguru({
											...editedDharmguru,
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
										value={editedDharmguru?.phone || ""}
										onChange={(e) => {
											const formatted = formatPhoneNumber(e.target.value);
											setEditedDharmguru({
												...editedDharmguru,
												phone: formatted,
											});
											if (errors.phone) {
												setErrors({
													...errors,
													phone: undefined,
												});
											}
										}}
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
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
							<div className="space-y-2">
								<Label>Category</Label>
								<span
									className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
										dharmguru?.category || ""
									)} w-20`}
								>
									{dharmguru?.category || "Not specified"}
								</span>
							</div>
							<div className="space-y-2">
								<Label>Rank</Label>
								<span
									className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
										dharmguru?.rank || ""
									)} w-20`}
								>
									{dharmguru?.rank || "Not specified"}
								</span>
							</div>
						</div>
						{dharmguru?.addresses && (
							<div className="space-y-6 border p-4 rounded-lg">
								<div className="flex justify-between items-center">
									<h3 className="text-base font-medium">Addresses</h3>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setEditedDharmguru((prev) => {
												if (!prev) return prev;
												return {
													...prev,
													addresses: [
														...(prev.addresses || []),
														{
															type: "home",
															line1: "",
															city: "",
															country: "India",
														},
													],
												};
											});
										}}
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Address
									</Button>
								</div>

								{editedDharmguru?.addresses?.map((address, index) => (
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
												onClick={() => {
													setEditedDharmguru((prev) => {
														if (!prev) return prev;
														const addr = prev.addresses?.[index];
														if (addr?.id) {
															setAddressesToDelete((prevDel) => [
																...prevDel,
																addr.id!,
															]);
														}
														return {
															...prev,
															addresses:
																prev.addresses?.filter(
																	(_, addrIndex) => addrIndex !== index
																) || [],
														};
													});
												}}
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
													onValueChange={(value) => {
														setEditedDharmguru((prev) => {
															if (!prev) return prev;
															return {
																...prev,
																addresses: prev.addresses?.map(
																	(addr, addrIndex) =>
																		addrIndex === index
																			? {
																					...addr,
																					type: value as
																						| "home"
																						| "work"
																						| "other",
																					// Clear label if not "other" type
																					label:
																						value === "other"
																							? addr.label
																							: undefined,
																			  }
																			: addr
																),
															};
														});
													}}
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
														onChange={(e) => {
															setEditedDharmguru((prev) => {
																if (!prev) return prev;
																return {
																	...prev,
																	addresses: prev.addresses?.map(
																		(addr, addrIndex) =>
																			addrIndex === index
																				? {
																						...addr,
																						label: e.target.value,
																				  }
																				: addr
																	),
																};
															});
														}}
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
												onChange={(e) => {
													setEditedDharmguru((prev) => {
														if (!prev) return prev;
														return {
															...prev,
															addresses: prev.addresses?.map(
																(addr, addrIndex) =>
																	addrIndex === index
																		? {
																				...addr,
																				line1: e.target.value,
																		  }
																		: addr
															),
														};
													});
												}}
												placeholder="Street address, P.O. box, etc."
												className={
													errors.addresses?.[index]?.line1
														? "border-red-500"
														: ""
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
												onChange={(e) => {
													setEditedDharmguru((prev) => {
														if (!prev) return prev;
														return {
															...prev,
															addresses: prev.addresses?.map(
																(addr, addrIndex) =>
																	addrIndex === index
																		? {
																				...addr,
																				line2: e.target.value,
																		  }
																		: addr
															),
														};
													});
												}}
												placeholder="Apartment, suite, unit, building, floor, etc."
											/>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor={`address-city-${index}`}>City</Label>
												<Input
													id={`address-city-${index}`}
													value={address.city || ""}
													onChange={(e) => {
														setEditedDharmguru((prev) => {
															if (!prev) return prev;
															return {
																...prev,
																addresses: prev.addresses?.map(
																	(addr, addrIndex) =>
																		addrIndex === index
																			? {
																					...addr,
																					city: e.target.value,
																			  }
																			: addr
																),
															};
														});
													}}
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
													onChange={(e) => {
														setEditedDharmguru((prev) => {
															if (!prev) return prev;
															return {
																...prev,
																addresses: prev.addresses?.map(
																	(addr, addrIndex) =>
																		addrIndex === index
																			? {
																					...addr,
																					state: e.target.value,
																			  }
																			: addr
																),
															};
														});
													}}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor={`address-pincode-${index}`}>
													PIN Code (Optional)
												</Label>
												<Input
													id={`address-pincode-${index}`}
													value={address.pincode || ""}
													onChange={(e) => {
														setEditedDharmguru((prev) => {
															if (!prev) return prev;
															return {
																...prev,
																addresses: prev.addresses?.map(
																	(addr, addrIndex) =>
																		addrIndex === index
																			? {
																					...addr,
																					pincode: e.target.value,
																			  }
																			: addr
																),
															};
														});
													}}
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
												onChange={(e) => {
													setEditedDharmguru((prev) => {
														if (!prev) return prev;
														return {
															...prev,
															addresses: prev.addresses?.map(
																(addr, addrIndex) =>
																	addrIndex === index
																		? {
																				...addr,
																				country: e.target.value,
																		  }
																		: addr
															),
														};
													});
												}}
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

								{editedDharmguru?.addresses?.length === 0 && (
									<div className="text-center py-4 text-muted-foreground">
										No addresses added. Click &ldquo;Add Address&rdquo; to add
										one.
									</div>
								)}
							</div>
						)}
					</>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Full Name
								</h3>
								<p className="font-medium text-foreground">{dharmguru?.name}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Email
								</h3>
								<p className="font-medium text-foreground">
									{dharmguru?.email}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Phone
								</h3>
								<p className="font-medium text-foreground">
									{dharmguru?.phone}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Member Since
								</h3>
								<p className="font-medium text-foreground">
									{dharmguru?.createdAt
										? formatDate(dharmguru.createdAt)
										: "N/A"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Last Login
								</h3>
								<p className="font-medium text-foreground">
									{dharmguru?.lastLoginAt
										? formatDate(dharmguru.lastLoginAt)
										: "Never"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Last Logout
								</h3>
								<p className="font-medium text-foreground">
									{dharmguru?.lastLogoutAt
										? formatDate(dharmguru.lastLogoutAt)
										: "N/A"}
								</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Dharmguru Type
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
										{dharmguru?.KathavachakType || "Not specified"}
									</span>
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Status
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{dharmguru?.status || "Not specified"}
									</span>
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Category
								</h3>
								<span
									className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
										dharmguru?.category || ""
									)} w-20`}
								>
									{dharmguru?.category || "Not specified"}
								</span>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Rank
								</h3>
								<span
									className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
										dharmguru?.rank || ""
									)} w-20`}
								>
									{dharmguru?.rank || "Not specified"}
								</span>
							</div>
						</div>

						{dharmguru?.addresses && dharmguru.addresses.length > 0 && (
							<div className="space-y-4 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Addresses
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{dharmguru.addresses.map((address, index) => (
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
