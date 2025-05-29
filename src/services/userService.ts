import { User } from "@/types/user";

const API_BASE_URL = "/api/users";

export const userService = {
	// Get all users
	async getUsers(): Promise<User[]> {
		const response = await fetch(API_BASE_URL);
		if (!response.ok) {
			throw new Error("Failed to fetch users");
		}
		return response.json();
	},

	// Get a single user by ID
	async getUserById(id: string): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/${id}`);
		if (!response.ok) {
			throw new Error("Failed to fetch user");
		}
		return response.json();
	},

	// Create a new user
	async createUser(userData: Omit<User, "id">): Promise<User> {
		const response = await fetch(API_BASE_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		if (!response.ok) {
			throw new Error("Failed to create user");
		}
		return response.json();
	},

	// Update a user
	async updateUser(id: string, userData: Partial<User>): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		if (!response.ok) {
			throw new Error("Failed to update user");
		}
		return response.json();
	},

	// Delete a user
	async deleteUser(id: string): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error("Failed to delete user");
		}
	},
};
