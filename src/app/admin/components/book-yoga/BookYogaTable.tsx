"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	PlusCircle,
	Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toastSuccess, toastError } from "@/lib/toast";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import {
	matchesReligiousFilter,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

// Define the YogaSession interface
export interface YogaSession {
	id: string;
	trainerId: string;
	trainerName: string;
	name: string;
	date: Date;
	serviceType: string;
	description: string;
	status: string;
	religiousCategories?: ReligiousCategory[];
	bannerImage?: string;
	coverImage?: string;
	images: string[];
	videos: string[];
	price?: number;
	duration?: number;
	capacity?: number;
	createdAt: Date;
	updatedAt: Date;
}

interface BookYogaTableProps {
	yogaSessions: YogaSession[];
	setYogaSessions: React.Dispatch<React.SetStateAction<YogaSession[]>>;
	onAddSession?: () => void;
	onEditSession: (session: YogaSession) => void;
	onDeleteSession: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export default function BookYogaTable({
	yogaSessions,
	setYogaSessions,
	onAddSession,
	onEditSession,
	onDeleteSession,
	onUpdateStatus,
}: BookYogaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");

	// State for delete confirmation dialog and loading
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		session?: YogaSession;
	}>({ open: false });
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter yoga sessions based on search and filter criteria
	const filteredSessions = yogaSessions.filter((session) => {
		// Apply search filter
		const matchesSearch =
			session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			session.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			session.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
			session.description.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || session.status === statusFilter;

		const matchesReligious = matchesReligiousFilter(
			resolveReligiousCategories(session),
			religiousFilter === "all" ? null : religiousFilter
		);

		return matchesSearch && matchesStatus && matchesReligious;
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search sessions..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Session Button */}
					{onAddSession && (
						<Button onClick={onAddSession} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Session
						</Button>
					)}
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<ReligiousCategoryFilter
						value={religiousFilter}
						onChange={setReligiousFilter}
						page="admin-book-yoga"
						variant="select" hideLabel allLabel="All Traditions" className="w-44"
					/>
					{/* Status Filter */}
					<div className="w-32">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="Active">Active</SelectItem>
								<SelectItem value="Inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredSessions.length} session
					{filteredSessions.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Trainer Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Service Type</TableHead>
							<TableHead>Religion</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSessions.length > 0 ? (
							filteredSessions.map((session) => (
								<TableRow key={session.id}>
									<TableCell className="font-medium">
										{session.trainerName}
									</TableCell>
									<TableCell>
										{new Date(session.date).toLocaleDateString()}
									</TableCell>
									<TableCell>{session.serviceType}</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={session.religiousCategories}
										/>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												session.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{session.status}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/book-yoga/${session.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
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
												<DropdownMenuLabel>Manage Session</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(session.id, "Active")
															}
															className={
																session.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(session.id, "Inactive")
															}
															className={
																session.status === "Inactive"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem
													onClick={() => onEditSession(session)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={async (e) => {
														e.preventDefault();
														setDeleteDialog({
															open: true,
															session,
														});
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
								<TableCell colSpan={7} className="text-center py-6">
									No sessions found. Try a different search or add a new
									session.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialog.open}
				onOpenChange={(open) => {
					if (!open) setDeleteDialog({ open: false });
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Yoga Session</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete &ldquo;
							{deleteDialog.session?.name}
							&rdquo;? This action cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setDeleteDialog({ open: false })}
							disabled={isDeleteLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isDeleteLoading}
							onClick={async () => {
								if (deleteDialog.session) {
									setIsDeleteLoading(true);
									try {
										const res = await fetch(
											`/api/yoga-sessions/${deleteDialog.session.id}`,
											{
												method: "DELETE",
											}
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted session from local state immediately
										setYogaSessions((prev: YogaSession[]) =>
											prev.filter(
												(s: YogaSession) => s.id !== deleteDialog.session!.id
											)
										);
										onDeleteSession(
											deleteDialog.session.id,
											deleteDialog.session.name
										);
										setDeleteDialog({ open: false, session: undefined });
										setIsDeleteLoading(false);
										toastSuccess("Yoga session deleted successfully");
									} catch {
										setIsDeleteLoading(false);
										toastError("Delete failed");
									}
								}
							}}
						>
							{isDeleteLoading ? "Deleting..." : "Confirm Delete"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
