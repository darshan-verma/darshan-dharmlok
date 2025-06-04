"use client";

import { useState } from "react";
import {
	Search,
	Eye,
	Edit,
	Trash2,
	LogIn,
	ThumbsUp,
	ThumbsDown,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Define the HotelDharamshala interface
export interface HotelDharamshala {
	id: string;
	name: string;
	phone: string;
	email: string;
	status: string;
	isApproved: boolean;
}

interface HotelDharamshalaTableProps {
	hotelDharamshalas: HotelDharamshala[];
	setHotelDharamshalas: React.Dispatch<React.SetStateAction<HotelDharamshala[]>>;
	onAddHotelDharamshala?: () => void;
	onEditHotelDharamshala: (hotelDharamshala: HotelDharamshala) => void;
	onDeleteHotelDharamshala: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
	onToggleApproval: (id: string, currentStatus: boolean) => Promise<void>;
	onLoginAsHotelDharamshala: (hotelDharamshala: HotelDharamshala) => void;
}

export default function HotelDharamshalaTable({
	hotelDharamshalas,
	onAddHotelDharamshala,
	onEditHotelDharamshala,
	onDeleteHotelDharamshala,
	onUpdateStatus,
	onToggleApproval,
	onLoginAsHotelDharamshala,
}: HotelDharamshalaTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [approvalFilter, setApprovalFilter] = useState<string>("all");

	// Filter hotel dharamshalas based on search and filter criteria
	const filteredHotelDharamshalas = hotelDharamshalas.filter((hotelDharamshala) => {
		// Apply search filter
		const matchesSearch =
			hotelDharamshala.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			hotelDharamshala.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			hotelDharamshala.phone.includes(searchTerm);

		// Apply status filter
		const matchesStatus =
			statusFilter === "all" || hotelDharamshala.status === statusFilter;

		// Apply approval filter
		const matchesApproval =
			approvalFilter === "all" ||
			(approvalFilter === "approved" && hotelDharamshala.isApproved) ||
			(approvalFilter === "notApproved" && !hotelDharamshala.isApproved);

		return (
			matchesSearch &&
			matchesStatus &&
			matchesApproval
		);
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
							placeholder="Search Hotel Dharamshala..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Add Hotel Dharamshala Button */}
					{onAddHotelDharamshala && (
						<Button onClick={onAddHotelDharamshala} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Hotel Dharamshala
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

					{/* Approval Filter */}
					<div className="w-32">
						<Select value={approvalFilter} onValueChange={setApprovalFilter}>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Approval" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="notApproved">Not Approved</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-500">
					{filteredHotelDharamshalas.length} hotel dharamshala
					{filteredHotelDharamshalas.length !== 1 ? "s" : ""} found
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Phone</TableHead>    
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Approved</TableHead>
							<TableHead>View</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredHotelDharamshalas.length > 0 ? (
							filteredHotelDharamshalas.map((hotelDharamshala) => (
								<TableRow key={hotelDharamshala.id}>
									<TableCell className="font-medium">{hotelDharamshala.name}</TableCell>
									<TableCell>{hotelDharamshala.phone}</TableCell>
									<TableCell>{hotelDharamshala.email}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												hotelDharamshala.status === "Active"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{hotelDharamshala.status}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												hotelDharamshala.isApproved
													? "bg-green-100 text-green-800"
													: "bg-amber-100 text-amber-800"
											}`}
										>
											{hotelDharamshala.isApproved ? "Approved" : "Not Approved"}
										</span>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<a href={`/admin/hotel_dharamshala_vendor/${hotelDharamshala.id}`}>
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
												<DropdownMenuLabel>Manage Hotel Dharamshala</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{!hotelDharamshala.isApproved ? (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(hotelDharamshala.id, hotelDharamshala.isApproved)
														}
														className="text-green-600"
													>
														<ThumbsUp className="h-4 w-4 mr-2" />
														Approve
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem
														onClick={() =>
															onToggleApproval(hotelDharamshala.id, hotelDharamshala.isApproved)
														}
														className="text-amber-600"
													>
														<ThumbsDown className="h-4 w-4 mr-2" />
														Disapprove
													</DropdownMenuItem>
												)}
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(hotelDharamshala.id, "Active")
															}
															className={
																hotelDharamshala.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(hotelDharamshala.id, "Inactive")
															}
															className={
															hotelDharamshala.status === "Inactive"
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
													onClick={() => onEditHotelDharamshala(hotelDharamshala)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteHotelDharamshala(hotelDharamshala.id, hotelDharamshala.name);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => onLoginAsHotelDharamshala(hotelDharamshala)}
												>
													<LogIn className="h-4 w-4 mr-2" />
													Login as Hotel Dharamshala
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-6">
									No hotel dharamshalas found. Try a different search or add a new
									hotel dharamshala.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
