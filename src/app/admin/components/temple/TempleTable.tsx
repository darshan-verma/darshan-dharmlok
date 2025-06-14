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

// Temple interface
export interface Temple {
	id: string;
	name: string;
	date: string;
	state: string;
	city: string;
	status: string;
}

interface TempleTableProps {
	temples: Temple[];
	setTemples: React.Dispatch<React.SetStateAction<Temple[]>>;
	onAddTemple?: () => void;
	onEditTemple: (temple: Temple) => void;
	onDeleteTemple: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewTemple: (temple: Temple) => void;
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

export default function TempleTable({
	temples,
	onAddTemple,
	onEditTemple,
	onDeleteTemple,
	onUpdateStatus,
	onViewTemple,
}: TempleTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [stateFilter, setStateFilter] = useState<string>("all");
	const [cityFilter, setCityFilter] = useState<string>("all");

	const filteredTemples = temples.filter((temple) => {
		const matchesSearch =
			temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			temple.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
			temple.city.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || temple.status === statusFilter;

		const matchesState = stateFilter === "all" || temple.state === stateFilter;

		const matchesCity = cityFilter === "all" || temple.city === cityFilter;

		return matchesSearch && matchesStatus && matchesState && matchesCity;
	});

	const uniqueStates = Array.from(new Set(temples.map((t) => t.state)));
	const uniqueCities = Array.from(new Set(temples.map((t) => t.city)));

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search temples..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Temple Button */}
					{onAddTemple && (
						<Button onClick={onAddTemple} className="w-full sm:w-auto">
                            <PlusCircle className="h-4 w-4 mr-2" />
							Add Temple
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
					{/* State Filter */}
					<div className="w-40">
						<select
							className="h-8 border rounded px-2 w-full"
							value={stateFilter}
							onChange={(e) => setStateFilter(e.target.value)}
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
							onChange={(e) => setCityFilter(e.target.value)}
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
					{filteredTemples.length} temple
					{filteredTemples.length !== 1 ? "s" : ""} found
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
							<TableHead>Details</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTemples.length > 0 ? (
							filteredTemples.map((temple) => (
								<TableRow key={temple.id}>
									<TableCell className="font-medium">{temple.name}</TableCell>
									<TableCell>{formatDate(temple.date)}</TableCell>
									<TableCell>{temple.state}</TableCell>
									<TableCell>{temple.city}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewTemple(temple)}
										>
											<Eye className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												temple.status
											)}`}
										>
											{temple.status}
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
												<DropdownMenuLabel>Manage Temple</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(temple.id, "Active")
															}
															className={
																temple.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(temple.id, "Inactive")
															}
															className={
																temple.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditTemple(temple)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteTemple(temple.id, temple.name);
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
									No temples found. Try a different search or add a new temple.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
