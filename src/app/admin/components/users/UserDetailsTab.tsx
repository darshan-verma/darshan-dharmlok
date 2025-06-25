"use client";

import { Save, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function UserDetailsTab({
	isEditing,
	editedUser,
	setEditedUser,
	errors,
	setErrors,
	handleSaveChanges,
	isSaving,
	formatPhoneNumber,
	setAddressesToDelete,
	user,
}: any) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Personal Information</CardTitle>
				<CardDescription>
					Update user&apos;s personal details and contact information.
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
									value={editedUser?.name || ""}
									onChange={(e) =>
										setEditedUser({
											...editedUser,
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
									value={editedUser?.email || ""}
									onChange={(e) =>
										setEditedUser({
											...editedUser,
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
										value={editedUser?.phone || ""}
										onChange={(e) => {
											const formatted = formatPhoneNumber(e.target.value);
											setEditedUser({
												...editedUser,
												phone: formatted,
											});
											if (errors.phone) {
												setErrors((prev: any) => ({
													...prev,
													phone: undefined,
												}));
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
						{editedUser?.addresses && (
							<div className="space-y-6 border p-4 rounded-lg">
								<div className="flex justify-between items-center">
									<h3 className="text-base font-medium">Addresses</h3>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setEditedUser((prev: any) => ({
												...prev,
												addresses: [
													...(prev?.addresses || []),
													{
														type: "home",
														line1: "",
														city: "",
														country: "India",
													},
												],
											}));
										}}
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Address
									</Button>
								</div>

								{editedUser.addresses.map((address: any, index: number) => (
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
													const addr = editedUser.addresses?.[index];
													if (addr?.id) {
														setAddressesToDelete((prevDel: any) => [
															...prevDel,
															addr.id!,
														]);
													}
													setEditedUser((prev: any) => ({
														...prev,
														addresses:
															prev?.addresses?.filter(
																(_: any, addrIndex: number) =>
																	addrIndex !== index
															) || [],
													}));
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
														setEditedUser((prev: any) => ({
															...prev,
															addresses: prev?.addresses?.map(
																(addr: any, addrIndex: number) =>
																	addrIndex === index
																		? {
																				...addr,
																				type: value as
																					| "home"
																					| "work"
																					| "other",
																				label:
																					value === "other"
																						? addr.label
																						: undefined,
																		  }
																		: addr
															),
														}));
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
															setEditedUser((prev: any) => ({
																...prev,
																addresses: prev?.addresses?.map(
																	(addr: any, addrIndex: number) =>
																		addrIndex === index
																			? {
																					...addr,
																					label: e.target.value,
																			  }
																			: addr
																),
															}));
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
													setEditedUser((prev: any) => ({
														...prev,
														addresses: prev?.addresses?.map(
															(addr: any, addrIndex: number) =>
																addrIndex === index
																	? { ...addr, line1: e.target.value }
																	: addr
														),
													}));
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
													setEditedUser((prev: any) => ({
														...prev,
														addresses: prev?.addresses?.map(
															(addr: any, addrIndex: number) =>
																addrIndex === index
																	? { ...addr, line2: e.target.value }
																	: addr
														),
													}));
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
														setEditedUser((prev: any) => ({
															...prev,
															addresses: prev?.addresses?.map(
																(addr: any, addrIndex: number) =>
																	addrIndex === index
																		? { ...addr, city: e.target.value }
																		: addr
															),
														}));
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
														setEditedUser((prev: any) => ({
															...prev,
															addresses: prev?.addresses?.map(
																(addr: any, addrIndex: number) =>
																	addrIndex === index
																		? { ...addr, state: e.target.value }
																		: addr
															),
														}));
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
														setEditedUser((prev: any) => ({
															...prev,
															addresses: prev?.addresses?.map(
																(addr: any, addrIndex: number) =>
																	addrIndex === index
																		? {
																				...addr,
																				pincode: e.target.value,
																		  }
																		: addr
															),
														}));
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
													setEditedUser((prev: any) => ({
														...prev,
														addresses: prev?.addresses?.map(
															(addr: any, addrIndex: number) =>
																addrIndex === index
																	? {
																			...addr,
																			country: e.target.value,
																	  }
																	: addr
														),
													}));
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

								{editedUser.addresses.length === 0 && (
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
								<p className="font-medium text-foreground">{user?.name}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Email
								</h3>
								<p className="font-medium text-foreground">{user?.email}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Phone
								</h3>
								<p className="font-medium text-foreground">{user?.phone}</p>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									User Type
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
										{user?.userType || "Not specified"}
									</span>
								</div>
							</div>
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Status
								</h3>
								<div className="flex items-center">
									<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{user?.status || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{user?.addresses && user.addresses.length > 0 && (
							<div className="space-y-4 pt-2 border-t border-border">
								<h3 className="text-sm font-medium text-muted-foreground">
									Addresses
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{user.addresses.map((address: any, index: number) => (
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
