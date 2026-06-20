export function normalizeRole(role?: string | null): string {
	if (!role) return "";
	return role.toLowerCase().replace(/[\s_]+/g, "-").trim();
}

export function canonicalRole(role?: string | null): string {
	const normalized = normalizeRole(role);
	if (!normalized) return "";

	if (["hoteldharamshala", "hotel-dharamshala-vendor"].includes(normalized)) {
		return "hotel_dharamshala_vendor";
	}
	if (["motivationalspeaker", "motivational-speaker", "motivation-speaker"].includes(normalized)) {
		return "motivational-speaker";
	}
	if (["yoga-trainer", "trainer"].includes(normalized)) {
		return "yoga";
	}
	return normalized;
}

export function hasRequiredRole(
	userRole: string | undefined | null,
	requiredRoles?: string | string[]
): boolean {
	const user = canonicalRole(userRole);
	if (!user) return false;
	if (user === "admin") return true;
	if (!requiredRoles) return true;

	const required = (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles])
		.map((role) => canonicalRole(role))
		.filter(Boolean);

	return required.includes(user);
}

/** True for end-user accounts without a specialist dashboard. */
export function isRegularUser(role?: string | null): boolean {
	const user = canonicalRole(role);
	return !user || user === "user" || user === "regular";
}

/** Dashboard home for specialist roles; null for regular users (show profile info instead). */
export function getDashboardRoute(role?: string | null): string | null {
	const user = canonicalRole(role);
	if (!user || isRegularUser(role)) return null;

	switch (user) {
		case "admin":
			return "/admin";
		case "kathavachak":
			return "/dashboard/kathavachak";
		case "dharmguru":
			return "/dashboard/dharmguru";
		case "panditji":
			return "/dashboard/panditji/dashboard";
		case "seller":
			return "/dashboard/seller/dashboard";
		case "hotel_dharamshala_vendor":
			return "/dashboard/hotel_dharamshala_vendor";
		case "yoga":
			return "/dashboard/yoga/go-live";
		case "motivational-speaker":
			return "/dashboard/motivational-speaker/go-live";
		default:
			return null;
	}
}

export function getProfileSettingsRoute(role?: string | null): string {
	const user = canonicalRole(role);
	if (!user || isRegularUser(role)) return "/dashboard";

	switch (user) {
		case "admin":
			return "/admin";
		case "seller":
			return "/dashboard/seller/profile";
		case "panditji":
			return "/dashboard/panditji/profile";
		case "kathavachak":
		case "dharmguru":
		case "hotel_dharamshala_vendor":
			return `/dashboard/${user}/setting`;
		case "yoga":
		case "motivational-speaker":
			return `/dashboard/${user}/go-live`;
		default:
			return "/dashboard";
	}
}
