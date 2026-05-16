"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SuvicharTextDto } from "@/lib/suvichar/types";

export default function SuvicharTextsPage() {
	const [texts, setTexts] = useState<SuvicharTextDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [language, setLanguage] = useState("hi");
	const [status, setStatus] = useState<"active" | "inactive">("active");
	const [blocknoteJson, setBlocknoteJson] = useState("[]");
	const [saving, setSaving] = useState(false);

	const loadTexts = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/suvichar/texts");
			if (!res.ok) throw new Error("Failed");
			const data = (await res.json()) as { content: SuvicharTextDto[] };
			setTexts(data.content);
		} catch {
			toast.error("Failed to load quote texts");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadTexts();
	}, [loadTexts]);

	const selectText = (row: SuvicharTextDto | null) => {
		if (!row) {
			setSelectedId(null);
			setTitle("");
			setLanguage("hi");
			setStatus("active");
			setBlocknoteJson("[]");
			return;
		}
		setSelectedId(row.id);
		setTitle(row.title);
		setLanguage(row.language);
		setStatus(row.status);
		setBlocknoteJson(row.blocknoteJson);
	};

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}
		setSaving(true);
		try {
			const url = selectedId
				? `/api/suvichar/texts/${selectedId}`
				: "/api/suvichar/texts";
			const method = selectedId ? "PUT" : "POST";
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					blocknoteJson,
					language,
					status,
				}),
			});
			const json = await res.json();
			if (!res.ok) {
				throw new Error(json.error || "Save failed");
			}
			toast.success(selectedId ? "Quote updated" : "Quote created");
			await loadTexts();
			selectText(json as SuvicharTextDto);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Save failed");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this quote text?")) return;
		try {
			const res = await fetch(`/api/suvichar/texts/${id}`, { method: "DELETE" });
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Delete failed");
			toast.success("Quote deleted");
			if (selectedId === id) selectText(null);
			await loadTexts();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Delete failed");
		}
	};

	if (loading) {
		return (
			<div className="py-12 text-center text-muted-foreground">Loading...</div>
		);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
			<div className="space-y-2 rounded-xl border p-3">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => selectText(null)}
				>
					+ New quote
				</Button>
				<div className="max-h-[60vh] space-y-1 overflow-y-auto">
					{texts.map((row) => (
						<button
							key={row.id}
							type="button"
							onClick={() => selectText(row)}
							className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
								selectedId === row.id
									? "bg-orange-100 text-orange-800"
									: "hover:bg-muted"
							}`}
						>
							<p className="font-medium truncate">{row.title}</p>
							<p className="text-xs text-muted-foreground truncate">
								{row.plainText}
							</p>
						</button>
					))}
				</div>
			</div>

			<div className="space-y-4 rounded-xl border p-4">
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="space-y-2 sm:col-span-1">
						<Label htmlFor="suvichar-title">Title</Label>
						<Input
							id="suvichar-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Morning Peace Quote"
						/>
					</div>
					<div className="space-y-2">
						<Label>Language</Label>
						<Select value={language} onValueChange={setLanguage}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="hi">Hindi</SelectItem>
								<SelectItem value="en">English</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Status</Label>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as "active" | "inactive")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="min-h-[280px] rounded-lg border">
					<BlockNoteEditor
						key={selectedId ?? "new"}
						initialContent={blocknoteJson}
						onChange={setBlocknoteJson}
					/>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						onClick={() => void handleSave()}
						disabled={saving}
						className="bg-orange-500 hover:bg-orange-600"
					>
						{saving ? "Saving…" : "Save"}
					</Button>
					{selectedId && (
						<Button
							type="button"
							variant="destructive"
							onClick={() => void handleDelete(selectedId)}
						>
							Delete
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
