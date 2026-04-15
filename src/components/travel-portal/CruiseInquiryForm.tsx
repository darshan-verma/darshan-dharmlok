"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Ship, Loader2 } from "lucide-react";

export default function CruiseInquiryForm() {
	const { data: session, status } = useSession();
	const [contactName, setContactName] = useState(
		() => session?.user?.name?.trim() || "",
	);
	const [email, setEmail] = useState(() => session?.user?.email?.trim() || "");
	const [phone, setPhone] = useState("");
	const [preferredRegion, setPreferredRegion] = useState("");
	const [departurePort, setDeparturePort] = useState("");
	const [travelMonth, setTravelMonth] = useState("");
	const [passengers, setPassengers] = useState(2);
	const [cabinPreference, setCabinPreference] = useState("");
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (status !== "authenticated" || !session?.user) return;
		setContactName((prev) => prev.trim() || session.user?.name?.trim() || "");
		setEmail((prev) => prev.trim() || session.user?.email?.trim() || "");
	}, [status, session]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const res = await fetch("/api/travel-portal/queries", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					queryType: "cruise",
					contactName,
					email,
					phone: phone || undefined,
					preferredRegion: preferredRegion || undefined,
					departurePort: departurePort || undefined,
					travelMonth: travelMonth || undefined,
					passengers,
					cabinPreference: cabinPreference || undefined,
					message: message || undefined,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || "Could not send inquiry");
			}
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	};

	if (done) {
		return (
			<div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">
				<Ship className="mx-auto h-10 w-10 text-emerald-600 mb-3" />
				<h3 className="text-lg font-semibold text-emerald-900">
					Thank you — we received your cruise inquiry
				</h3>
				<p className="mt-2 text-sm text-emerald-800/90">
					Our team will contact you shortly using the details you provided.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} className="space-y-5">
			<div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
				<p className="text-sm font-medium text-sky-900">
					Plan a cruise with Dharmlok Travel
				</p>
				<p className="mt-1 text-sm text-sky-800/85">
					Share your preferences below. If you are signed in, your account will be
					linked to this request for faster follow-up.
				</p>
				{status === "authenticated" && session?.user && (
					<p className="mt-2 text-xs text-sky-700">
						Signed in as{" "}
						<span className="font-medium">{session.user.email}</span>
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Full name <span className="text-red-500">*</span>
					</label>
					<input
						required
						value={contactName}
						onChange={(e) => setContactName(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
						placeholder="Your name"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Email <span className="text-red-500">*</span>
					</label>
					<input
						required
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
						placeholder="you@example.com"
					/>
				</div>
				<div className="sm:col-span-2">
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Phone
					</label>
					<input
						type="tel"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
						placeholder="+91 ..."
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Preferred region / route
					</label>
					<input
						value={preferredRegion}
						onChange={(e) => setPreferredRegion(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
						placeholder="e.g. Mediterranean, Singapore–Malaysia"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Preferred departure port
					</label>
					<input
						value={departurePort}
						onChange={(e) => setDeparturePort(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
						placeholder="e.g. Mumbai, Singapore"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Preferred travel month
					</label>
					<input
						value={travelMonth}
						onChange={(e) => setTravelMonth(e.target.value)}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
						placeholder="e.g. December 2026"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-600 mb-1">
						Passengers
					</label>
					<input
						type="number"
						min={1}
						max={50}
						value={passengers}
						onChange={(e) =>
							setPassengers(Math.max(1, parseInt(e.target.value, 10) || 1))
						}
						className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
					/>
				</div>
			</div>

			<div>
				<label className="block text-xs font-medium text-gray-600 mb-1">
					Cabin preference
				</label>
				<select
					value={cabinPreference}
					onChange={(e) => setCabinPreference(e.target.value)}
					className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
				>
					<option value="">No preference</option>
					<option value="Interior">Interior</option>
					<option value="Oceanview">Ocean view</option>
					<option value="Balcony">Balcony</option>
					<option value="Suite">Suite</option>
				</select>
			</div>

			<div>
				<label className="block text-xs font-medium text-gray-600 mb-1">
					Additional notes
				</label>
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={4}
					className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
					placeholder="Dietary needs, celebrations, budget range, etc."
				/>
			</div>

			{error && (
				<p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={submitting}
				className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
			>
				{submitting ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Sending…
					</>
				) : (
					<>
						<Ship className="h-4 w-4" />
						Submit cruise inquiry
					</>
				)}
			</button>
		</form>
	);
}
