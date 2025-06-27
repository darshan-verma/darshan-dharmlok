"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import {
	Edit,
	Save,
	PlusCircle,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	MoreVertical,
	AlertTriangle,
	ArrowLeft,
	X,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface PoojaCategory {
	id: string;
	name: string;
	description?: string;
	date?: string;
	price?: number;
	details?: string;
	status?: string;
}

interface Offering {
	id: string;
	price: number;
	details?: string;
	status?: string;
	provider: {
		id: string;
		name: string;
	};
	metadata?: Record<string, unknown>;
}

interface PanditjiUser {
	id: string;
	name: string;
	email?: string;
}

export default function PoojaCategoryDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const poojaCategoryId = params?.id as string;
	const [pooja, setPooja] = useState<PoojaCategory | null>(null);
	const [offerings, setOfferings] = useState<Offering[]>([]);
	const [loading, setLoading] = useState(true);

	// Admin form state
	const [allPanditjis, setAllPanditjis] = useState<PanditjiUser[]>([]);
	const [panditjiSearch, setPanditjiSearch] = useState("");
	const [selectedPanditjiId, setSelectedPanditjiId] = useState<string>("");
	const [formPrice, setFormPrice] = useState<string>("");
	const [formDetails, setFormDetails] = useState<string>("");
	const [editingOfferingId, setEditingOfferingId] = useState<string | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [offeringToDelete, setOfferingToDelete] = useState<Offering | null>(
		null
	);
	const [panditjiDropdownOpen, setPanditjiDropdownOpen] = useState(false);
	const [showDetailsAndForm, setShowDetailsAndForm] = useState(false);

	// Fetch pooja category details
	useEffect(() => {
		const fetchPooja = async () => {
			try {
				const res = await fetch(`/api/pooja-categories/${poojaCategoryId}`);
				if (!res.ok) throw new Error("Failed to fetch pooja category");
				const data = await res.json();
				setPooja(data);
			} catch {
				toast.error("Failed to load pooja category details");
			}
		};
		if (poojaCategoryId) fetchPooja();
	}, [poojaCategoryId]);

	// Fetch all Panditji users for dropdown
	useEffect(() => {
		const fetchPanditjis = async () => {
			try {
				const res = await fetch(`/api/users?userType=Panditji`);
				if (!res.ok) throw new Error("Failed to fetch Panditji users");
				const data = await res.json();
				setAllPanditjis(data.users || []);
			} catch {
				toast.error("Failed to load Panditji users");
			}
		};
		fetchPanditjis();
	}, []);

	// Fetch offerings for this pooja category
	useEffect(() => {
		const fetchOfferings = async () => {
			try {
				const res = await fetch(
					`/api/service-offerings?targetType=PoojaCategory&targetId=${poojaCategoryId}`
				);
				if (!res.ok) throw new Error("Failed to fetch offerings");
				const data = await res.json();
				setOfferings(data.offerings || []);
			} catch {
				toast.error("Failed to load offerings");
			} finally {
				setLoading(false);
			}
		};
		if (poojaCategoryId) fetchOfferings();
	}, [poojaCategoryId]);

	// Filter Panditji dropdown by search and exclude already added
	const filteredPanditjis = allPanditjis.filter(
		(p) =>
			// Exclude if already in offerings (unless editing that offering)
			!offerings.some(
				(o) =>
					o.provider.id === p.id &&
					// Allow editing the same Panditji
					(editingOfferingId ? o.id !== editingOfferingId : true)
			) &&
			(p.name.toLowerCase().includes(panditjiSearch.toLowerCase()) ||
				(p.email?.toLowerCase().includes(panditjiSearch.toLowerCase()) ??
					false))
	);

	// Handle add/update offering
	const handleOfferingSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedPanditjiId) {
			toast.error("Please select a Panditji");
			return;
		}
		if (!formPrice || isNaN(Number(formPrice))) {
			toast.error("Please enter a valid price");
			return;
		}
		setIsSubmitting(true);
		try {
			const method = editingOfferingId ? "PUT" : "POST";
			const url = editingOfferingId
				? `/api/service-offerings/${editingOfferingId}`
				: `/api/service-offerings`;
			const body = editingOfferingId
				? {
						price: Number(formPrice),
						details: formDetails,
				  }
				: {
						providerId: selectedPanditjiId,
						serviceType: "pooja",
						targetType: "PoojaCategory",
						targetId: poojaCategoryId,
						price: Number(formPrice),
						details: formDetails,
				  };
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("Failed to save offering");
			toast.success(editingOfferingId ? "Offering updated" : "Offering added");
			// Refresh offerings
			const refreshed = await fetch(
				`/api/service-offerings?targetType=PoojaCategory&targetId=${poojaCategoryId}`
			);
			const data = await refreshed.json();
			setOfferings(data.offerings || []);
			// Reset form
			setSelectedPanditjiId("");
			setFormPrice("");
			setFormDetails("");
			setEditingOfferingId(null);
		} catch (err) {
			const error = err as Error;
			toast.error(error?.message || "Failed to save offering");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle edit
	const handleEditOffering = (offering: Offering) => {
		setSelectedPanditjiId(offering.provider.id);
		setFormPrice(offering.price.toString());
		setFormDetails(offering.details || "");
		setEditingOfferingId(offering.id);
	};

	const handleDeleteOfferingWithConfirm = (offering: Offering) => {
		setOfferingToDelete(offering);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteOffering = async () => {
		if (!offeringToDelete) return;
		try {
			const res = await fetch(`/api/service-offerings/${offeringToDelete.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete offering");
			setOfferings((prev) => prev.filter((o) => o.id !== offeringToDelete.id));
			toast.success("Offering deleted");
		} catch {
			toast.error("Failed to delete offering");
		} finally {
			setIsDeleteDialogOpen(false);
			setOfferingToDelete(null);
		}
	};

	// Handle status change
	const handleChangeStatus = async (offering: Offering) => {
		const newStatus = offering.status === "Active" ? "Inactive" : "Active";
		try {
			const res = await fetch(`/api/service-offerings/${offering.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error("Failed to update status");
			setOfferings((prev) =>
				prev.map((o) =>
					o.id === offering.id ? { ...o, status: newStatus } : o
				)
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/pooja-category")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Pooja Category Details</h1>
				<Button
					variant="default"
					className="ml-auto"
					onClick={() => setShowDetailsAndForm((v) => !v)}
				>
					{showDetailsAndForm ? "Close Form" : "Open Form"}
				</Button>
			</div>

			{/* Collapsible Details and Add Offering section */}
			{showDetailsAndForm && (
				<div className="mb-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Pooja Category Details Card */}
						<Card>
							<CardHeader className="pb-1 pt-3">
								<CardTitle className="text-lg">
									{pooja?.name || "Pooja Category"}
								</CardTitle>
								<CardDescription className="text-sm line-clamp-2">
									{pooja?.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-0.5 pt-0 pb-3 text-sm">
								<div className="flex justify-between py-0.5 border-b border-gray-100">
									<span className="font-medium">Date:</span>
									<span>
										{pooja?.date
											? new Date(pooja.date).toLocaleDateString()
											: "-"}
									</span>
								</div>
								<div className="flex justify-between py-0.5 border-b border-gray-100">
									<span className="font-medium">Price:</span>
									<span>
										{typeof pooja?.price === "number" ? `₹${pooja.price}` : "-"}
									</span>
								</div>
								<div className="flex justify-between items-center py-0.5">
									<span className="font-medium">Status:</span>
									<span
										className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-sm ${
											pooja?.status === "Active"
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{pooja?.status === "Active" ? "Active" : "Inactive"}
									</span>
								</div>
								{pooja?.details && (
									<div className="pt-1 mt-1 border-t border-gray-100">
										<span className="font-medium">Details:</span>
										<p className="text-sm mt-0.5 line-clamp-2">
											{pooja?.details}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
						{/* Add/Edit Panditji Offering Card */}
						<Card>
							<CardHeader className="pb-2 pt-3">
								<CardTitle className="text-lg">
									{editingOfferingId
										? "Edit Panditji Offering"
										: "Add Panditji Offering"}
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<form onSubmit={handleOfferingSubmit} className="space-y-3">
									<div>
										<label className="block text-sm font-medium mb-1">
											Select Panditji <span className="text-red-500">*</span>
										</label>
										<Popover
											open={panditjiDropdownOpen}
											onOpenChange={setPanditjiDropdownOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													className="w-full justify-between h-9 text-sm"
													disabled={!!editingOfferingId}
													type="button"
												>
													<span className="flex-grow text-left truncate">
														{selectedPanditjiId
															? allPanditjis.find(
																	(p) => p.id === selectedPanditjiId
															  )?.name
															: "Click to select Panditji"}
													</span>
													{selectedPanditjiId ? (
														<X
															className="h-4 w-4 ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																setSelectedPanditjiId("");
																setPanditjiSearch("");
																setPanditjiDropdownOpen(false);
															}}
															role="button"
															aria-label="Clear selection"
														/>
													) : (
														<span className="ml-2 text-gray-400">&#9662;</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-[320px] p-2">
												<Input
													placeholder="Search Panditji by name or email"
													value={panditjiSearch}
													onChange={(e) => setPanditjiSearch(e.target.value)}
													className="mb-2 h-8 text-sm"
													autoFocus
												/>
												<div className="max-h-48 overflow-y-auto">
													{filteredPanditjis.length === 0 ? (
														<div className="px-3 py-2 text-gray-500 text-sm select-none">
															No Panditji found
														</div>
													) : (
														filteredPanditjis.map((p) => (
															<div
																key={p.id}
																className={`px-3 py-2 cursor-pointer hover:bg-muted rounded text-sm ${
																	selectedPanditjiId === p.id
																		? "bg-muted font-semibold"
																		: ""
																}`}
																onClick={() => {
																	setSelectedPanditjiId(p.id);
																	setPanditjiDropdownOpen(false);
																}}
															>
																{p.name} {p.email ? `(${p.email})` : ""}
															</div>
														))
													)}
												</div>
											</PopoverContent>
										</Popover>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Price (₹) <span className="text-red-500">*</span>
										</label>
										<Input
											type="number"
											value={formPrice}
											onChange={(e) => setFormPrice(e.target.value)}
											placeholder="Enter price"
											required
											min={0}
											className="h-9 text-sm"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Details
										</label>
										<Textarea
											value={formDetails}
											onChange={(e) => setFormDetails(e.target.value)}
											placeholder="Describe the service"
											rows={2}
											className="text-sm"
										/>
									</div>
									<Button
										type="submit"
										disabled={isSubmitting}
										size="sm"
										className="mt-1 text-sm"
									>
										{isSubmitting ? (
											<>
												<Save className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : editingOfferingId ? (
											<>
												<Save className="h-4 w-4 mr-2" />
												Update Offering
											</>
										) : (
											<>
												<PlusCircle className="h-4 w-4 mr-2" />
												Add Offering
											</>
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

			{/* Offerings Table */}
			<Card>
				<CardHeader>
					<CardTitle>Panditji Offerings</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-4">Loading offerings...</div>
					) : offerings.length === 0 ? (
						<div className="text-gray-500">No offerings yet.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm border">
								<thead>
									<tr className="bg-muted">
										<th className="px-3 py-2 text-left">Name</th>
										<th className="px-3 py-2 text-left">Pricing</th>
										<th className="px-3 py-2 text-left">Details</th>
										<th className="px-3 py-2 text-left">Status</th>
										<th className="px-3 py-2 text-center">Actions</th>
									</tr>
								</thead>
								<tbody>
									{offerings.map((offering) => (
										<tr key={offering.id} className="border-t">
											<td className="px-3 py-2">{offering.provider?.name}</td>
											<td className="px-3 py-2">₹{offering.price}</td>
											<td className="px-3 py-2">{offering.details || "-"}</td>
											<td className="px-3 py-2">
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
														offering.status === "Active"
															? "bg-green-100 text-green-800"
															: "bg-red-100 text-red-800"
													}`}
												>
													{offering.status === "Active" ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="px-3 py-2 text-center">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															aria-label="Actions"
														>
															<MoreVertical className="h-5 w-5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>
															Manage Pooja Category
														</DropdownMenuLabel>
														<DropdownMenuSeparator />
														<DropdownMenuSub>
															<DropdownMenuSubTrigger>
																<Activity className="h-4 w-4 mr-2" />
																Change Status
															</DropdownMenuSubTrigger>
															<DropdownMenuSubContent>
																<DropdownMenuItem
																	onClick={() => handleChangeStatus(offering)}
																	className={
																		offering.status === "Active"
																			? "bg-blue-50"
																			: ""
																	}
																>
																	<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
																	Active
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleChangeStatus(offering)}
																	className={
																		offering.status === "Inactive"
																			? "bg-blue-50"
																			: ""
																	}
																>
																	<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
																	Inactive
																</DropdownMenuItem>
															</DropdownMenuSubContent>
														</DropdownMenuSub>
														<DropdownMenuItem
															onClick={() => handleEditOffering(offering)}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															className="flex items-center gap-2 text-red-600"
															onSelect={(e) => {
																e.preventDefault();
																handleDeleteOfferingWithConfirm(offering);
															}}
														>
															<Trash2 className="h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Service Offering</DialogTitle>
					</DialogHeader>
					<div className="flex items-center gap-3 py-4">
						<AlertTriangle className="h-6 w-6 text-red-500" />
						<div>
							<p className="font-semibold text-red-700">
								Are you sure you want to delete this offering by{" "}
								<span className="font-bold">
									{offeringToDelete?.provider?.name}
								</span>
								?
							</p>
							<p className="text-sm text-gray-600 mt-1">
								This action cannot be undone.
							</p>
						</div>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDeleteOffering}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
