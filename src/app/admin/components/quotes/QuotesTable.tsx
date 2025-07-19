"use client";

import { useState } from "react";
import Pagination from "../Pagination/Pagination";
import {
	Eye,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	PlusCircle,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Quote interface
export interface Quote {
	id: string;
	quote: string;
	date: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

interface QuotesTableProps {
	quotes: Quote[];
	setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
	onAddQuote?: () => void;
	onEditQuote: (quote: Quote) => void;
	onDeleteQuote: (id: string, quote: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewQuote: (quote: Quote) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "active" || status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export default function QuotesTable({
	quotes,
	onAddQuote,
	onEditQuote,
	onDeleteQuote,
	onUpdateStatus,
	onViewQuote,
}: QuotesTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredQuotes = quotes.filter((quote) => {
		const matchesSearch = quote.quote
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === "all" ||
			quote.status.toLowerCase() === statusFilter.toLowerCase();
		return matchesSearch && matchesStatus;
	});

	const totalItems = filteredQuotes.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedQuotes = filteredQuotes.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	if (currentPage > totalPages) setCurrentPage(1);

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search quotes..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
						/>
					</div>
					{/* Add Quote Button */}
					{onAddQuote && (
						<Button onClick={onAddQuote} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Quote
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* Status Filter */}
					<div className="w-32">
						<select
							className="h-8 border rounded px-2 w-full"
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
				</div>
				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{totalItems} quote
					{totalItems !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Quote</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedQuotes.length > 0 ? (
							paginatedQuotes.map((quote) => (
								<TableRow key={quote.id}>
									<TableCell className="font-medium max-w-xs truncate">
										{quote.quote}
									</TableCell>
									<TableCell>
										{quote.date
											? new Date(quote.date).toLocaleDateString("en-IN", {
													day: "2-digit",
													month: "short",
													year: "numeric",
											  })
											: ""}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												quote.status
											)}`}
										>
											{quote.status.charAt(0).toUpperCase() +
												quote.status.slice(1)}
										</span>
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewQuote(quote)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Quote</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(quote.id, "active")}
															className={
																quote.status.toLowerCase() === "active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(quote.id, "inactive")
															}
															className={
																quote.status.toLowerCase() === "inactive"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditQuote(quote)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteQuote(quote.id, quote.quote);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-6">
									No quotes found. Try a different search or add a new quote.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
}
