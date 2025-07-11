"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	PlusCircle,
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
import { useRouter } from "next/navigation";

export interface Event {
	id: string;
	title: string;
	date: string;
	category: string;
	fromDate: string;
	toDate: string;
	type: string;
	detail?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

interface EventsTableProps {
	events: Event[];
	setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
	onAddEvent?: () => void;
	onEditEvent: (event: Event) => void;
	onDeleteEvent: (id: string, title: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewEvent: (event: Event) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

// Helper for formatting date
const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export default function EventsTable({
	events,
	onAddEvent,
	onEditEvent,
	onDeleteEvent,
	onUpdateStatus,
}: EventsTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const router = useRouter();

	const filteredEvents = events.filter((event) => {
		const matchesSearch =
			event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(event.detail || "").toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || event.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || event.category === categoryFilter;

		const matchesType = typeFilter === "all" || event.type === typeFilter;

		return matchesSearch && matchesStatus && matchesCategory && matchesType;
	});

	const uniqueCategories = Array.from(new Set(events.map((e) => e.category)));
	const uniqueTypes = Array.from(new Set(events.map((e) => e.type)));

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search events..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Event Button */}
					{onAddEvent && (
						<Button onClick={onAddEvent} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Event
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* Category Filter */}
					<div className="w-40">
						<select
							className="h-8 border rounded px-2 w-full"
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
						>
							<option value="all">All Categories</option>
							{uniqueCategories.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>
					{/* Type Filter */}
					<div className="w-40">
						<select
							className="h-8 border rounded px-2 w-full"
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
						>
							<option value="all">All Types</option>
							{uniqueTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
					{/* Status Filter */}
					<div className="w-32">
						<select
							className="h-8 border rounded px-2 w-full"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="all">All Status</option>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredEvents.length} event
					{filteredEvents.length !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>From Date</TableHead>
							<TableHead>To Date</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Detail</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredEvents.length > 0 ? (
							filteredEvents.map((event) => (
								<TableRow key={event.id}>
									<TableCell className="font-medium">{event.title}</TableCell>
									<TableCell>{formatDate(event.createdAt ?? "")}</TableCell>
									<TableCell>{event.category}</TableCell>
									<TableCell>{formatDate(event.fromDate)}</TableCell>
									<TableCell>{formatDate(event.toDate)}</TableCell>
									<TableCell>{event.type}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => router.push(`/admin/events/${event.id}`)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												event.status
											)}`}
										>
											{event.status}
										</span>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Event</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(event.id, "Active")}
															className={
																event.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(event.id, "Inactive")
															}
															className={
																event.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditEvent(event)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteEvent(event.id, event.title);
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
								<TableCell colSpan={9} className="text-center py-6">
									No events found. Try a different search or add a new event.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
