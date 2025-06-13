"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import QuotesTable, { Quote } from "../components/quotes/QuotesTable";
import QuotesForm, { QuoteFormData } from "../components/quotes/QuotesForm";

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function QuotesPage() {
	const [quotes, setQuotes] = useState<Quote[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentQuote, setCurrentQuote] = useState<Partial<Quote> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [quoteToDelete, setQuoteToDelete] = useState<{
		id: string;
		quote: string;
	} | null>(null);

	// Fetch quotes on mount
	useEffect(() => {
		const fetchQuotes = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/quotes`);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const data = await response.json();
				setQuotes(data.content || []);
			} catch {
				toast.error("Failed to load quotes");
			} finally {
				setLoading(false);
			}
		};
		fetchQuotes();
	}, []);

	const handleAddQuote = () => {
		setCurrentQuote(null);
		setIsFormOpen(true);
	};

	const handleEditQuote = (quote: Quote) => {
		setCurrentQuote(quote);
		setIsFormOpen(true);
	};

	const handleDeleteQuote = (id: string, quote: string) => {
		setQuoteToDelete({ id, quote });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!quoteToDelete) return;
		try {
			const response = await fetch(`/api/quotes/${quoteToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setQuotes(quotes.filter((q) => q.id !== quoteToDelete.id));
			toast.success("Quote deleted");
		} catch {
			toast.error("Failed to delete quote");
		} finally {
			setIsDeleteDialogOpen(false);
			setQuoteToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/quotes/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setQuotes(
				quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewQuote = (quote: Quote) => {
		window.location.href = `/admin/quotes/${quote.id}`;
	};

	const handleFormSubmit = async (quoteData: QuoteFormData) => {
		setIsSubmitting(true);
		const loadingToastId = toast.loading(
			currentQuote?.id ? "Updating quote..." : "Creating quote..."
		);
		try {
			const url = currentQuote?.id
				? `/api/quotes/${currentQuote.id}`
				: "/api/quotes";
			const method = currentQuote?.id ? "PUT" : "POST";
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(quoteData),
			});
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: "Failed to save quote" }));
				throw new Error(
					errorData.error || errorData.message || "Failed to save quote"
				);
			}
			const savedQuote = await response.json();
			if (currentQuote?.id) {
				setQuotes(
					quotes.map((q) => (q.id === currentQuote.id ? savedQuote : q))
				);
			} else {
				setQuotes([savedQuote, ...quotes]);
			}
			toast.dismiss(loadingToastId);
			toast.success(
				currentQuote?.id
					? "Quote updated successfully"
					: "Quote created successfully"
			);
			setIsFormOpen(false);
			setCurrentQuote(null);
		} catch (error: unknown) {
			toast.dismiss(loadingToastId);
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
				toast.error(error.message || "Failed to save quote");
			} else {
				toast.error("Failed to save quote");
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
			<h1 className="text-2xl font-bold mb-6">Quotes Management</h1>

			<QuotesTable
				quotes={quotes}
				setQuotes={setQuotes}
				onAddQuote={handleAddQuote}
				onEditQuote={handleEditQuote}
				onDeleteQuote={handleDeleteQuote}
				onUpdateStatus={handleUpdateStatus}
				onViewQuote={handleViewQuote}
			/>

			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentQuote?.id ? "Edit Quote" : "Add New Quote"}
						</DialogTitle>
					</DialogHeader>
					<QuotesForm
						initialData={currentQuote || undefined}
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
							Are you sure you want to delete this quote? This action cannot be
							undone.
						</p>
						<p className="text-gray-600 mt-2 break-all">
							{quoteToDelete?.quote}
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
