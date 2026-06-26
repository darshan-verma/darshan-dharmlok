"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { EventDetailCard } from "@/app/admin/components/events/EventDetailCard";
import { EventInfoCard } from "@/app/admin/components/events/EventInfoCard";
import { Event } from "@/app/admin/components/events/types";
import type { ContentLang } from "@/lib/content-lang";
import { finalizeTranslationsPayload } from "@/lib/admin-locale-sync";

export default function EventDetailPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params?.id as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedEvent, setEditedEvent] = useState<Event | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isUploadingBanner, setIsUploadingBanner] = useState(false);
	const [isUploadingRelated, setIsUploadingRelated] = useState(false);
	const [contentLocale, setContentLocale] = useState<ContentLang>("en");

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				const response = await fetch(`/api/events/${eventId}`);
				if (!response.ok) throw new Error("Failed to fetch event");
				const data = await response.json();
				setEvent(data);
				setEditedEvent({
					...data,
					relatedImages: Array.isArray(data.relatedImages)
						? data.relatedImages
						: [],
				});
				setContentLocale("en");
			} catch {
				router.push("/admin/events");
			}
		};
		if (eventId) fetchEvent();
	}, [eventId, router]);

	const validateForm = (data: Event) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Event title is required";
		if (!data.fromDate?.trim()) errors.fromDate = "From date is required";
		if (!data.toDate?.trim()) errors.toDate = "To date is required";
		if (!data.category) errors.category = "Category is required";
		if (!data.type) errors.type = "Type is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSave = async () => {
		if (!editedEvent) return;
		const validation = validateForm(editedEvent);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const translations = finalizeTranslationsPayload(
				editedEvent as unknown as Record<string, unknown>,
				"event",
				contentLocale
			);
			const response = await fetch(`/api/events/${eventId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...editedEvent, translations }),
			});
			if (!response.ok) throw new Error("Failed to update event");
			const updated = await response.json();
			setEvent(updated);
			setEditedEvent(updated);
			setIsEditing(false);
			toast.success("Event updated successfully!");
		} catch {
			toast.error("Failed to update event");
		} finally {
			setIsSaving(false);
		}
	};

	if (!event || !editedEvent) {
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/events")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Event Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<EventDetailCard
					event={event}
					isEditing={isEditing}
					onEdit={() => setIsEditing(!isEditing)}
				/>
				<div className="md:col-span-2">
					<EventInfoCard
						event={event}
						editedEvent={editedEvent}
						setEditedEvent={setEditedEvent}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						isUploadingBanner={isUploadingBanner}
						setIsUploadingBanner={setIsUploadingBanner}
						isUploadingRelated={isUploadingRelated}
						setIsUploadingRelated={setIsUploadingRelated}
						contentLocale={contentLocale}
						onContentLocaleChange={setContentLocale}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
