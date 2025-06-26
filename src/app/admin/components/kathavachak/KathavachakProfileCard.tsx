"use client";

import { useState } from "react";
import Image from "next/image";
import {
	Phone,
	Mail,
	MapPin,
	ChevronDown,
	Upload,
	User,
	Plus,
	Trash2,
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
import { Kathavachak } from "./types";

interface ProfileCardProps {
	kathavachak: Kathavachak | null;
	editedKathavachak: Partial<Kathavachak> | null;
	isEditing: boolean;
	setIsEditing: (isEditing: boolean) => void;
	handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	handleRemoveImage: () => void;
	isUploadingImage: boolean;
	imageError: boolean;
	setImageError: (error: boolean) => void;
}

const getKathavachakStatus = (kathavachak: Kathavachak) => {
	if (!kathavachak.status || kathavachak.status === "Inactive") return "Inactive";
	return kathavachak.isLoggedIn ? "Active (Online)" : "Active (Offline)";
};

const getStatusColor = (status: string) => {
	if (status === "Inactive") return "bg-red-100 text-red-800";
	if (status === "Active (Online)") return "bg-green-100 text-green-800";
	return "bg-blue-100 text-blue-800"; // Active (Offline)
};

export default function ProfileCard({
	kathavachak,
	editedKathavachak,
	isEditing,
	setIsEditing,
	handleImageUpload,
	handleRemoveImage,
	isUploadingImage,
	imageError,
	setImageError,
}: ProfileCardProps) {
	const [showAddresses, setShowAddresses] = useState(false);

	return (
		<Card className="md:col-span-1 h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<div className="relative w-20 h-20 mx-auto mb-3">
					<div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
						{(isEditing
							? editedKathavachak?.profileImageUrl
							: kathavachak?.profileImageUrl) && !imageError ? (
							<Image
								src={
									isEditing
										? editedKathavachak?.profileImageUrl || "/placeholder.png"
										: kathavachak?.profileImageUrl || "/placeholder.png"
								}
								alt={
									isEditing ? editedKathavachak?.name || "Kathavachak" : kathavachak?.name || "Kathavachak"
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

					{isEditing && !editedKathavachak?.profileImageUrl && !imageError && (
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

					{isEditing && editedKathavachak?.profileImageUrl && !imageError && (
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
				<CardTitle className="text-center text-lg">{kathavachak?.name}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
							kathavachak
								? getStatusColor(getKathavachakStatus(kathavachak))
								: "bg-red-100 text-red-800"
						}`}
					>
						{kathavachak ? getKathavachakStatus(kathavachak) : "Inactive"}
					</span>
					{kathavachak?.KathavachakType && (
						<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
							{kathavachak.KathavachakType}
						</span>
					)}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3 p-4 pt-0">
				<div className="flex items-center gap-2 text-sm">
					<Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="truncate">{kathavachak?.phone}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="truncate">{kathavachak?.email}</span>
				</div>

				{kathavachak?.addresses && kathavachak.addresses.length > 0 && (
					<div className="mt-3 pt-3 border-t border-border">
						<button
							onClick={() => setShowAddresses(!showAddresses)}
							className="w-full flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 rounded-md p-1 -ml-1 -mb-1"
						>
							<MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
							<span>Addresses ({kathavachak.addresses.length})</span>
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
								{kathavachak.addresses.map((address, index) => (
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
												{address.pincode && ` - ${address.pincode}`}
											</p>
										</div>
									</div>
								))}
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
					{isEditing ? "Cancel" : "Edit Kathavachak"}
				</Button>
			</CardFooter>
		</Card>
	);
}
