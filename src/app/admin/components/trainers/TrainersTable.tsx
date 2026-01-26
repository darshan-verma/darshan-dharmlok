"use client";

import { useState } from "react";
import {
	Search,
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
import Image from "next/image";

// Define the Trainer interface (based on User model with userType = "trainer")
export interface Trainer {
	id: string;
	name: string;
	email: string;
	phone: string;
	bio?: string;
	category?: string; // This will be the speciality
	coverImageUrl?: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

interface TrainersTableProps {
	trainers: Trainer[];
	setTrainers: React.Dispatch<React.SetStateAction<Trainer[]>>;
	onAddTrainer?: () => void;
	onEditTrainer: (trainer: Trainer) => void;
	onDeleteTrainer: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export default function TrainersTable({
	trainers,
	setTrainers,
	onAddTrainer,
	onEditTrainer,
	onDeleteTrainer,
	onUpdateStatus,
}: TrainersTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// State for delete confirmation dialog and loading
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		trainer?: Trainer;
	}>({ open: false });
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter trainers based on search and filter criteria
	const filteredTrainers = trainers.filter((trainer) => {
		// Apply search filter
		const matchesSearch =
			trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			trainer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			trainer.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			trainer.email.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || trainer.status === statusFilter;

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
							placeholder="Search trainers..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Trainer Button */}
					{onAddTrainer && (
						<Button onClick={onAddTrainer} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Trainer
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
					{filteredTrainers.length} trainer
					{filteredTrainers.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Cover Image</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Speciality</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTrainers.length > 0 ? (
							filteredTrainers.map((trainer) => (
								<TableRow key={trainer.id}>
									<TableCell>
										<div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
											{trainer.coverImageUrl ? (
												<Image
													src={trainer.coverImageUrl}
													alt={trainer.name}
													width={64}
													height={64}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
													<span className="text-gray-600 text-sm font-medium">
														{trainer.name.charAt(0).toUpperCase()}
													</span>
												</div>
											)}
										</div>
									</TableCell>
									<TableCell className="font-medium">{trainer.name}</TableCell>
									<TableCell>{trainer.category || "N/A"}</TableCell>
									<TableCell>
										<div className="max-w-xs truncate">
											{trainer.bio || "No description available"}
										</div>
									</TableCell>
									<TableCell>{trainer.email}</TableCell>
									<TableCell>{trainer.phone}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												trainer.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{trainer.status}
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
												<DropdownMenuLabel>Manage Trainer</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(trainer.id, "Active")
															}
															className={
																trainer.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(trainer.id, "Inactive")
															}
															className={
																trainer.status === "Inactive"
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
													onClick={() => onEditTrainer(trainer)}
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
															trainer,
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
									No trainers found. Try a different search or add a new
									trainer.
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
						<DialogTitle>Delete Trainer</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete &ldquo;
							{deleteDialog.trainer?.name}
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
								if (deleteDialog.trainer) {
									setIsDeleteLoading(true);
									try {
										const res = await fetch(
											`/api/trainers?id=${deleteDialog.trainer.id}`,
											{
												method: "DELETE",
											}
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted trainer from local state immediately
										setTrainers((prev: Trainer[]) =>
											prev.filter(
												(t: Trainer) => t.id !== deleteDialog.trainer!.id
											)
										);
										onDeleteTrainer(
											deleteDialog.trainer.id,
											deleteDialog.trainer.name
										);
										setDeleteDialog({ open: false, trainer: undefined });
										setIsDeleteLoading(false);
										toastSuccess("Trainer deleted successfully");
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
