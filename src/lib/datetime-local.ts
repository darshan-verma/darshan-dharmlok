/** `YYYY-MM-DD` at local noon → ISO-8601 with numeric timezone offset (ProKerala requirement). */
export function dateInputToIsoDatetime(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	if (!y || !m || !d) return dateStr;
	const local = new Date(y, m - 1, d, 12, 0, 0, 0);
	const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
	const offsetMin = -local.getTimezoneOffset();
	const sign = offsetMin >= 0 ? "+" : "-";
	const abs = Math.abs(offsetMin);
	const oh = Math.floor(abs / 60);
	const om = abs % 60;
	return `${y}-${pad(m)}-${pad(d)}T12:00:00${sign}${pad(oh)}:${pad(om)}`;
}

export function getTodayYyyyMmDd(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * `YYYY-MM-DDTHH:mm` from `<input type="datetime-local" />` → ISO-8601 with numeric
 * local timezone offset (ProKerala requirement).
 */
export function datetimeLocalToIsoWithOffset(datetimeLocal: string): string {
	if (!datetimeLocal || !datetimeLocal.includes("T")) return datetimeLocal;
	const d = new Date(datetimeLocal);
	if (Number.isNaN(d.getTime())) return datetimeLocal;
	const y = d.getFullYear();
	const m = pad2(d.getMonth() + 1);
	const day = pad2(d.getDate());
	const h = pad2(d.getHours());
	const min = pad2(d.getMinutes());
	const s = pad2(d.getSeconds());
	const offsetMin = -d.getTimezoneOffset();
	const sign = offsetMin >= 0 ? "+" : "-";
	const abs = Math.abs(offsetMin);
	const oh = pad2(Math.floor(abs / 60));
	const om = pad2(abs % 60);
	return `${y}-${m}-${day}T${h}:${min}:${s}${sign}${oh}:${om}`;
}
