import { Button } from "@/components/ui/button";
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
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Pencil,
	Trash2,
	MoreVertical,
	CheckCircle2,
	CircleSlash,
	PlusCircle,
	Loader2,
	Activity,
    Search,
} from "lucide-react";
import { useState } from "react";

export interface PoojaServiceRow {
	id: string;
	categoryId: string;
	categoryName: string;
	price: number;
	details: string;
	status: "Active" | "Inactive";
}

interface PoojaServicesTableProps {
	services: PoojaServiceRow[];
	loading?: boolean;
	onAdd?: () => void;
	onEdit: (service: PoojaServiceRow) => void;
	onDelete: (service: PoojaServiceRow) => void;
	onChangeStatus: (
		service: PoojaServiceRow,
		newStatus: "Active" | "Inactive",
		setRowLoading?: (loading: boolean) => void
	) => void;
}

export default function PoojaServicesTable({
	services,
	loading = false,
	onAdd,
	onEdit,
	onDelete,
	onChangeStatus,
}: PoojaServicesTableProps) {
	const [search, setSearch] = useState("");
	// No per-row loading needed for instant status change UX

	const filtered = services.filter((s) => {
		const term = search.toLowerCase();
		return (
			s.categoryName.toLowerCase().includes(term) ||
			s.details.toLowerCase().includes(term)
		);
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between gap-4">
				<div className="relative w-full sm:w-80">
					<input
						type="search"
						className="pl-8 pr-2 py-2 border rounded w-full"
						placeholder="Search by category or details..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<span className="absolute left-2 top-2.5 text-gray-400">
						<Search className="h-4 w-4" />
					</span>
				</div>
				{onAdd && (
					<Button onClick={onAdd} className="w-full sm:w-auto">
						<PlusCircle className="h-4 w-4 mr-2" /> Add Service
					</Button>
				)}
			</div>
			<div className="rounded-md border bg-white overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Category</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Details</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									<Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
									Loading services...
								</TableCell>
							</TableRow>
						) : filtered.length > 0 ? (
							filtered.map((service) => {
								const handleStatusChange = (status: "Active" | "Inactive") => {
									onChangeStatus(service, status);
								};
								return (
									<TableRow key={service.id}>
										<TableCell className="font-medium">
											{service.categoryName}
										</TableCell>
										<TableCell>₹{service.price.toFixed(2)}</TableCell>
										<TableCell
											title={service.details}
											className="max-w-xs truncate"
										>
											{service.details
												? service.details.length > 40
													? service.details.slice(0, 40) + "..."
													: service.details
												: "-"}
										</TableCell>
										<TableCell className="text-center">
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
													service.status === "Active"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}
											>
												{service.status}
											</span>
										</TableCell>
										<TableCell className="text-center">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														aria-label="Actions"
													>
														<MoreVertical className="h-5 w-5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Manage Service</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => onEdit(service)}>
														<Pencil className="h-4 w-4 mr-2" /> Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => onDelete(service)}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4 mr-2" /> Delete
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuSub>
														<DropdownMenuSubTrigger>
															<Activity className="h-4 w-4 mr-2" />
															Change Status
														</DropdownMenuSubTrigger>
														<DropdownMenuSubContent>
															<DropdownMenuItem
																onClick={() => handleStatusChange("Active")}
																className={
																	service.status === "Active"
																		? "bg-blue-50"
																		: ""
																}
															>
																<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
																Active
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleStatusChange("Inactive")}
																className={
																	service.status === "Inactive"
																		? "bg-blue-50"
																		: ""
																}
															>
																<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
																Inactive
															</DropdownMenuItem>
														</DropdownMenuSubContent>
													</DropdownMenuSub>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									No services found. Add your first pooja service!
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
