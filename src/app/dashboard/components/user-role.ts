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
