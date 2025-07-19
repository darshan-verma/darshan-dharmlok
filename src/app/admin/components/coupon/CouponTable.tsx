"use client";

import { useState } from "react";
import {
	Search,
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

// Coupon interface
export interface Coupon {
	id: string;
	name: string;
	date: string;
	discount: number;
	userLimit: number;
	timeUsed: number;
	validity: string;
	status: string;
}

interface CouponTableProps {
	coupons: Coupon[];
	setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
	onAddCoupon?: () => void;
	onEditCoupon: (coupon: Coupon) => void;
	onDeleteCoupon: (id: string, name: string) => void;
	onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
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

import Pagination from "../Pagination/Pagination";

export default function CouponTable({
	coupons,
	onAddCoupon,
	onEditCoupon,
	onDeleteCoupon,
	onUpdateStatus,
}: CouponTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredCoupons = coupons.filter((coupon) => {
		const matchesSearch = coupon.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || coupon.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const totalItems = filteredCoupons.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedCoupons = filteredCoupons.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
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
							placeholder="Search coupons..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					{/* Add Coupon Button */}
					{onAddCoupon && (
						<Button onClick={onAddCoupon} className="w-full sm:w-auto">
							<PlusCircle className="h-4 w-4 mr-2" />
							Add Coupon
						</Button>
					)}
				</div>
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-4">
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
					{totalItems} coupon
					{totalItems !== 1 ? "s" : ""} found
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Discount</TableHead>
							<TableHead>User Limit</TableHead>
							<TableHead>Time Used</TableHead>
							<TableHead>Validity</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedCoupons.length > 0 ? (
							paginatedCoupons.map((coupon) => (
								<TableRow key={coupon.id}>
									<TableCell className="font-medium">{coupon.name}</TableCell>
									<TableCell>{formatDate(coupon.date)}</TableCell>
									<TableCell>
										{coupon.discount % 1 === 0
											? `${coupon.discount}%`
											: coupon.discount}
									</TableCell>
									<TableCell>{coupon.userLimit}</TableCell>
									<TableCell>{coupon.timeUsed}</TableCell>
									<TableCell>{formatDate(coupon.validity)}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												coupon.status
											)}`}
										>
											{coupon.status}
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
												<DropdownMenuLabel>Manage Coupon</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(coupon.id, "Active")
															}
															className={
																coupon.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																onUpdateStatus(coupon.id, "Inactive")
															}
															className={
																coupon.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => onEditCoupon(coupon)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														onDeleteCoupon(coupon.id, coupon.name);
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
									No coupons found. Try a different search or add a new coupon.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
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
