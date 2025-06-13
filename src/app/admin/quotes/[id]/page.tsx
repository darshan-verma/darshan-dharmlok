"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";

type Quote = {
	id: string;
	quote: string;
	date: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
};

type Errors = {
	quote?: string;
	date?: string;
	status?: string;
};

const statusOptions = [
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];

const getStatusColor = (status: string) =>
	status.toLowerCase() === "active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export default function QuoteDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const quoteId = params?.id as string;

	const [quote, setQuote] = useState<Quote | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedQuote, setEditedQuote] = useState<Quote | null>(null);
	const [errors, setErrors] = useState<Errors>({});

	const fetchQuoteData = useCallback(async () => {
		try {
			if (quoteId && !/^[0-9a-fA-F]{24}$/.test(quoteId)) {
				toast.error("Invalid Quote ID format");
				router.push("/admin/quotes");
				return;
			}
			const loadingToast = toast.loading("Loading quote details...");
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);
			try {
				const response = await fetch(`/api/quotes/${quoteId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);
				if (!response.ok) throw new Error("Failed to fetch quote");
				const quoteData = await response.json();
				setQuote(quoteData);
				setEditedQuote({ ...quoteData });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load quote details"
			);
			router.push("/admin/quotes");
		}
	}, [quoteId, router]);

	useEffect(() => {
		if (quoteId) fetchQuoteData();
	}, [quoteId, fetchQuoteData]);

	const validateForm = (data: Quote): boolean => {
		const newErrors: Errors = {};
		if (!data.quote?.trim()) newErrors.quote = "Quote is required";
		if (!data.date?.trim()) newErrors.date = "Date is required";
		if (!data.status) newErrors.status = "Status is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedQuote) return;
		if (!validateForm(editedQuote)) return;
		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");
		try {
			const dataToSave = {
				quote: editedQuote.quote,
				date: editedQuote.date,
				status: editedQuote.status,
			};
			const response = await fetch(`/api/quotes/${quoteId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) throw new Error("Failed to update quote");
			const updatedQuote = await response.json();
			setQuote(updatedQuote);
			setEditedQuote(updatedQuote);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Quote updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update quote"
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
		}).format(date);
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/quotes")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Quote Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<CardTitle className="text-center text-lg">Quote</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									quote
										? getStatusColor(quote.status)
										: "bg-red-100 text-red-800"
								}`}
							>
								{quote?.status
									? quote.status.charAt(0).toUpperCase() + quote.status.slice(1)
									: "Unknown"}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Date:</span>
							<span>{quote?.date ? formatDate(quote.date) : "N/A"}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Created:</span>
							<span>
								{quote?.createdAt ? formatDate(quote.createdAt) : "N/A"}
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Updated:</span>
							<span>
								{quote?.updatedAt ? formatDate(quote.updatedAt) : "N/A"}
							</span>
						</div>
					</CardContent>
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Quote"}
						</Button>
					</CardFooter>
				</Card>
				<div>
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-1 mb-4">
							<TabsTrigger value="details">Quote Details</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Quote Information</CardTitle>
									<CardDescription>
										Update quote details and status.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="quote">Quote *</Label>
												<Textarea
													id="quote"
													value={editedQuote?.quote || ""}
													onChange={(e) =>
														setEditedQuote((prev) =>
															prev ? { ...prev, quote: e.target.value } : prev
														)
													}
													rows={3}
													className={errors.quote ? "border-red-500" : ""}
												/>
												{errors.quote && (
													<p className="text-sm text-red-500">{errors.quote}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="date">Date *</Label>
												<Input
													id="date"
													type="date"
													value={editedQuote?.date || ""}
													onChange={(e) =>
														setEditedQuote((prev) =>
															prev ? { ...prev, date: e.target.value } : prev
														)
													}
													className={errors.date ? "border-red-500" : ""}
												/>
												{errors.date && (
													<p className="text-sm text-red-500">{errors.date}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="status">Status *</Label>
												<Select
													value={editedQuote?.status || ""}
													onValueChange={(value) =>
														setEditedQuote((prev) =>
															prev ? { ...prev, status: value } : prev
														)
													}
												>
													<SelectTrigger id="status">
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
													<SelectContent>
														{statusOptions.map((status) => (
															<SelectItem
																key={status.value}
																value={status.value}
															>
																{status.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{errors.status && (
													<p className="text-sm text-red-500">
														{errors.status}
													</p>
												)}
											</div>
										</div>
									) : (
										<div className="space-y-6">
											<div className="space-y-2">
												<h3 className="text-sm font-medium text-muted-foreground">
													Quote
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{quote?.quote || "No quote provided"}
												</p>
											</div>
											<div className="space-y-2">
												<h3 className="text-sm font-medium text-muted-foreground">
													Status
												</h3>
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
														quote?.status || ""
													)}`}
												>
													{quote?.status
														? quote.status.charAt(0).toUpperCase() +
														  quote.status.slice(1)
														: ""}
												</span>
											</div>
											<div className="space-y-2">
												<h3 className="text-sm font-medium text-muted-foreground">
													Date
												</h3>
												<p className="font-medium text-foreground">
													{quote?.date ? formatDate(quote.date) : "N/A"}
												</p>
											</div>
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
					</Tabs>
				</div>
			</div>
		</div>
	);
}
