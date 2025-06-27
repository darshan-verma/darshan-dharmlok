"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { PoojaCategoryDetailCard } from "@/app/admin/components/pooja_category/PoojaCategoryDetailCard";
import { PoojaOfferingForm } from "@/app/admin/components/pooja_category/PoojaOfferingForm";
import { PoojaOfferingsTable } from "@/app/admin/components/pooja_category/PoojaOfferingsTable";
import {
	PoojaCategory,
	Offering,
	PanditjiUser,
} from "@/app/admin/components/pooja_category/types";

export default function PoojaCategoryDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const poojaCategoryId = params?.id as string;

	const [pooja, setPooja] = useState<PoojaCategory | null>(null);
	const [offerings, setOfferings] = useState<Offering[]>([]);
	const [allPanditjis, setAllPanditjis] = useState<PanditjiUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingOfferingId, setEditingOfferingId] = useState<string | null>(
		null
	);
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

	// Handle form submission
	const handleOfferingSubmit = async (
		providerId: string,
		price: string,
		details: string
	) => {
		if (!providerId) {
			toast.error("Please select a Panditji");
			return;
		}
		if (!price || isNaN(Number(price))) {
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
						price: Number(price),
						details: details,
				  }
				: {
						providerId: providerId,
						serviceType: "pooja",
						targetType: "PoojaCategory",
						targetId: poojaCategoryId,
						price: Number(price),
						details: details,
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

			// Reset editing state
			setEditingOfferingId(null);
		} catch (err) {
			const error = err as Error;
			toast.error(error?.message || "Failed to save offering");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle edit offering
	const handleEditOffering = (offering: Offering) => {
		setEditingOfferingId(offering.id);
		setShowDetailsAndForm(true); // Ensure form is visible when editing
	};

	// Handle delete offering
	const handleDeleteOffering = async (offering: Offering) => {
		try {
			const res = await fetch(`/api/service-offerings/${offering.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete offering");
			setOfferings((prev) => prev.filter((o) => o.id !== offering.id));
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
						<PoojaCategoryDetailCard pooja={pooja} />

						{/* Add/Edit Panditji Offering Form */}
						<PoojaOfferingForm
							allPanditjis={allPanditjis}
							offerings={offerings}
							poojaCategoryId={poojaCategoryId}
							isSubmitting={isSubmitting}
							editingOfferingId={editingOfferingId}
							onSubmit={handleOfferingSubmit}
						/>
					</div>
				</div>
			)}

			{/* Offerings Table */}
			<PoojaOfferingsTable
				offerings={offerings}
				loading={loading}
				onEdit={handleEditOffering}
				onDelete={handleDeleteOffering}
				onChangeStatus={handleChangeStatus}
			/>
		</div>
	);
}
