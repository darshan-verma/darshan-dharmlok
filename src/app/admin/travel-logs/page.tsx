"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import TravelLogsTable from "../components/travel-logs/TravelLogsTable";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

export interface TravelLog {
	id: string;
	userId?: string;
	userEmail?: string;
	userName?: string;
	logType: "flight" | "hotel";
	action: "booking" | "search" | "selection";
	provider?: string;
	flightData?: Record<string, unknown>;
	hotelData?: Record<string, unknown>;
	bookingCode?: string;
	traceId?: string;
	resultIndex?: string;
	totalAmount?: number;
	currency?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
	createdAt: string;
}

export default function TravelLogsPage() {
	const [logs, setLogs] = useState<TravelLog[]>([]);
	const [isDataLoading, setIsDataLoading] = useState(true);
	const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 20);

	// Fetch logs from the API with pagination and filters
	useEffect(() => {
		const fetchLogs = async () => {
			setIsDataLoading(true);
			try {
				const params = new URLSearchParams({
					page: pagination.currentPage.toString(),
					limit: pagination.itemsPerPage.toString(),
				});

				if (logTypeFilter !== "all") {
					params.append("logType", logTypeFilter);
				}

				if (actionFilter !== "all") {
					params.append("action", actionFilter);
				}

				const response = await fetch(`/api/travel/logs?${params.toString()}`);
				if (!response.ok) {
					throw new Error("Failed to fetch travel logs");
				}
				const data = await response.json();

				if (data.success) {
					setLogs(data.logs);
					updatePagination(
						data.pagination.totalItems,
						data.pagination.totalPages
					);
				} else {
					throw new Error(data.error || "Failed to fetch logs");
				}
			} catch (error) {
				console.error("Error fetching travel logs:", error);
				toast.error("Failed to load travel logs.");
			} finally {
				setIsDataLoading(false);
			}
		};

		fetchLogs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, logTypeFilter, actionFilter]);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Travel Logs</h1>
					<p className="text-sm text-muted-foreground mt-1">
						View booking activities and access audit trails for legal defense
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex gap-4 items-center">
				<select
					value={logTypeFilter}
					onChange={(e) => {
						setLogTypeFilter(e.target.value);
						handlePageChange(1); // Reset to first page on filter change
					}}
					className="px-4 py-2 border rounded-md"
				>
					<option value="all">All Types</option>
					<option value="flight">Flights</option>
					<option value="hotel">Hotels</option>
				</select>

				<select
					value={actionFilter}
					onChange={(e) => {
						setActionFilter(e.target.value);
						handlePageChange(1); // Reset to first page on filter change
					}}
					className="px-4 py-2 border rounded-md"
				>
					<option value="all">All Actions</option>
					<option value="booking">Bookings</option>
					<option value="search">Searches</option>
					<option value="selection">Selections</option>
				</select>
			</div>

			{isDataLoading ? (
				<div className="flex justify-center items-center py-10">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span className="ml-2">Loading travel logs...</span>
				</div>
			) : (
				<div>
					<TravelLogsTable logs={logs} />
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalItems}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				</div>
			)}
		</div>
	);
}
