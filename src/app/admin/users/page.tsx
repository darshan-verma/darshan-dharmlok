"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import UserTable, { User } from "../components/users/UserTable";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [isDataLoading, setIsDataLoading] = useState(true);
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);

	// Fetch users from the API with pagination
	useEffect(() => {
		const fetchUsers = async () => {
			setIsDataLoading(true);
			try {
				const response = await fetch(
					`/api/users?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);
				if (!response.ok) {
					throw new Error("Failed to fetch users");
				}
				const data = await response.json();

				// Transform API data to match User interface
				const transformedUsers = data.users.map((user: User) => ({
					id: user.id,
					name: user.name,
					phone: user.phone || "",
					email: user.email,
					userType: user.userType || "User",
					status: user.status || "Active",
				}));

				setUsers(transformedUsers);
				updatePagination(data.total, data.pagination.totalPages);
			} catch (error) {
				console.error("Error fetching users:", error);
				toast.error("Failed to load users.");
			} finally {
				setIsDataLoading(false);
			}
		};

		fetchUsers();
	}, [pagination.currentPage]);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">User Management</h1>
			</div>

			{isDataLoading ? (
				<div className="flex justify-center items-center py-10">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span className="ml-2">Loading users...</span>
				</div>
			) : (
				<div>
					<UserTable users={users} setUsers={setUsers} />
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
