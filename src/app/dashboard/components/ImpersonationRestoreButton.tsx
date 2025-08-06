"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImpersonationRestoreButton() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleRestore = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/auth/restore-admin", {
				method: "POST",
			});
			if (!res.ok) {
				setError("Failed to restore admin session. Please log in again.");
				setLoading(false);
				return;
			}
			// Restore to the saved admin return URL if present, else /admin
			const adminReturnUrl = localStorage.getItem("adminReturnUrl");
			if (adminReturnUrl) {
				localStorage.removeItem("adminReturnUrl");
				window.location.href = adminReturnUrl;
			} else {
				window.location.href = "/admin";
			}
		} catch {
			setError("Unexpected error. Please try again.");
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-2 mt-4">
			<Button onClick={handleRestore} disabled={loading}>
				{loading ? "Restoring..." : "Return to Admin"}
			</Button>
			{error && <span className="text-red-500 text-sm">{error}</span>}
		</div>
	);
}
