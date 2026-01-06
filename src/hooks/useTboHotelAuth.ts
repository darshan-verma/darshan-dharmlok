/**
 * Custom Hook: useTboHotelAuth
 * Manages TBO Hotel API authentication in React components
 */

import { useState, useEffect, useCallback } from "react";

interface AuthStatus {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	tokenExpiry: string | null;
}

export function useTboHotelAuth() {
	const [authStatus, setAuthStatus] = useState<AuthStatus>({
		isAuthenticated: false,
		isLoading: true,
		error: null,
		tokenExpiry: null,
	});

	/**
	 * Check authentication status
	 */
	const checkAuth = useCallback(async () => {
		setAuthStatus((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await fetch("/api/travel/hotel/auth");
			const data = await response.json();

			if (data.success) {
				setAuthStatus({
					isAuthenticated: data.hasValidToken,
					isLoading: false,
					error: null,
					tokenExpiry: data.expiresAt,
				});
			} else {
				setAuthStatus({
					isAuthenticated: false,
					isLoading: false,
					error: data.error || "Authentication failed",
					tokenExpiry: null,
				});
			}
		} catch (error: any) {
			setAuthStatus({
				isAuthenticated: false,
				isLoading: false,
				error: error.message || "Failed to check authentication",
				tokenExpiry: null,
			});
		}
	}, []);

	/**
	 * Force refresh the authentication token
	 */
	const refreshToken = useCallback(async () => {
		setAuthStatus((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await fetch("/api/travel/hotel/auth", {
				method: "POST",
			});
			const data = await response.json();

			if (data.success) {
				setAuthStatus({
					isAuthenticated: data.hasValidToken,
					isLoading: false,
					error: null,
					tokenExpiry: data.expiresAt,
				});
				return true;
			} else {
				setAuthStatus({
					isAuthenticated: false,
					isLoading: false,
					error: data.error || "Token refresh failed",
					tokenExpiry: null,
				});
				return false;
			}
		} catch (error: any) {
			setAuthStatus({
				isAuthenticated: false,
				isLoading: false,
				error: error.message || "Failed to refresh token",
				tokenExpiry: null,
			});
			return false;
		}
	}, []);

	// Check auth status on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Auto-refresh token 30 minutes before expiry
	useEffect(() => {
		if (!authStatus.tokenExpiry || !authStatus.isAuthenticated) return;

		const expiryTime = new Date(authStatus.tokenExpiry).getTime();
		const now = Date.now();
		const timeUntilRefresh = expiryTime - now - 30 * 60 * 1000; // 30 min before expiry

		if (timeUntilRefresh > 0) {
			const timer = setTimeout(() => {
				console.log("⏰ Auto-refreshing TBO Hotel token...");
				refreshToken();
			}, timeUntilRefresh);

			return () => clearTimeout(timer);
		}
	}, [authStatus.tokenExpiry, authStatus.isAuthenticated, refreshToken]);

	return {
		...authStatus,
		checkAuth,
		refreshToken,
	};
}

/**
 * Search hotels with authentication
 */
export async function searchHotelsWithAuth(params: {
	checkIn: string;
	checkOut: string;
	hotelCodes?: string;
	cityCode?: string;
	guestNationality: string;
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>;
	filters?: {
		refundable?: boolean;
		mealType?: "All" | "WithMeal" | "RoomOnly";
		minPrice?: number;
		maxPrice?: number;
	};
}) {
	try {
		const response = await fetch("/api/travel/hotel/search", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Hotel search failed");
		}

		return data;
	} catch (error: any) {
		console.error("Hotel search error:", error);
		throw error;
	}
}
