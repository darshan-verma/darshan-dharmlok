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

// Define the Yoga interface
export interface YogaImage {
	url: string;
	caption?: string;
	alt?: string;
	order: number;
}

export interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	images: YogaImage[];
	videos: string[];
	coverImage?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface YogaTableProps {
	yogas: Yoga[];
	setYogas: React.Dispatch<React.SetStateAction<Yoga[]>>;
	onAddYoga?: () => void;
	onEditYoga: (yoga: Yoga) => void;
	onDeleteYoga: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export default function YogaTable({
	yogas,
	setYogas,
	onAddYoga,
	onEditYoga,
	onDeleteYoga,
	onUpdateStatus,
}: YogaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// State for delete confirmation dialog and loading
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		yoga?: Yoga;
	}>({ open: false });
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	// Filter yogas based on search and filter criteria
	const filteredYogas = yogas.filter((yoga) => {
		// Apply search filter
		const matchesSearch =
			yoga.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			yoga.description.toLowerCase().includes(searchTerm.toLowerCase());

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || yoga.status === statusFilter;

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
							placeholder="Search yogas..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Yoga Button */}
					{onAddYoga && (
						<Button onClick={onAddYoga} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Yoga
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
					{filteredYogas.length} yoga{filteredYogas.length !== 1 ? "s" : ""}{" "}
					found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Yoga Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredYogas.length > 0 ? (
							filteredYogas.map((yoga) => (
								<TableRow key={yoga.id}>
									<TableCell className="font-medium">{yoga.name}</TableCell>
									<TableCell>
										{new Date(yoga.date).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<div className="max-w-xs truncate">{yoga.description}</div>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												yoga.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{yoga.status}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/yoga/${yoga.id}`}>
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
												<DropdownMenuLabel>Manage Yoga</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(yoga.id, "Active")}
															className={
																yoga.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(yoga.id, "Inactive")
															}
															className={
																yoga.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditYoga(yoga)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={async (e) => {
														e.preventDefault();
														setDeleteDialog({
															open: true,
															yoga,
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
								<TableCell colSpan={6} className="text-center py-6">
									No yogas found. Try a different search or add a new yoga.
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
						<DialogTitle>Delete Yoga</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete &ldquo;{deleteDialog.yoga?.name}
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
								if (deleteDialog.yoga) {
									setIsDeleteLoading(true);
									try {
										const res = await fetch(
											`/api/yoga/${deleteDialog.yoga.id}`,
											{
												method: "DELETE",
											}
										);
										if (!res.ok) throw new Error("Delete failed");
										// Remove deleted yoga from local state immediately
										setYogas((prev: Yoga[]) =>
											prev.filter((y: Yoga) => y.id !== deleteDialog.yoga!.id)
										);
										onDeleteYoga(deleteDialog.yoga.id, deleteDialog.yoga.name);
										setDeleteDialog({ open: false, yoga: undefined });
										setIsDeleteLoading(false);
										toastSuccess("Yoga deleted successfully");
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
