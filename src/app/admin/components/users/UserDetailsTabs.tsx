"use client";

import { Save, MapPin, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";

interface Address {
	id?: string;
	type: "home" | "work" | "other";
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	country: string;
	pincode?: string;
}

interface UserPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface User {
	name: string;
	phone: string;
	email: string;
	userType?: string;
	bio?: string;
	addresses?: Address[];
	status?: string;
	preferences?: UserPreferences;
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	addresses?: {
		[key: string]: {
			line1?: string;
			city?: string;
			country?: string;
			label?: string;
		};
	};
}

interface UserDetailsTabsProps {
	user: User | null;
	editedUser: Partial<User> | null;
	setEditedUser: (
		user: Partial<User> | ((prev: Partial<User> | null) => Partial<User> | null)
	) => void;
	isEditing: boolean;
	isSaving: boolean;
	errors: FormErrors;
	setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
	setAddressesToDelete: (fn: (prevState: string[]) => string[]) => void;
	handleSaveChanges: () => void;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
	formatPhoneNumber: (value: string) => string;
	handlePostImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handlePostVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleSavePosts: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	handleRemovePostImage: (imageUrl: string) => void;
	isUploadingPostImage: boolean;
	isUploadingPostVideo: boolean;
	isSavingPosts: boolean;
	postImages: string[];
	showVideoUpload: boolean;
	setShowVideoUpload: React.Dispatch<React.SetStateAction<boolean>>;
	showImageUpload: boolean;
	setShowImageUpload: React.Dispatch<React.SetStateAction<boolean>>;
	handleRemovePostVideo: (videoUrl: string) => void;
	postVideos: string[];

	

}

export default function UserDetailsTabs({
	user,
	editedUser,
	setEditedUser,
	isEditing,
	isSaving,
	errors,
	setErrors,
	setAddressesToDelete,
	handleSaveChanges,
	handleBlockNoteChange,
	safeBlockNoteHtml,
	formatPhoneNumber,
	handlePostImageUpload,
	handlePostVideoUpload,
	handleSavePosts,
	handleRemovePostImage,
	isUploadingPostImage,
	isUploadingPostVideo,
	isSavingPosts,
	postImages,
	showVideoUpload,
	setShowVideoUpload,
	showImageUpload,
	setShowImageUpload,
	handleRemovePostVideo,
	postVideos,

}: UserDetailsTabsProps) {
	if (!user || !editedUser) {
		return (
			<Card>
				<CardHeader className="animate-pulse">
					<div className="h-8 w-full bg-muted rounded" />
				</CardHeader>
				<CardContent className="animate-pulse">
					<div className="h-40 w-full bg-muted rounded" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Tabs defaultValue="details">
			<TabsList className="grid grid-cols-5 mb-4">
				<TabsTrigger value="details">User Details</TabsTrigger>
				<TabsTrigger value="biography">Biography</TabsTrigger>
				<TabsTrigger value="post">User Post</TabsTrigger>               
				<TabsTrigger value="preferences">Preferences</TabsTrigger>
				<TabsTrigger value="activity">Activity Log</TabsTrigger>
			</TabsList>

			<TabsContent value="details" className="space-y-4">
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
														setErrors((prev) => ({
															...prev,
															phone: undefined,
														}));
													}
												}}
												placeholder="+91 9876543210"
												className={`pl-12 ${
													errors.phone ? "border-red-500" : ""
												}`}
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
													setEditedUser((prev) => ({
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

										{editedUser.addresses.map((address, index) => (
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
																setAddressesToDelete((prevDel) => [
																	...prevDel,
																	addr.id!,
																]);
															}
															setEditedUser((prev) => ({
																...prev,
																addresses:
																	prev?.addresses?.filter(
																		(_, addrIndex) => addrIndex !== index
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
																setEditedUser((prev) => ({
																	...prev,
																	addresses: prev?.addresses?.map(
																		(addr, addrIndex) =>
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
																	setEditedUser((prev) => ({
																		...prev,
																		addresses: prev?.addresses?.map(
																			(addr, addrIndex) =>
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
															setEditedUser((prev) => ({
																...prev,
																addresses: prev?.addresses?.map(
																	(addr, addrIndex) =>
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
															setEditedUser((prev) => ({
																...prev,
																addresses: prev?.addresses?.map(
																	(addr, addrIndex) =>
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
														<Label htmlFor={`address-city-${index}`}>
															City
														</Label>
														<Input
															id={`address-city-${index}`}
															value={address.city || ""}
															onChange={(e) => {
																setEditedUser((prev) => ({
																	...prev,
																	addresses: prev?.addresses?.map(
																		(addr, addrIndex) =>
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
																setEditedUser((prev) => ({
																	...prev,
																	addresses: prev?.addresses?.map(
																		(addr, addrIndex) =>
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
																setEditedUser((prev) => ({
																	...prev,
																	addresses: prev?.addresses?.map(
																		(addr, addrIndex) =>
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
															setEditedUser((prev) => ({
																...prev,
																addresses: prev?.addresses?.map(
																	(addr, addrIndex) =>
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
												No addresses added. Click &ldquo;Add Address&rdquo; to
												add one.
											</div>
										)}
									</div>
								)}
								{/* <div className="space-y-2">
									<Card>
										<CardHeader>
											<CardTitle>Biography</CardTitle>
										</CardHeader>
										<CardContent>
											<BlockNoteEditor
												initialContent={editedUser?.bio || ""}
												onChange={(val: string) =>
													handleBlockNoteChange("bio", val)
												}
												editable={isEditing}
											/>
										</CardContent>
									</Card>
								</div> */}
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
								<div className="space-y-2 pt-2 border-t border-border">
									<h3 className="text-sm font-medium text-muted-foreground">
										Bio
									</h3>
									<div className="font-medium text-foreground prose prose-sm max-w-none">
										<div
											dangerouslySetInnerHTML={{
												__html: safeBlockNoteHtml(user?.bio),
											}}
										/>
									</div>
								</div>

								{user?.addresses && user.addresses.length > 0 && (
									<div className="space-y-4 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Addresses
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{user.addresses.map((address, index) => (
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
			</TabsContent>

			{/* Biography tab */}
            <TabsContent value="biography" className="space-y-4">
							<Card>
								<CardContent className="px-1">
									<div className="space-y-1 ">
										{isEditing ? (
											<div className="">
												<BlockNoteEditor
													initialContent={editedUser?.bio || ""}
													onChange={(val: string) =>
														handleBlockNoteChange("bio", val)
													}
													editable={isEditing}
												/>
												{/* <p className="mt-2 text-xs text-muted-foreground">
													Use the editor above to add or update the biography. You can use formatting, lists, and links.
												</p> */}
											</div>
										) : (
											<div>
												{editedUser?.bio &&
												safeBlockNoteHtml(editedUser?.bio) ? (
													<div
														className="prose prose-sm max-w-none text-foreground p-3"
														dangerouslySetInnerHTML={{
															__html: safeBlockNoteHtml(editedUser?.bio),
														}}
													/>
												) : (
													<p className="text-muted-foreground italic">
														No biography has been added yet.
													</p>
												)}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Posts tab */}
						<TabsContent value="post" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>User Posts</CardTitle>
									<CardDescription>
										Add and manage images and videos for posts.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Images Section */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium">Images</h3>
											{isEditing && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setShowImageUpload((v) => !v)}
												>
													{showImageUpload ? "Hide" : "Add Image"}
												</Button>
											)}
										</div>
										{isEditing && showImageUpload && (
											<div className="space-y-2 mb-2">
												<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
													<Plus className="h-6 w-6 text-gray-400" />
													<span className="text-xs text-gray-500">
														Add Image
													</span>
													<input
														type="file"
														accept="image/*"
														multiple
														className="hidden"
														onChange={handlePostImageUpload}
														disabled={isUploadingPostImage}
													/>
												</label>
												{isUploadingPostImage && (
													<p className="text-xs text-blue-600">
														Uploading image(s)...
													</p>
												)}
											</div>
										)}
										<div className="flex flex-wrap gap-3 mt-2">
											{postImages.map((img, idx) => (
												<div
													key={img}
													className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
												>
													<Image
														src={img}
														alt={`Post Image ${idx + 1}`}
														fill
														sizes="128px"
														style={{ objectFit: "cover" }}
														className="object-cover w-full h-full"
													/>
													{isEditing && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => handleRemovePostImage(img)}
															className="absolute top-1 right-1 bg-white/80"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											))}
											{!isEditing && postImages.length === 0 && (
												<p className="text-xs text-muted-foreground">
													No images added.
												</p>
											)}
										</div>
									</div>
									{/* Videos Section */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium">Videos</h3>
											{isEditing && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setShowVideoUpload((v) => !v)}
												>
													{showVideoUpload ? "Hide" : "Add Video"}
												</Button>
											)}
										</div>
										{isEditing && showVideoUpload && (
											<div className="space-y-2 mb-2">
												<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
													<Plus className="h-6 w-6 text-gray-400" />
													<span className="text-xs text-gray-500">
														Add Video
													</span>
													<input
														type="file"
														accept="video/mp4,video/webm,video/ogg"
														multiple
														className="hidden"
														onChange={handlePostVideoUpload}
														disabled={isUploadingPostVideo}
													/>
												</label>
												{isUploadingPostVideo && (
													<p className="text-xs text-blue-600">
														Uploading video(s)...
													</p>
												)}
											</div>
										)}
										<div className="flex flex-wrap gap-3 mt-2">
											{postVideos.map((vid) => (
												<div
													key={vid}
													className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
												>
													<video
														src={vid}
														controls
														className="object-cover w-full h-full"
													/>
													{isEditing && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => handleRemovePostVideo(vid)}
															className="absolute top-1 right-1 bg-white/80"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											))}
											{!isEditing && postVideos.length === 0 && (
												<p className="text-xs text-muted-foreground">
													No videos added.
												</p>
											)}
										</div>
									</div>
									{/* Save Posts Button */}
									{isEditing && (
										<div className="pt-4">
											<Button
												onClick={handleSavePosts}
												disabled={isSavingPosts}
											>
												{isSavingPosts ? (
													<>
														<Save className="h-4 w-4 mr-2 animate-spin" />
														Saving...
													</>
												) : (
													<>
														<Save className="h-4 w-4 mr-2" />
														Save Posts
													</>
												)}
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>




			<TabsContent value="preferences" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>User Preferences</CardTitle>
						<CardDescription>
							Manage notification settings and user preferences.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{isEditing ? (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<Label htmlFor="notifications">Email Notifications</Label>
										<input
											type="checkbox"
											id="notifications"
											checked={editedUser?.preferences?.notifications || false}
											onChange={(e) =>
												setEditedUser((prev) =>
													prev
														? {
																...prev,
																preferences: {
																	...(prev.preferences as UserPreferences),
																	notifications: e.target.checked,
																},
														  }
														: null
												)
											}
											className="h-4 w-4"
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label htmlFor="newsletter">Subscribe to Newsletter</Label>
										<input
											type="checkbox"
											id="newsletter"
											checked={editedUser?.preferences?.newsletter || false}
											onChange={(e) =>
												setEditedUser((prev) =>
													prev
														? {
																...prev,
																preferences: {
																	...(prev.preferences as UserPreferences),
																	newsletter: e.target.checked,
																},
														  }
														: null
												)
											}
											className="h-4 w-4"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="language">Preferred Language</Label>
										<Select
											value={editedUser?.preferences?.language || ""}
											onValueChange={(value) =>
												setEditedUser((prev) =>
													prev
														? {
																...prev,
																preferences: {
																	...(prev.preferences as UserPreferences),
																	language: value,
																},
														  }
														: null
												)
											}
										>
											<SelectTrigger id="language">
												<SelectValue placeholder="Select language" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="Hindi">Hindi</SelectItem>
													<SelectItem value="English">English</SelectItem>
													<SelectItem value="Sanskrit">Sanskrit</SelectItem>
													<SelectItem value="Tamil">Tamil</SelectItem>
													<SelectItem value="Bengali">Bengali</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<h3 className="text-sm text-muted-foreground">
												Email Notifications
											</h3>
											<p className="font-medium">
												{user?.preferences?.notifications
													? "Enabled"
													: "Disabled"}
											</p>
										</div>
										<div>
											<h3 className="text-sm text-muted-foreground">
												Newsletter
											</h3>
											<p className="font-medium">
												{user?.preferences?.newsletter
													? "Subscribed"
													: "Not Subscribed"}
											</p>
										</div>
										<div>
											<h3 className="text-sm text-muted-foreground">
												Preferred Language
											</h3>
											<p className="font-medium">
												{user?.preferences?.language}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</CardContent>
					{isEditing && (
						<CardFooter>
							<Button onClick={handleSaveChanges} className="w-full">
								<Save className="h-4 w-4 mr-2" />
								Save Preferences
							</Button>
						</CardFooter>
					)}
				</Card>
			</TabsContent>

			<TabsContent value="activity" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Activity Log</CardTitle>
						<CardDescription>
							Recent user activities and interactions.
						</CardDescription>
					</CardHeader>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
