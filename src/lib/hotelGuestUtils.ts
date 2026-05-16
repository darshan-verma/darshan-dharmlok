/** Distribute adults/children across rooms for guest forms. */
export function buildRoomGuestConfig(
	roomCount: number,
	adultCount: number,
	childCount: number,
): { adults: number; children: number }[] {
	const roomParam = Math.max(1, roomCount);
	const adultParam = Math.max(1, adultCount);
	const childParam = Math.max(0, childCount);
	const perRoom = Math.floor(adultParam / roomParam);
	const extraAdults = adultParam % roomParam;
	const perRoomChild = Math.floor(childParam / roomParam);
	const extraChildren = childParam % roomParam;
	return Array.from({ length: roomParam }, (_, i) => ({
		adults: perRoom + (i < extraAdults ? 1 : 0),
		children: perRoomChild + (i < extraChildren ? 1 : 0),
	}));
}

export function formatHotelDisplayDate(dateStr: string | null | undefined): string {
	if (!dateStr?.trim()) return "—";
	const normalized = dateStr.trim();
	const d = new Date(
		/^\d{4}-\d{2}-\d{2}$/.test(normalized)
			? `${normalized}T12:00:00`
			: normalized,
	);
	if (Number.isNaN(d.getTime())) return normalized;
	return d.toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
