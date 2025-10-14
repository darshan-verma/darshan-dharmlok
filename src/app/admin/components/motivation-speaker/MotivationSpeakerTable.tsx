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

// Define the MotivationSpeaker interface
export interface MotivationSpeaker {
	id: string;
	name: string;
	date: Date;
	phone: string;
	email: string;
	timings: string;
	category: string;
	status: string;
	coverImage?: string;
	bannerImage?: string;
	profileImage?: string;
	images: string[];
	videos: string[];
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface MotivationSpeakerTableProps {
	speakers: MotivationSpeaker[];
	setSpeakers: React.Dispatch<React.SetStateAction<MotivationSpeaker[]>>;
	onAddSpeaker?: () => void;
	onEditSpeaker: (speaker: MotivationSpeaker) => void;
	onDeleteSpeaker: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export default function MotivationSpeakerTable({
	speakers,
	setSpeakers,
	onAddSpeaker,
	onEditSpeaker,
	onDeleteSpeaker,
	onUpdateStatus,
}: MotivationSpeakerTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// State for delete confirmation dialog and loading
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		speaker?: MotivationSpeaker;
	}>({ open: false });
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter speakers based on search and filter criteria
	const filteredSpeakers = speakers.filter((speaker) => {
		// Apply search filter
		const matchesSearch =
			speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			speaker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			speaker.phone.includes(searchTerm) ||
			speaker.category.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || speaker.status === statusFilter;

		return matchesSearch && matchesStatus;
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
							placeholder="Search speakers..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Speaker Button */}
					{onAddSpeaker && (
						<Button onClick={onAddSpeaker} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Speaker
						</Button>
					)}
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
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
					{filteredSpeakers.length} speaker
					{filteredSpeakers.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Timings</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSpeakers.length > 0 ? (
							filteredSpeakers.map((speaker) => (
								<TableRow key={speaker.id}>
									<TableCell className="font-medium">{speaker.name}</TableCell>
									<TableCell>
										{new Date(speaker.date).toLocaleDateString()}
									</TableCell>
									<TableCell>{speaker.phone}</TableCell>
									<TableCell>{speaker.email}</TableCell>
									<TableCell>{speaker.timings}</TableCell>
									<TableCell>{speaker.category}</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/motivation-speaker/${speaker.id}`}>
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
												<DropdownMenuLabel>Manage Speaker</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(speaker.id, "Active")
															}
															className={
																speaker.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(speaker.id, "Inactive")
															}
															className={
																speaker.status === "Inactive"
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
													onClick={() => onEditSpeaker(speaker)}
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
															speaker,
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
								<TableCell colSpan={8} className="text-center py-6">
									No speakers found. Try a different search or add a new
									speaker.
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
						<DialogTitle>Delete Speaker</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete &ldquo;
							{deleteDialog.speaker?.name}
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
								if (deleteDialog.speaker) {
									setIsDeleteLoading(true);
									try {
										const res = await fetch(
											`/api/motivation-speaker/${deleteDialog.speaker.id}`,
											{
												method: "DELETE",
											}
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted speaker from local state immediately
										setSpeakers((prev: MotivationSpeaker[]) =>
											prev.filter(
												(s: MotivationSpeaker) =>
													s.id !== deleteDialog.speaker!.id
											)
										);
										onDeleteSpeaker(
											deleteDialog.speaker.id,
											deleteDialog.speaker.name
										);
										setDeleteDialog({ open: false, speaker: undefined });
										setIsDeleteLoading(false);
										toastSuccess("Speaker deleted successfully");
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
