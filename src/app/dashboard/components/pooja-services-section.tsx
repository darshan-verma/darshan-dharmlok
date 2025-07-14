"use client";
import PoojaServicesTable from "./pooja-services-table";
import PoojaServicesForm from "./pooja-services-form";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type {
	PoojaCategoryOption,
	PoojaServiceFormValues,
} from "./pooja-services-form";
import type { PoojaServiceRow } from "./pooja-services-table";
import { userService } from "@/services/userService";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

export default function PoojaServicesSection() {
	const { data: session } = useSession();
	const [services, setServices] = useState<PoojaServiceRow[]>([]);
	const [categories, setCategories] = useState<PoojaCategoryOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<PoojaServiceRow | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [userProfile, setUserProfile] = useState<any>(null);

	useEffect(() => {
		if (!session?.user?.id) return;
		setLoading(true);
		// Fetch user profile, categories, and services in parallel
		Promise.all([
			userService.getUserById(session.user.id),
			fetch("/api/pooja-categories?page=1&limit=1000").then((r) => r.json()),
			fetch(
				`/api/service-offerings?providerId=${session.user.id}&targetType=PoojaCategory`
			).then((r) => r.json()),
		])
			.then(([user, catData, servData]) => {
				setUserProfile(user);
				setCategories(
					(catData.categories || []).map((c: any) => ({
						id: c.id,
						name: c.name,
					}))
				);
				setServices(
					(servData.offerings || []).map((o: any) => ({
						id: o.id,
						categoryId: o.targetId,
						categoryName:
							(catData.categories || []).find((c: any) => c.id === o.targetId)
								?.name || o.targetId,
						price: o.price,
						details: o.details,
						status: o.status || "Active",
					}))
				);
			})
			.catch(() => toast.error("Failed to load pooja services or categories"))
			.finally(() => setLoading(false));
	}, [session?.user?.id]);

	const handleAdd = () => {
		setEditing(null);
		setFormOpen(true);
	};
	const handleEdit = (service: PoojaServiceRow) => {
		setEditing(service);
		setFormOpen(true);
	};
	const handleDelete = async (service: PoojaServiceRow) => {
		if (!window.confirm("Are you sure you want to delete this service?"))
			return;
		setFormLoading(true);
		try {
			const res = await fetch(`/api/service-offerings/${service.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error();
			setServices((prev) => prev.filter((s) => s.id !== service.id));
			toast.success("Service deleted");
		} catch {
			toast.error("Failed to delete service");
		} finally {
			setFormLoading(false);
		}
	};
	const handleChangeStatus = async (
		service: PoojaServiceRow,
		newStatus: "Active" | "Inactive"
	) => {
		try {
			const res = await fetch(`/api/service-offerings/${service.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error();
			setServices((prev) =>
				prev.map((s) => (s.id === service.id ? { ...s, status: newStatus } : s))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};
	const handleFormSubmit = async (values: PoojaServiceFormValues) => {
		setFormLoading(true);
		try {
			if (editing) {
				// Edit
				const res = await fetch(`/api/service-offerings/${editing.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						price: Number(values.price),
						details: values.details,
						status: values.status,
					}),
				});
				if (!res.ok) throw new Error();
				setServices((prev) =>
					prev.map((s) =>
						s.id === editing.id
							? {
									...s,
									price: Number(values.price),
									details: values.details,
									status: values.status,
							  }
							: s
					)
				);
				toast.success("Service updated");
			} else {
				// Add
				const res = await fetch(`/api/service-offerings`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						providerId: session?.user?.id,
						serviceType: "pooja",
						targetType: "PoojaCategory",
						targetId: values.categoryId,
						price: Number(values.price),
						details: values.details,
						status: values.status,
					}),
				});
				if (!res.ok) throw new Error();
				const newService = await res.json();
				setServices((prev) => [
					...prev,
					{
						id: newService.id,
						categoryId: newService.targetId,
						categoryName:
							categories.find((c) => c.id === newService.targetId)?.name ||
							newService.targetId,
						price: newService.price,
						details: newService.details,
						status: newService.status || "Active",
					},
				]);
				toast.success("Service added");
			}
			setFormOpen(false);
			setEditing(null);
		} catch {
			toast.error("Failed to save service");
		} finally {
			setFormLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-96">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="ml-3 text-lg text-muted-foreground">
					Loading your pooja services...
				</span>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<img
							src={
								userProfile?.profileImageUrl ||
								"/uploads/placeholder-avatar.svg"
							}
							alt={userProfile?.name || "User"}
							className="w-12 h-12 rounded-full object-cover border"
						/>
						<div>
							<div className="text-lg font-semibold leading-tight">
								{userProfile?.name || "User"}
							</div>
							<div className="text-xs text-muted-foreground mt-0.5">
								{userProfile?.category || "Panditji"}
							</div>
						</div>
					</div>
				</div>
			</div>
			<PoojaServicesTable
				services={services}
				onAdd={handleAdd}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onChangeStatus={handleChangeStatus}
			/>
			<Dialog open={formOpen} onOpenChange={setFormOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Edit Service" : "Add Service"}
						</DialogTitle>
					</DialogHeader>
					<PoojaServicesForm
						categories={categories}
						initialValues={
							editing
								? {
										id: editing.id,
										categoryId: editing.categoryId,
										price: String(editing.price),
										details: editing.details,
										status: editing.status,
								  }
								: undefined
						}
						loading={formLoading}
						onSubmit={handleFormSubmit}
						onCancel={() => {
							setFormOpen(false);
							setEditing(null);
						}}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
