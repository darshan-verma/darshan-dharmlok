"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	User,
	Phone,
	Mail,
	MapPin,
	Plus,
	Trash2,
	ChevronDown,
	BookOpen,
	Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import Image from "next/image";
import { toast } from "@/lib/toast";
import {
	getRankColor,
	getCategoryColor,
} from "@/app/admin/components/panditji/PanditjiTable";

interface Activity {
	date: string;
	action: string;
}

interface PanditjiPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

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
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface Panditji {
	id: string;
	name: string;
	phone: string;
	email: string;
	PanditjiType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bio?: string;
	coverImageUrl?: string;
	category?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	rank?: string;
	availability?: number;
	kycApproved?: number;
	status?: string;
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	createdAt: string | Date;
	// Client-side only properties
	preferences?: PanditjiPreferences;
	activities?: Activity[];
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

export default function PanditjiDetailPage() {
	const params = useParams();
	const router = useRouter();
	const PanditjiId = params.id as string;

	const [panditji, setPanditji] = useState<Panditji | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedPanditji, setEditedPanditji] =
		useState<Partial<Panditji> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [showAddresses, setShowAddresses] = useState(false);

	// Fetch Panditji data from API
	const fetchPanditjiData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format
			if (PanditjiId && !/^[0-9a-fA-F]{24}$/.test(PanditjiId)) {
				toast.error("Invalid Panditji ID format");
				router.push("/admin/panditji");
				return;
			}

			const loadingToast = toast.loading("Loading Panditji details...");

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			try {
				const response = await fetch(`/api/users/${PanditjiId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorText = await response.text();

					let errorData;
					try {
						errorData = JSON.parse(errorText);
					} catch {
						errorData = { error: "Unknown error occurred" };
					}

					throw new Error(errorData.error || "Failed to fetch Panditji");
				}

				const PanditjiData = await response.json();

				// Create a complete Panditji object with fallbacks for missing properties
				const completePanditji: Panditji = {
					...PanditjiData,
					id: PanditjiData.id,
					name: PanditjiData.name || "",
					email: PanditjiData.email || "",
					phone: PanditjiData.phone || "",
					addresses: PanditjiData.addresses || [],
					PanditjiType: PanditjiData.PanditjiType || "Regular",
					status: PanditjiData.status || "Active",
					isLoggedIn: PanditjiData.isLoggedIn || false,
					bio: PanditjiData.bio || "",
					createdAt: PanditjiData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setPanditji(completePanditji);
				setEditedPanditji({ ...completePanditji });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				if (error instanceof Error) {
					if (error.name === "AbortError") {
						throw new Error("Request timed out. Please try again.");
					}
				}
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to load Panditji details"
			);

			// Create a mock Panditji as fallback for development
			if (process.env.NODE_ENV !== "production") {
				const mockPanditji: Panditji = {
					id: PanditjiId || "mock-id",
					name: "Test Panditji",
					email: "test@example.com",
					phone: "1234567890",
					addresses: [
						{
							type: "home",
							line1: "123 Test Street",
							city: "Test City",
							country: "India",
						},
					],
					PanditjiType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test Panditji bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setPanditji(mockPanditji);
				setEditedPanditji({ ...mockPanditji });
				return;
			}

			router.push("/admin/panditji");
		}
	}, [PanditjiId, router]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (PanditjiId) {
			fetchPanditjiData();
		}
	}, [PanditjiId, fetchPanditjiData]);

	const validateForm = (PanditjiData: Partial<Panditji>): boolean => {
		const newErrors: FormErrors = {};

		if (!PanditjiData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!PanditjiData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(PanditjiData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!PanditjiData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(PanditjiData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (PanditjiData.addresses) {
			PanditjiData.addresses.forEach((address, index) => {
				if (!address.line1?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].line1 = "Address line 1 is required";
				}

				if (!address.city?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].city = "City is required";
				}

				if (!address.country?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].country = "Country is required";
				}
			});
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedPanditji) return;

		if (!validateForm(editedPanditji)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedPanditji.name,
				email: editedPanditji.email,
				phone: editedPanditji.phone,
				addresses: editedPanditji.addresses,
				bio: editedPanditji.bio || null,
			};

			const response = await fetch(`/api/users/${PanditjiId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update Panditji");
			}

			const updatedPanditji = await response.json();

			setPanditji(updatedPanditji);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Panditji details updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update Panditji details"
			);
		} finally {
			setIsSaving(false);
		}
	};

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "N/A";
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	};

	const getPanditjiStatus = (Panditji: Panditji) => {
		if (!Panditji.status || Panditji.status === "Inactive")
			return "Inactive";
		return Panditji.isLoggedIn ? "Active (Online)" : "Active (Offline)";
	};

	const getStatusColor = (status: string) => {
		if (status === "Inactive") return "bg-red-100 text-red-800";
		if (status === "Active (Online)") return "bg-green-100 text-green-800";
		return "bg-blue-100 text-blue-800"; // Active (Offline)
	};

	const formatPhoneNumber = (value: string): string => {
		// Remove all non-digit characters
		const cleaned = value.replace(/\D/g, "");

		// If it starts with 91, add +91
		if (cleaned.startsWith("91") && cleaned.length >= 10) {
			return `+91 ${cleaned.substring(2, 12)}`;
		}
		// If it's 10 digits, format as is
		else if (cleaned.length <= 10) {
			return cleaned;
		}
		// Default return the cleaned value
		return cleaned;
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/panditji")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Panditji Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Panditji Profile Card */}
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
							{panditji?.profileImageUrl && !imageError ? (
								<Image
									src={panditji.profileImageUrl}
									alt={panditji.name}
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
						<CardTitle className="text-center text-lg">
							{panditji?.name}
						</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									panditji
										? getStatusColor(getPanditjiStatus(panditji))
										: "bg-red-100 text-red-800"
								}`}
							>
								{panditji ? getPanditjiStatus(panditji) : "Inactive"}
							</span>
							{panditji?.PanditjiType && (
								<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
									{panditji.PanditjiType}
								</span>
							)}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
							<span className="truncate">{panditji?.phone}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
							<span className="truncate">{panditji?.email}</span>
						</div>
						<div className="pt-2 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">
										Category:{" "}
									</span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
											panditji?.category || ""
										)} w-20`}
									>
										{panditji?.category || "Not specified"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Award className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">Rank: </span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
											panditji?.rank || ""
										)} w-20`}
									>
										{panditji?.rank || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{/* Addresses Box – Compact Version */}
						{panditji?.addresses && panditji.addresses.length > 0 && (
							<div className="mt-3 pt-3 border-t border-border">
								<button
									onClick={() => setShowAddresses(!showAddresses)}
									className="w-full flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 rounded-md p-1 -ml-1 -mb-1"
								>
									<MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
									<span>Addresses ({panditji.addresses.length})</span>
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
										{panditji.addresses.map((address, index) => (
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
							{isEditing ? "Cancel" : "Edit Panditji"}
						</Button>
					</CardFooter>
				</Card>

				{/* Tabs Section */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="details">Panditji Details</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update Panditji&apos;s personal details and contact
										information.
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
														value={editedPanditji?.name || ""}
														onChange={(e) =>
															setEditedPanditji({
																...editedPanditji,
																name: e.target.value,
															})
														}
														className={errors.name ? "border-red-500" : ""}
													/>
													{errors.name && (
														<p className="text-sm text-red-500">
															{errors.name}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														value={editedPanditji?.email || ""}
														onChange={(e) =>
															setEditedPanditji({
																...editedPanditji,
																email: e.target.value,
															})
														}
														className={errors.email ? "border-red-500" : ""}
													/>
													{errors.email && (
														<p className="text-sm text-red-500">
															{errors.email}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="phone">Phone</Label>
													<div className="relative">
														<Input
															id="phone"
															type="tel"
															value={editedPanditji?.phone || ""}
															onChange={(e) => {
																// Format the input value
																const formatted = formatPhoneNumber(
																	e.target.value
																);
																setEditedPanditji({
																	...editedPanditji,
																	phone: formatted,
																});
																// Clear error when typing
																if (errors.phone) {
																	setErrors({
																		...errors,
																		phone: undefined,
																	});
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
														<p className="text-sm text-red-500">
															{errors.phone}
														</p>
													)}
												</div>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
												<div className="space-y-2">
													<Label>Category</Label>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
															panditji?.category || ""
														)} w-20`}
													>
														{panditji?.category || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<Label>Rank</Label>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
															panditji?.rank || ""
														)} w-20`}
													>
														{panditji?.rank || "Not specified"}
													</span>
												</div>
											</div>
											{panditji?.addresses && (
												<div className="space-y-6 border p-4 rounded-lg">
													<div className="flex justify-between items-center">
														<h3 className="text-base font-medium">Addresses</h3>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																setEditedPanditji((prev) => {
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

													{panditji.addresses.map((address, index) => (
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
																		setEditedPanditji((prev) => {
																			if (!prev) return prev;
																			return {
																				...prev,
																				addresses:
																					prev.addresses?.filter(
																						(_, addrIndex) =>
																							addrIndex !== index
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
																			setEditedPanditji((prev) => {
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
																			<SelectItem value="other">
																				Other
																			</SelectItem>
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
																				setEditedPanditji((prev) => {
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
																		setEditedPanditji((prev) => {
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
																		setEditedPanditji((prev) => {
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
																	<Label htmlFor={`address-city-${index}`}>
																		City
																	</Label>
																	<Input
																		id={`address-city-${index}`}
																		value={address.city || ""}
																		onChange={(e) => {
																			setEditedPanditji((prev) => {
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
																			setEditedPanditji((prev) => {
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
																			setEditedPanditji((prev) => {
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
																		setEditedPanditji((prev) => {
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

													{editedPanditji?.addresses?.length === 0 && (
														<div className="text-center py-4 text-muted-foreground">
															No addresses added. Click &ldquo;Add
															Address&rdquo; to add one.
														</div>
													)}
												</div>
											)}
											<div className="space-y-2">
												<Label htmlFor="bio">Bio</Label>
												<Textarea
													id="bio"
													value={editedPanditji?.bio || ""}
													onChange={(e) =>
														setEditedPanditji({
															...editedPanditji,
															bio: e.target.value,
														})
													}
													rows={4}
													placeholder="Tell us about yourself"
												/>
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
														{panditji?.name}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Email
													</h3>
													<p className="font-medium text-foreground">
														{panditji?.email}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium text-foreground">
														{panditji?.phone}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Member Since
													</h3>
													<p className="font-medium text-foreground">
														{panditji?.createdAt
															? formatDate(panditji.createdAt)
															: "N/A"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Last Login
													</h3>
													<p className="font-medium text-foreground">
														{panditji?.lastLoginAt
															? formatDate(panditji.lastLoginAt)
															: "Never"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Last Logout
													</h3>
													<p className="font-medium text-foreground">
														{panditji?.lastLogoutAt
															? formatDate(panditji.lastLogoutAt)
															: "N/A"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Panditji Type
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
															{panditji?.PanditjiType || "Not specified"}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Status
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{panditji?.status || "Not specified"}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Category
													</h3>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
															panditji?.category || ""
														)} w-20`}
													>
														{panditji?.category || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Rank
													</h3>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
															panditji?.rank || ""
														)} w-20`}
													>
														{panditji?.rank || "Not specified"}
													</span>
												</div>
											</div>
											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Bio
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{panditji?.bio || "No bio provided"}
												</p>
											</div>

											{panditji?.addresses &&
												panditji.addresses.length > 0 && (
													<div className="space-y-4 pt-2 border-t border-border">
														<h3 className="text-sm font-medium text-muted-foreground">
															Addresses
														</h3>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{panditji.addresses.map((address, index) => (
																<Card key={index} className="border-border">
																	<CardHeader className="pb-2">
																		<div className="flex items-center gap-2">
																			<MapPin className="h-4 w-4 text-muted-foreground" />
																			<CardTitle className="text-base">
																				{address.type.charAt(0).toUpperCase() +
																					address.type.slice(1)}
																				{address.type === "other" &&
																				address.label
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
																			{address.pincode &&
																				` - ${address.pincode}`}
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

						<TabsContent value="preferences" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Panditji Preferences</CardTitle>
									<CardDescription>
										Manage notification settings and Panditji preferences.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{isEditing ? (
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<Label htmlFor="notifications">
														Email Notifications
													</Label>
													<input
														type="checkbox"
														id="notifications"
														checked={
															editedPanditji?.preferences?.notifications ||
															false
														}
														onChange={(e) =>
															setEditedPanditji((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
																				newsletter: e.target.checked,
																			},
																	  }
																	: null
															)
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="flex items-center justify-between">
													<Label htmlFor="newsletter">
														Subscribe to Newsletter
													</Label>
													<input
														type="checkbox"
														id="newsletter"
														checked={
															editedPanditji?.preferences?.newsletter ||
															false
														}
														onChange={(e) =>
															setEditedPanditji((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
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
														value={
															editedPanditji?.preferences?.language || ""
														}
														onValueChange={(value) =>
															setEditedPanditji((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				language: value,
																				notifications:
																					prev.preferences?.notifications ??
																					false, // Provide default value
																				newsletter:
																					prev.preferences?.newsletter ?? false, // Provide default value
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
																<SelectItem value="Sanskrit">
																	Sanskrit
																</SelectItem>
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
															{panditji?.preferences?.notifications
																? "Enabled"
																: "Disabled"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Newsletter
														</h3>
														<p className="font-medium">
															{panditji?.preferences?.newsletter
																? "Subscribed"
																: "Not Subscribed"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Preferred Language
														</h3>
														<p className="font-medium">
															{panditji?.preferences?.language}
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
										Recent Panditji activities and interactions.
									</CardDescription>
								</CardHeader>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
