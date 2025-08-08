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
import DharmguruTable, {
	Dharmguru,
} from "../components/dharmguru/DharmguruTable";
import DharmguruForm from "../components/dharmguru/DharmguruForm";
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

export default function DharmguruPage() {
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

	const [dharmgurus, setDharmgurus] = useState<Dharmguru[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentDharmguru, setCurrentDharmguru] =
		useState<Partial<Dharmguru> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	// Delete dialog logic is now handled in DharmguruTable

	// Fetch dharmgurus on component mount
	useEffect(() => {
		const fetchDharmgurus = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/users?userType=Dharmguru&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match Dharmguru structure
				const mappedDharmgurus = data.users.map((user: UserData) => ({
					id: user.id,
					name: user.name || "",
					category: user.category || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					rank: user.rank || "",
					isApproved: user.kycApproved || false,
				}));

				setDharmgurus(mappedDharmgurus);
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load dharmgurus");
			} finally {
				setLoading(false);
			}
		};

		fetchDharmgurus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddDharmguru = () => {
		setCurrentDharmguru(null);
		setIsFormOpen(true);
	};

	const handleEditDharmguru = (dharmguru: Dharmguru) => {
		// Ensure rank is properly passed as a string
		const dharmguruWithStringRank = {
			...dharmguru,
			rank: dharmguru.rank || "", // Ensure rank is a string
		};
		setCurrentDharmguru(dharmguruWithStringRank);
		setIsFormOpen(true);
	};

	// Delete logic is now handled in DharmguruTable

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
			setDharmgurus(
				dharmgurus.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
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
			setDharmgurus(
				dharmgurus.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`Dharmguru ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsDharmguru = (dharmguru: Dharmguru) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${dharmguru.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${kathavachak.id}`);
	};

	const handleFormSubmit = async (dharmguruData: Omit<Dharmguru, "id">) => {
		try {
			const url = currentDharmguru?.id
				? `/api/users/${currentDharmguru.id}`
				: "/api/users";

			const method = currentDharmguru?.id ? "PUT" : "POST";

			// Ensure rank is included in the request data
			const requestData = {
				...(currentDharmguru?.id && { id: currentDharmguru.id }),
				...dharmguruData,
				userType: "Dharmguru",
				isApproved: dharmguruData.isApproved || false,
				rank: dharmguruData.rank || "", // Ensure rank is explicitly set
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				throw new Error("Failed to save kathavachak");
			}

			// const data = await response.json();

			// Refresh the kathavachaks list
			const fetchResponse = await fetch(
				`/api/users?userType=Dharmguru&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated dharmgurus");
			}
			const { users } = await fetchResponse.json();

			// Map the user data to match Kathavachak structure
			const mappedDharmgurus = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				category: user.category || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Active",
				rank: user.rank || "",
				isApproved: user.kycApproved || false,
			}));

			setDharmgurus(mappedDharmgurus);

			toast.success(
				currentDharmguru?.id
					? "Dharmguru updated successfully"
					: "Dharmguru created successfully"
			);

			setIsFormOpen(false);
			toast.success(
				currentDharmguru?.id
					? "Dharmguru updated successfully"
					: "Dharmguru created successfully"
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
				toast.error(error.message || "Failed to save kathavachak");
			} else {
				toast.error("Failed to save kathavachak");
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
			<h1 className="text-2xl font-bold mb-6">Dharmguru Management</h1>

			<DharmguruTable
				dharmgurus={dharmgurus}
				setDharmgurus={setDharmgurus}
				onAddDharmguru={handleAddDharmguru}
				onEditDharmguru={handleEditDharmguru}
				onDeleteDharmguru={() => {}} // No-op, handled in table
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsDharmguru={handleLoginAsDharmguru}
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
							{currentDharmguru?.id ? "Edit Dharmguru" : "Add New Dharmguru"}
						</DialogTitle>
					</DialogHeader>
					<DharmguruForm
						initialData={currentDharmguru || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
