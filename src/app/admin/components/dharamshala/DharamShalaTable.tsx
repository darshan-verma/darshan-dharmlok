"use client";

import { useState } from "react";
import Pagination from "../Pagination/Pagination";
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
import { formatAdminDate } from "@/lib/utils";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import {
	matchesReligiousFilter,
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";
import { matchesLocalizedNameSearch } from "@/lib/translation-search";

// Dharamshala interface
export interface Dharamshala {
	id: string;
	lang?: "en" | "hi";
	name: string;
	date: string;
	state: string;
	city: string;
	status: string;
	religiousCategories?: ReligiousCategory[];
	bannerImage?: string; // NEW
	coverImage?: string; // NEW
	translations?: unknown;
}

interface DharamshalaTableProps {
	dharamshalas: Dharamshala[];
	setDharamshalas: React.Dispatch<React.SetStateAction<Dharamshala[]>>;
	onAddDharamshala?: () => void;
	onEditDharamshala: (dharamshala: Dharamshala) => void;
	onDeleteDharamshala: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewDharamshala: (dharamshala: Dharamshala) => void;
}

// Helper for status color
const getStatusColor = (status: string): string =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

export default function DharamshalaTable({
	dharamshalas,
	onAddDharamshala,
	onEditDharamshala,
	onDeleteDharamshala,
	onUpdateStatus,
	onViewDharamshala,
}: DharamshalaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [stateFilter, setStateFilter] = useState<string>("all");
	const [cityFilter, setCityFilter] = useState<string>("all");
	const [religiousFilter, setReligiousFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredDharamshalas = dharamshalas.filter((dharamshala) => {
		const matchesSearch = matchesLocalizedNameSearch(dharamshala, searchTerm);

		const matchesStatus =
			statusFilter === "all" || dharamshala.status === statusFilter;

		const matchesState =
			stateFilter === "all" || dharamshala.state === stateFilter;

		const matchesCity = cityFilter === "all" || dharamshala.city === cityFilter;

		const matchesReligious = matchesReligiousFilter(
			resolveReligiousCategories(dharamshala),
			religiousFilter === "all" ? null : religiousFilter
		);

		return (
			matchesSearch &&
			matchesStatus &&
			matchesState &&
			matchesCity &&
			matchesReligious
		);
	});

	const totalItems = filteredDharamshalas.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedDharamshalas = filteredDharamshalas.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	if (currentPage > totalPages) setCurrentPage(1);

	const uniqueStates = Array.from(new Set(dharamshalas.map((t) => t.state)));
	const uniqueCities = Array.from(new Set(dharamshalas.map((t) => t.city)));

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search dharamshalas..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
						/>
					</div>
					{/* Add Dharamshala Button */}
					{onAddDharamshala && (
						<Button onClick={onAddDharamshala} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Dharamshala
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<ReligiousCategoryFilter
						value={religiousFilter}
						onChange={(val) => {
							setReligiousFilter(val);
							setCurrentPage(1);
						}}
						page="admin-dharamshala"
						variant="select" hideLabel allLabel="All Traditions" className="w-44"
					/>
					{/* State Filter */}
					<div className="w-40">
						<select
							className="h-8 border rounded px-2 w-full"
							value={stateFilter}
							onChange={(e) => {
								setStateFilter(e.target.value);
								setCurrentPage(1);
							}}
						>
							<option value="all">All States</option>
							{uniqueStates.map((state) => (
								<option key={state} value={state}>
									{state}
								</option>
							))}
						</select>
					</div>
					{/* City Filter */}
					<div className="w-36">
						<select
							className="h-8 border rounded px-2 w-full"
							value={cityFilter}
							onChange={(e) => {
								setCityFilter(e.target.value);
								setCurrentPage(1);
							}}
						>
							<option value="all">All Cities</option>
							{uniqueCities.map((city) => (
								<option key={city} value={city}>
									{city}
								</option>
							))}
						</select>
					</div>
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
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{totalItems} dharamshala
					{totalItems !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>State</TableHead>
							<TableHead>City</TableHead>
							<TableHead>Religion</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedDharamshalas.length > 0 ? (
							paginatedDharamshalas.map((dharamshala) => (
								<TableRow key={dharamshala.id}>
									<TableCell className="font-medium">
										{dharamshala.name}
									</TableCell>
									<TableCell>{formatAdminDate(dharamshala.date)}</TableCell>
									<TableCell>{dharamshala.state}</TableCell>
									<TableCell>{dharamshala.city}</TableCell>
									<TableCell>
										<ReligiousCategoryBadges
											religiousCategories={dharamshala.religiousCategories}
										/>
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewDharamshala(dharamshala)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												dharamshala.status
											)}`}
										>
											{dharamshala.status}
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
												<DropdownMenuLabel>
													Manage Dharamshala
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(dharamshala.id, "Active")
															}
															className={
																dharamshala.status === "Active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(dharamshala.id, "Inactive")
															}
															className={
																dharamshala.status === "Inactive"
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
													onClick={() => onEditDharamshala(dharamshala)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteDharamshala(
															dharamshala.id,
															dharamshala.name
														);
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
									No dharamshalas found. Try a different search or add a new
									dharamshala.
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
