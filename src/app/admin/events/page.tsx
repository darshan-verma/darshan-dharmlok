"use client";

import { useEffect, useState } from "react";
import EventsTable, { Event } from "../components/events/EventsTable";
import EventsForm from "../components/events/EventsForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export default function EventsPage() {
	const [events, setEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [showDetail, setShowDetail] = useState<Event | null>(null);

	// Fetch events on mount
	useEffect(() => {
		const fetchEvents = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/events");
				const data = await res.json();
				setEvents(data);
			} catch {
				toast.error("Failed to fetch events");
			}
			setIsLoading(false);
		};
		fetchEvents();
	}, []);

	const handleAddEvent = () => {
		setEditingEvent(null);
		setShowForm(true);
	};

	const handleEditEvent = (event: Event) => {
		setEditingEvent(event);
		setShowForm(true);
	};

	const handleDeleteEvent = async (id: string, title: string) => {
		if (!confirm(`Delete event "${title}"?`)) return;
		try {
			const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error();
			setEvents((prev) => prev.filter((e) => e.id !== id));
			toast.success("Event deleted");
		} catch {
			toast.error("Failed to delete event");
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const res = await fetch(`/api/events/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error();
			const updated = await res.json();
			setEvents((prev) =>
				prev.map((e) => (e.id === id ? { ...e, status: updated.status } : e))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewEvent = (event: Event) => {
		setShowDetail(event);
	};

	const handleFormSubmit = async (eventData: Omit<Event, "id">) => {
		try {
			if (editingEvent) {
				const res = await fetch(`/api/events/${editingEvent.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(eventData),
				});
				if (!res.ok) throw new Error();
				const updated = await res.json();
				setEvents((prev) =>
					prev.map((e) => (e.id === editingEvent.id ? updated : e))
				);
				toast.success("Event updated");
			} else {
				const res = await fetch("/api/events", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(eventData),
				});
				if (!res.ok) throw new Error();
				const created = await res.json();
				setEvents((prev) => [created, ...prev]);
				toast.success("Event added");
			}
			setShowForm(false);
		} catch {
			toast.error("Failed to save event");
		}
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Events</h1>
			{isLoading ? (
				<div className="flex justify-center items-center h-40 text-lg text-gray-500">
					Loading events...
				</div>
			) : (
				<EventsTable
					events={events}
					setEvents={setEvents}
					onAddEvent={handleAddEvent}
					onEditEvent={handleEditEvent}
					onDeleteEvent={handleDeleteEvent}
					onUpdateStatus={handleUpdateStatus}
					onViewEvent={handleViewEvent}
				/>
			)}
			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent>
					<EventsForm
						initialData={editingEvent || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setShowForm(false)}
						isLoading={isLoading}
					/>
				</DialogContent>
			</Dialog>
			<Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
				<DialogContent>
					{showDetail && (
						<div className="space-y-2">
							<h2 className="text-lg font-bold">{showDetail.title}</h2>
							<p>
								<b>Date:</b> {showDetail.date}
							</p>
							<p>
								<b>Category:</b> {showDetail.category}
							</p>
							<p>
								<b>From:</b> {showDetail.fromDate}
							</p>
							<p>
								<b>To:</b> {showDetail.toDate}
							</p>
							<p>
								<b>Type:</b> {showDetail.type}
							</p>
							<p>
								<b>Status:</b> {showDetail.status}
							</p>
							{showDetail.detail && (
								<p>
									<b>Detail:</b> {showDetail.detail}
								</p>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
