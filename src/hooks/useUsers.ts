// import { useState, useCallback } from "react";
// import { User, UserFilters, UserFormData } from "@/types/user";
// import { userService } from "@/services/userService";

// export function useUsers(initialFilters: UserFilters = {}) {
// 	const [users, setUsers] = useState<User[]>([]);
// 	const [loading, setLoading] = useState<boolean>(false);
// 	const [error, setError] = useState<string | null>(null);
// 	const [filters, setFilters] = useState<UserFilters>(initialFilters);

// 	// Fetch users with optional filters
// 	const fetchUsers = useCallback(
// 		async (newFilters?: UserFilters) => {
// 			try {
// 				setLoading(true);
// 				setError(null);

// 				// Merge new filters with existing ones
// 				const mergedFilters = { ...filters, ...newFilters };

// 				const data = await userService.getUsers();
// 				setUsers(data);
// 				setFilters(mergedFilters);
// 				return data;
// 			} catch (err) {
// 				const message =
// 					err instanceof Error ? err.message : "Failed to fetch users";
// 				setError(message);
// 				throw err;
// 			} finally {
// 				setLoading(false);
// 			}
// 		},
// 		[filters]
// 	);

// 	// Create a new user
// 	const createUser = useCallback(async (userData: UserFormData) => {
// 		try {
// 			setLoading(true);
// 			setError(null);
// 			const newUser = await userService.createUser(userData);
// 			setUsers((prev) => [...prev, newUser]);
// 			return newUser;
// 		} catch (err) {
// 			const message =
// 				err instanceof Error ? err.message : "Failed to create user";
// 			setError(message);
// 			throw err;
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, []);

// 	// Update an existing user
// 	const updateUser = useCallback(
// 		async (id: string, userData: Partial<UserFormData>) => {
// 			try {
// 				setLoading(true);
// 				setError(null);
// 				const updatedUser = await userService.updateUser(id, userData);
// 				setUsers((prev) =>
// 					prev.map((user) =>
// 						user.id === id ? { ...user, ...updatedUser } : user
// 					)
// 				);
// 				return updatedUser;
// 			} catch (err) {
// 				const message =
// 					err instanceof Error ? err.message : "Failed to update user";
// 				setError(message);
// 				throw err;
// 			} finally {
// 				setLoading(false);
// 			}
// 		},
// 		[]
// 	);

// 	// Delete a user
// 	const deleteUser = useCallback(async (id: string) => {
// 		try {
// 			setLoading(true);
// 			setError(null);
// 			await userService.deleteUser(id);
// 			setUsers((prev) => prev.filter((user) => user.id !== id));
// 		} catch (err) {
// 			const message =
// 				err instanceof Error ? err.message : "Failed to delete user";
// 			setError(message);
// 			throw err;
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, []);

// 	// Update user approval status
// 	const updateUserApproval = useCallback(
// 		async (id: string, isApproved: boolean) => {
// 			try {
// 				setLoading(true);
// 				setError(null);
// 				const updatedUser = await userService.updateUserApproval(
// 					id,
// 					isApproved
// 				);
// 				setUsers((prev) =>
// 					prev.map((user) =>
// 						user.id === id ? { ...user, ...updatedUser } : user
// 					)
// 				);
// 				return updatedUser;
// 			} catch (err) {
// 				const message =
// 					err instanceof Error ? err.message : "Failed to update user approval";
// 				setError(message);
// 				throw err;
// 			} finally {
// 				setLoading(false);
// 			}
// 		},
// 		[]
// 	);

// 	// Update user status
// 	const updateUserStatus = useCallback(async (id: string, status: string) => {
// 		try {
// 			setLoading(true);
// 			setError(null);
// 			const updatedUser = await userService.updateUserStatus(id, status);
// 			setUsers((prev) =>
// 				prev.map((user) =>
// 					user.id === id ? { ...user, ...updatedUser } : user
// 				)
// 			);
// 			return updatedUser;
// 		} catch (err) {
// 			const message =
// 				err instanceof Error ? err.message : "Failed to update user status";
// 			setError(message);
// 			throw err;
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, []);

// 	return {
// 		users,
// 		loading,
// 		error,
// 		filters,
// 		fetchUsers,
// 		createUser,
// 		updateUser,
// 		deleteUser,
// 		updateUserApproval,
// 		updateUserStatus,
// 		setFilters,
// 	};
// }
