"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import {
	Eye,
	Edit,
	Save,
	PlusCircle,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
	metadata?: Record<string, any>;
}

interface PanditjiUser {
	id: string;
	name: string;
	email?: string;
}

export default function PoojaCategoryDetailsPage() {
	const params = useParams();
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

	// Replace with actual logged-in Panditji id from auth context/session
	const loggedInPanditjiId = "panditji-logged-in-id";

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

	// Filter Panditji dropdown by search
	const filteredPanditjis = allPanditjis.filter(
		(p) =>
			p.name.toLowerCase().includes(panditjiSearch.toLowerCase()) ||
			(p.email?.toLowerCase().includes(panditjiSearch.toLowerCase()) ?? false)
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
		} catch (err: any) {
			toast.error(err?.message || "Failed to save offering");
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

	// Handle delete
	const handleDeleteOffering = async (id: string) => {
		if (!window.confirm("Are you sure you want to delete this offering?"))
			return;
		try {
			const res = await fetch(`/api/service-offerings/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete offering");
			setOfferings((prev) => prev.filter((o) => o.id !== id));
			toast.success("Offering deleted");
		} catch {
			toast.error("Failed to delete offering");
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
			{/* Pooja Category Details */}
			<Card>
				<CardHeader>
					<CardTitle>{pooja?.name || "Pooja Category"}</CardTitle>
					<CardDescription>{pooja?.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					<div>
						<strong>Date:</strong>{" "}
						{pooja?.date ? new Date(pooja.date).toLocaleDateString() : "-"}
					</div>
					<div>
						<strong>Price:</strong>{" "}
						{typeof pooja?.price === "number" ? `₹${pooja.price}` : "-"}
					</div>
					<div>
						<strong>Status:</strong>{" "}
						<span
							className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
								pooja?.status === "Active"
									? "bg-green-100 text-green-800"
									: "bg-red-100 text-red-800"
							}`}
						>
							{pooja?.status === "Active" ? "Active" : "Inactive"}
						</span>
					</div>
					<div>
						<strong>Details:</strong> {pooja?.details || "-"}
					</div>
				</CardContent>
			</Card>

			{/* Admin: Add/Edit Panditji Offering */}
			<Card>
				<CardHeader>
					<CardTitle>
						{editingOfferingId
							? "Edit Panditji Offering"
							: "Add Panditji Offering"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleOfferingSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Select Panditji <span className="text-red-500">*</span>
							</label>
							<Input
								type="search"
								placeholder="Search Panditji by name or email"
								value={panditjiSearch}
								onChange={(e) => setPanditjiSearch(e.target.value)}
								className="mb-2"
								disabled={!!editingOfferingId}
							/>
							<Select
								value={selectedPanditjiId}
								onValueChange={setSelectedPanditjiId}
								disabled={!!editingOfferingId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Panditji" />
								</SelectTrigger>
								<SelectContent>
									{/* Only render SelectItem if there are results */}
									{filteredPanditjis.length === 0 ? (
										<div className="px-3 py-2 text-gray-500 text-sm select-none">
											No Panditji found
										</div>
									) : (
										filteredPanditjis.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name} {p.email ? `(${p.email})` : ""}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
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
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Details</label>
							<Textarea
								value={formDetails}
								onChange={(e) => setFormDetails(e.target.value)}
								placeholder="Describe the service"
								rows={3}
							/>
						</div>
						<Button type="submit" disabled={isSubmitting}>
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

			{/* Offerings Table */}
			<Card>
				<CardHeader>
					<CardTitle>Panditji Offerings</CardTitle>
				</CardHeader>
				<CardContent>
					{offerings.length === 0 ? (
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
															<Activity className="h-5 w-5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>Actions</DropdownMenuLabel>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleEditOffering(offering)}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleChangeStatus(offering)}
														>
															{offering.status === "Active" ? (
																<>
																	<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
																	Mark Inactive
																</>
															) : (
																<>
																	<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
																	Mark Active
																</>
															)}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleDeleteOffering(offering.id)}
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 mr-2" />
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
		</div>
	);
}
