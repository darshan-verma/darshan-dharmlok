"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import CouponTable, { Coupon } from "../components/coupon/CouponTable";
import CouponForm from "../components/coupon/CouponForm";

export default function CouponPage() {
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [couponToDelete, setCouponToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch coupons on mount
	useEffect(() => {
		const fetchCoupons = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/coupon");
				if (!response.ok) throw new Error("Failed to fetch coupons");
				const data = await response.json();
				setCoupons(data);
			} catch {
				toast.error("Failed to load coupons");
			} finally {
				setLoading(false);
			}
		};
		fetchCoupons();
	}, []);

	const handleAddCoupon = () => {
		setCurrentCoupon(null);
		setIsFormOpen(true);
	};

	const handleEditCoupon = (coupon: Coupon) => {
		setCurrentCoupon(coupon);
		setIsFormOpen(true);
	};

	const handleDeleteCoupon = (id: string, name: string) => {
		setCouponToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!couponToDelete) return;
		try {
			const response = await fetch(`/api/coupon/${couponToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error();
			setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
			toast.success(`${couponToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete coupon");
		} finally {
			setIsDeleteDialogOpen(false);
			setCouponToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/coupon/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setCoupons((prev) =>
				prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleFormSubmit = async (data: Omit<Coupon, "id">) => {
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: Coupon;
			if (currentCoupon && currentCoupon.id) {
				response = await fetch(`/api/coupon/${currentCoupon.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setCoupons((prev) =>
					prev.map((c) => (c.id === currentCoupon.id ? saved : c))
				);
				toast.success("Coupon updated");
			} else {
				response = await fetch("/api/coupon", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setCoupons((prev) => [saved, ...prev]);
				toast.success("Coupon added");
			}
			setIsFormOpen(false);
			setCurrentCoupon(null);
		} catch {
			toast.error("Failed to save coupon");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">Coupon Management</h1>
			<CouponTable
				coupons={coupons}
				setCoupons={setCoupons}
				onAddCoupon={handleAddCoupon}
				onEditCoupon={handleEditCoupon}
				onDeleteCoupon={handleDeleteCoupon}
				onUpdateStatus={handleUpdateStatus}
			/>
			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentCoupon?.id ? "Edit Coupon" : "Add New Coupon"}
						</DialogTitle>
					</DialogHeader>
					<CouponForm
						initialData={currentCoupon || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {couponToDelete?.name}? This
							action cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<button
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							onClick={confirmDelete}
						>
							Delete
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
