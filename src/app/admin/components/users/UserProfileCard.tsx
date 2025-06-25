"use client";

import Image from "next/image";
import {
	User,
	Phone,
	Mail,
	Calendar,
	MapPin,
	Plus,
	Trash2,
	ChevronDown,
	Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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

interface User {
	id: string;
	name: string;
	phone: string;
	email: string;
	userType?: string;
	profileImageUrl?: string;
	addresses?: Address[];
	status?: string;
	isLoggedIn: boolean;
	lastActiveAt?: string | Date | null;
	createdAt: string | Date;
}

interface UserProfileCardProps {
	user: User | null;
	editedUser: Partial<User> | null;
	isEditing: boolean;
	setIsEditing: (isEditing: boolean) => void;
	imageError: boolean;
	setImageError: (error: boolean) => void;
	isUploadingImage: boolean;
	handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemoveImage: () => void;
	showAddresses: boolean;
	setShowAddresses: (show: boolean) => void;
	formatDate: (dateString: string | Date) => string;
	getUserStatus: (user: User) => string;
	getStatusColor: (status: string) => string;
}

export default function UserProfileCard({
	user,
	editedUser,
	isEditing,
	setIsEditing,
	imageError,
	setImageError,
	isUploadingImage,
	handleImageUpload,
	handleRemoveImage,
	showAddresses,
	setShowAddresses,
	formatDate,
	getUserStatus,
	getStatusColor,
}: UserProfileCardProps) {
	if (!user) {
		return (
			<Card className="md:col-span-1 h-fit">
				<CardHeader>
					<CardTitle>Loading...</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 animate-pulse">
						<div className="mx-auto bg-muted h-20 w-20 rounded-full" />
						<div className="h-6 w-3/4 mx-auto bg-muted rounded" />
						<div className="h-4 w-1/2 mx-auto bg-muted rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="md:col-span-1 h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<div className="relative w-20 h-20 mx-auto mb-3">
					<div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
						{(isEditing
							? editedUser?.profileImageUrl
							: user?.profileImageUrl) && !imageError ? (
							<Image
								src={
									isEditing
										? editedUser?.profileImageUrl || "/placeholder.png"
										: user?.profileImageUrl || "/placeholder.png"
								}
								alt={
									isEditing ? editedUser?.name || "User" : user?.name || "User"
								}
								width={80}
								height={80}
								className="w-full h-full rounded-full object-cover"
								onError={() => setImageError(true)}
								unoptimized={true}
							/>
						) : (
							<User className="h-10 w-10 text-muted-foreground" />
						)}
					</div>

					{isEditing && (
						<div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
							<input
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handleImageUpload}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								disabled={isUploadingImage}
							/>
							{isUploadingImage ? (
								<div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
							) : (
								<Upload className="h-6 w-6 text-white" />
							)}
						</div>
					)}

					{isEditing && !editedUser?.profileImageUrl && !imageError && (
						<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
							<input
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handleImageUpload}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								disabled={isUploadingImage}
							/>
							<Plus className="h-3 w-3 text-primary-foreground" />
						</div>
					)}

					{isEditing && editedUser?.profileImageUrl && !imageError && (
						<Button
							type="button"
							variant="destructive"
							size="sm"
							className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
							onClick={handleRemoveImage}
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					)}
				</div>
				<CardTitle className="text-center text-lg">{user?.name}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
							user ? getUserStatus(user) : "Inactive"
						)}`}
					>
						{user ? getUserStatus(user) : "Inactive"}
					</span>
					{user?.userType && (
						<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
							{user.userType}
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="truncate">{user?.phone}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="truncate">{user?.email}</span>
				</div>
				<div className="flex items-start gap-2 text-xs text-muted-foreground">
					<Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
					<div>
						<div>
							Created:{" "}
							{user?.createdAt ? formatDate(user.createdAt.toString()) : "N/A"}
						</div>
						<div>
							Last Active:{" "}
							{user?.lastActiveAt
								? formatDate(user.lastActiveAt.toString())
								: "N/A"}
							{user?.isLoggedIn && " (Now)"}
						</div>
					</div>
				</div>

				{user?.addresses && user.addresses.length > 0 && (
					<div className="mt-3 pt-3 border-t border-border">
						<div>
							<button
								onClick={() => setShowAddresses(!showAddresses)}
								className="w-full flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 rounded-md p-1 -ml-1 -mb-1"
							>
								<MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<span>Addresses ({user.addresses.length})</span>
								<ChevronDown
									className={`h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform ${
										showAddresses ? "rotate-180" : ""
									}`}
								/>
							</button>
							<div
								className={`overflow-hidden transition-all duration-200 ease-in-out ${
									showAddresses
										? "max-h-[500px] opacity-100 mt-1"
										: "max-h-0 opacity-0"
								}`}
							>
								<div className="space-y-2 text-sm">
									{user.addresses.map((address, index) => (
										<div
											key={index}
											className="border border-border/50 rounded p-2 text-xs"
										>
											<div className="font-medium text-foreground/90">
												{address.type.charAt(0).toUpperCase() +
													address.type.slice(1)}
												{address.type === "other" && address.label
													? ` (${address.label})`
													: ""}
											</div>
											<div className="mt-1 space-y-0.5 text-muted-foreground">
												<p className="truncate">{address.line1}</p>
												{address.line2 && (
													<p className="truncate">{address.line2}</p>
												)}
												<p className="truncate">
													{address.city}
													{address.state && `, ${address.state}`}
													{address.pincode && ` - ${address.pincode}`}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={() => setIsEditing(!isEditing)}
				>
					{isEditing ? "Cancel" : "Edit User"}
				</Button>
			</CardFooter>
		</Card>
	);
}
