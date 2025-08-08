"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import PanditjiTable, { Panditji } from "../components/panditji/PanditjiTable";
import PanditjiForm from "../components/panditji/PanditjiForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface UserData {
	id: string;
	name?: string;
	category?: string;
	phone?: string;
	email?: string;
	status?: string;
	rank?: string;
	kycApproved?: boolean | number;
}
export default function PanditjiPage() {
	interface ApiErrorResponse {
		details?: Record<string, unknown> | string[];
		message?: string;
	}
	const router = useRouter();
	const searchParams = useSearchParams();

	// Read page from URL query, default to 1
	const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
	const [pagination, handlePageChangeRaw, updatePagination] = usePagination(
		pageFromUrl,
		12
	);

	// When page changes, update the URL
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		params.set("page", String(page));
		router.replace(`?${params.toString()}`);
		handlePageChangeRaw(page);
	};

	// Keep pagination in sync if URL changes (e.g., browser navigation)
	useEffect(() => {
		const urlPage = parseInt(searchParams.get("page") || "1", 10);
		if (urlPage !== pagination.currentPage) {
			handlePageChangeRaw(urlPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const [panditjis, setPanditjis] = useState<Panditji[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentPanditji, setCurrentPanditji] =
		useState<Partial<Panditji> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	// Delete dialog logic is now handled in PanditjiTable

	// Fetch panditjis on component mount
	useEffect(() => {
		const fetchPanditjis = async () => {
			setLoading(true);
			try {
				// First try to fetch with the standard "Panditji" format
				const response = await fetch(
					`/api/users?userType=Panditji&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Check if users array exists and has items
				if (!data.users || data.users.length === 0) {
					// Try to fetch with the alternative "Pandit Ji" format as a fallback
					const altResponse = await fetch(
						`/api/users?userType=Pandit Ji&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
					);

					if (!altResponse.ok) {
						setPanditjis([]);
						setLoading(false);
						return;
					}

					const altData = await altResponse.json();

					if (!altData.users || altData.users.length === 0) {
						setPanditjis([]);
						setLoading(false);
						return;
					}

					// Map the alternative format user data
					const mappedPanditjis = altData.users.map((user: UserData) => ({
						id: user.id,
						name: user.name || "",
						category: user.category || "",
						phone: user.phone || "",
						email: user.email || "",
						status: user.status || "Inactive",
						rank: user.rank || "",
						isApproved: user.kycApproved || false,
					}));

					setPanditjis(mappedPanditjis);
				} else {
					// Map the user data to match Panditji structure
					const mappedPanditjis = data.users.map((user: UserData) => ({
						id: user.id,
						name: user.name || "",
						category: user.category || "",
						phone: user.phone || "",
						email: user.email || "",
						status: user.status || "Inactive",
						rank: user.rank || "",
						isApproved: user.kycApproved || false,
					}));

					setPanditjis(mappedPanditjis);
				}
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load panditjis");
			} finally {
				setLoading(false);
			}
		};

		fetchPanditjis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddPanditji = () => {
		setCurrentPanditji(null);
		setIsFormOpen(true);
	};

	const handleEditPanditji = (panditji: Panditji) => {
		// Ensure rank is properly passed as a string
		const panditjiWithStringRank = {
			...panditji,
			rank: panditji.rank || "", // Ensure rank is a string
		};
		setCurrentPanditji(panditjiWithStringRank);
		setIsFormOpen(true);
	};

	// Delete logic is now handled in PanditjiTable

	// confirmDelete and related state removed; handled in PanditjiTable

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Call the API to update user status
			const response = await fetch(`/api/users/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: id, status: newStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setPanditjis(
				panditjis.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleToggleApproval = async (id: string, currentStatus: boolean) => {
		try {
			// Call the API to update user KYC approval status
			const response = await fetch(`/api/users/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kycApproved: !currentStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setPanditjis(
				panditjis.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`Panditji ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsPanditji = (panditji: Panditji) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${panditji.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${panditji.id}`);
	};

	const handleFormSubmit = async (panditjiData: Omit<Panditji, "id">) => {
		setIsSubmitting(true);
		try {
			const url = currentPanditji?.id
				? `/api/users/${currentPanditji.id}`
				: "/api/users";

			const method = currentPanditji?.id ? "PUT" : "POST";

			// Ensure rank is included in the request data
			const requestData = {
				...(currentPanditji?.id && { id: currentPanditji.id }),
				...panditjiData,
				userType: "Panditji", // Explicitly set userType to "Panditji" (no space)
				isApproved: panditjiData.isApproved || false,
				rank: panditjiData.rank || "", // Ensure rank is explicitly set
				kycApproved: panditjiData.isApproved || false, // Ensure kycApproved is set to match isApproved
			};

			console.log("Sending request data:", requestData);

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("API error response:", errorData);
				throw new Error("Failed to save panditji");
			}

			// Refresh the panditjis list
			const fetchResponse = await fetch(
				`/api/users?userType=Panditji&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated panditjis");
			}
			const { users } = await fetchResponse.json();
			console.log("Refreshed users data:", users);

			// Map the user data to match Panditji structure
			const mappedPanditjis = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				category: user.category || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Inactive",
				rank: user.rank || "",
				isApproved: user.kycApproved || false,
			}));

			setPanditjis(mappedPanditjis);
			setIsFormOpen(false);
			toast.success(
				currentPanditji?.id
					? "Panditji updated successfully"
					: "Panditji created successfully"
			);
		} catch (error: unknown) {
			// Type guard for error with 'details'
			if (typeof error === "object" && error !== null && "details" in error) {
				const err = error as ApiErrorResponse;
				if (Array.isArray(err.details)) {
					err.details.forEach((message) => {
						toast.error(String(message));
					});
				} else if (err.details && typeof err.details === "object") {
					Object.values(err.details).forEach((message) => {
						toast.error(String(message));
					});
				}
			} else if (error instanceof Error) {
				toast.error(error.message || "Failed to save panditji");
			} else {
				toast.error("Failed to save panditji");
			}
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
			<h1 className="text-2xl font-bold mb-6">Panditji Management</h1>

			<PanditjiTable
				panditjis={panditjis}
				setPanditjis={setPanditjis}
				onAddPanditji={handleAddPanditji}
				onEditPanditji={handleEditPanditji}
				onDeletePanditji={() => {}} // No-op, handled in table
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsPanditji={handleLoginAsPanditji}
			/>

			<Pagination
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				itemsPerPage={pagination.itemsPerPage}
				onPageChange={handlePageChange}
			/>

			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentPanditji?.id ? "Edit Panditji" : "Add New Panditji"}
						</DialogTitle>
					</DialogHeader>
					<PanditjiForm
						initialData={currentPanditji || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
