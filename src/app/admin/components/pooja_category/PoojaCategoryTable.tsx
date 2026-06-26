"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
	PlusCircle,
	MoreVertical,
	Activity,
	CircleSlash,
	CheckCircle2, // add this import
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
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import {
	matchesReligiousFilter,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

// Define the PoojaCategory interface
export interface PoojaCategory {
	id: string;
	name: string;
	description?: string;
	date?: string; // ISO string
	price?: number;
	details?: string;
	status?: string; // "Active" | "Inactive"
	religiousCategories?: ReligiousCategory[];
	images?: string[];
	videos?: string[];
	translations?: {
		en?: { name?: string; description?: string; details?: string };
		hi?: { name?: string; description?: string; details?: string } | null;
	};
}

interface PoojaCategoryTableProps {
	poojaCategories: PoojaCategory[];
	setPoojaCategories?: React.Dispatch<React.SetStateAction<PoojaCategory[]>>;
	onAddPoojaCategory?: () => void;
	onEditPoojaCategory: (poojaCategory: PoojaCategory) => void;
	onDeletePoojaCategory: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => void; // add this prop
}

export default function PoojaCategoryTable({
	poojaCategories,
	onAddPoojaCategory,
	onEditPoojaCategory,
	onDeletePoojaCategory,
	onUpdateStatus, // add this prop
}: PoojaCategoryTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");

	// Filter poojas based on search
	const filteredPoojaCategories = poojaCategories.filter((pooja) => {
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			pooja.name.toLowerCase().includes(term) ||
			(pooja.description && pooja.description.toLowerCase().includes(term)) ||
			(pooja.details && pooja.details.toLowerCase().includes(term)) ||
			resolveReligiousCategories(pooja)
				.join(" ")
				.toLowerCase()
				.includes(term);
		const matchesReligious = matchesReligiousFilter(
			resolveReligiousCategories(pooja),
			religiousFilter === "all" ? null : religiousFilter
		);
		return matchesSearch && matchesReligious;
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
							placeholder="Search pooja categories..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add PoojaCategory Button */}
					{onAddPoojaCategory && (
						<Button onClick={onAddPoojaCategory} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Pooja Category
						</Button>
					)}
				</div>
				<ReligiousCategoryFilter
					value={religiousFilter}
					onChange={setReligiousFilter}
					page="admin-pooja-category"
					variant="select" hideLabel allLabel="All Traditions" className="w-44"
				/>
				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredPoojaCategories.length} pooja categor
					{filteredPoojaCategories.length !== 1 ? "ies" : "y"} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Pooja Name</TableHead>
							<TableHead>Religion</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Price</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">View</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredPoojaCategories.length > 0 ? (
							filteredPoojaCategories.map((pooja) => (
								<TableRow key={pooja.id}>
									<TableCell className="font-medium">{pooja.name}</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={pooja.religiousCategories}
										/>
									</TableCell>
									<TableCell title={pooja.details}>
										{pooja.details
											? pooja.details.length > 40
												? pooja.details.slice(0, 40) + "..."
												: pooja.details
											: "-"}
									</TableCell>
									<TableCell>
										{pooja.date
											? new Date(pooja.date).toLocaleDateString()
											: "-"}
									</TableCell>
									<TableCell>
										{typeof pooja.price === "number"
											? `₹${pooja.price.toFixed(2)}`
											: "-"}
									</TableCell>
									<TableCell className="text-center">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												pooja.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{pooja.status === "Active" ? "Active" : "Inactive"}
										</span>
									</TableCell>
									<TableCell className="text-center">
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/pooja-category/${pooja.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												View
											</a>
										</Button>
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
												<DropdownMenuLabel>
													Manage Pooja Category
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onUpdateStatus(pooja.id, "Active")}
															className={
																pooja.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(pooja.id, "Inactive")
															}
															className={
																pooja.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem
													onClick={() => onEditPoojaCategory(pooja)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeletePoojaCategory(pooja.id, pooja.name);
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
									No pooja categories found. Try a different search or add a new
									one.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
