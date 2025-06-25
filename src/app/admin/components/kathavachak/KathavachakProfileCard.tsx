"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import {
	User,
	Upload,
	Plus,
	Trash2,
	Phone,
	Mail,
	BookOpen,
	Award,
	MapPin,
	ChevronDown,
} from "lucide-react";

export default function KathavachakProfileCard({
	kathavachak,
	editedKathavachak,
	isEditing,
	setIsEditing,
	isUploadingImage,
	handleImageUpload,
	handleRemoveImage,
	imageError,
	setImageError,
	getStatusColor,
	getKathavachakStatus,
	getCategoryColor,
	getRankColor,
	showAddresses,
	setShowAddresses,
}: any) {
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
									isEditing
										? editedKathavachak?.name || "Kathavachak"
										: kathavachak?.name || "Kathavachak"
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
				<CardTitle className="text-center text-lg">
					{kathavachak?.name}
				</CardTitle>
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
				<div className="pt-2 space-y-2">
					<div className="flex items-center gap-2 text-sm">
						<BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						<div className="flex-1">
							<span className="text-xs text-muted-foreground">Category: </span>
							<span
								className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
									kathavachak?.category || ""
								)} w-20`}
							>
								{kathavachak?.category || "Not specified"}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<Award className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						<div className="flex-1">
							<span className="text-xs text-muted-foreground">Rank: </span>
							<span
								className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
									kathavachak?.rank || ""
								)} w-20`}
							>
								{kathavachak?.rank || "Not specified"}
							</span>
						</div>
					</div>
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
								{kathavachak.addresses.map((address: any, index: number) => (
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
