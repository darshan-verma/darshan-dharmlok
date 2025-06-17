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
	Music2,
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

// AudioLibrary interface
export interface AudioLibrary {
	id: string;
	name: string;
	date: string;
	category: string;
	status: string;
}

interface AudioLibraryTableProps {
	audioLibraries: AudioLibrary[];
	setAudioLibraries: React.Dispatch<React.SetStateAction<AudioLibrary[]>>;
	onAddAudioLibrary?: () => void;
	onEditAudioLibrary: (audioLibrary: AudioLibrary) => void;
	onDeleteAudioLibrary: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onViewAudioLibrary: (audioLibrary: AudioLibrary) => void;
	onAddSongs: (audioLibrary: AudioLibrary) => void;
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

export default function AudioLibraryTable({
	audioLibraries,
	onAddAudioLibrary,
	onEditAudioLibrary,
	onDeleteAudioLibrary,
	onUpdateStatus,
	onViewAudioLibrary,
	onAddSongs,
}: AudioLibraryTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	const filteredAudioLibraries = audioLibraries.filter((audioLibrary) => {
		const matchesSearch =
			audioLibrary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			audioLibrary.category.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || audioLibrary.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || audioLibrary.category === categoryFilter;

		return matchesSearch && matchesStatus && matchesCategory;
	});

	const uniqueCategories = Array.from(
		new Set(audioLibraries.map((t) => t.category))
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col sm:flex-row justify-between gap-4">
					{/* Search Bar */}
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							type="search"
							placeholder="Search audio libraries..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Audio Library Button */}
					{onAddAudioLibrary && (
						<Button onClick={onAddAudioLibrary} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Audio Library
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
					{filteredAudioLibraries.length} audio librar
					{filteredAudioLibraries.length !== 1 ? "ies" : "y"} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Playlist Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Add Songs</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAudioLibraries.length > 0 ? (
							filteredAudioLibraries.map((audioLibrary) => (
								<TableRow key={audioLibrary.id}>
									<TableCell className="font-medium">
										{audioLibrary.name}
									</TableCell>
									<TableCell>{formatDate(audioLibrary.date)}</TableCell>
									<TableCell>{audioLibrary.category}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onAddSongs(audioLibrary)}
										>
											<Music2 className="h-4 w-4 mr-1" />
											Add Songs
										</Button>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												audioLibrary.status
											)}`}
										>
											{audioLibrary.status}
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
													Manage Audio Library
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
																onUpdateStatus(audioLibrary.id, "Active")
															}
															className={
																audioLibrary.status === "Active"
																	? "bg-blue-50"
																	: ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(audioLibrary.id, "Inactive")
															}
															className={
																audioLibrary.status === "Inactive"
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
													onClick={() => onEditAudioLibrary(audioLibrary)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteAudioLibrary(
															audioLibrary.id,
															audioLibrary.name
														);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => onViewAudioLibrary(audioLibrary)}
												>
													<Eye className="h-4 w-4 mr-2" />
													View
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-6">
									No audio libraries found. Try a different search or add a new
									audio library.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
