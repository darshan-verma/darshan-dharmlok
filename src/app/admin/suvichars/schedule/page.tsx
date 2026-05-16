"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuvicharPreviewFullscreen } from "@/components/suvichar/SuvicharPreviewFullscreen";
import { SuvicharTextControls } from "@/components/suvichar/SuvicharTextControls";
import type {
	DailySuvicharDto,
	SuvicharFrameDto,
	SuvicharTextDto,
	TodaySuvicharFrame,
	TodaySuvicharText,
	TextStyleOverrides,
} from "@/lib/suvichar/types";
import { getIstDateString } from "@/lib/suvichar/dates";
import {
	getFrameDefaultTextStyle,
	mergeTextStyleOverrides,
	serializeTextStyleForDb,
} from "@/lib/suvichar/textStyle";

function frameDefaultsFromDto(frame: SuvicharFrameDto) {
	return {
		defaultTextColor: frame.defaultTextColor,
		defaultTextAlign: frame.defaultTextAlign,
	};
}

export default function SuvicharSchedulePage() {
	const [texts, setTexts] = useState<SuvicharTextDto[]>([]);
	const [frames, setFrames] = useState<SuvicharFrameDto[]>([]);
	const [schedule, setSchedule] = useState<DailySuvicharDto[]>([]);
	const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
	const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
	const [scheduledDate, setScheduledDate] = useState(getIstDateString());
	const [textStyle, setTextStyle] = useState<TextStyleOverrides | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const loadAll = useCallback(async () => {
		setLoading(true);
		try {
			const [textRes, frameRes, schedRes] = await Promise.all([
				fetch("/api/suvichar/texts"),
				fetch("/api/suvichar/frames"),
				fetch("/api/suvichar/schedule"),
			]);
			const textJson = (await textRes.json()) as { content: SuvicharTextDto[] };
			const frameJson = (await frameRes.json()) as { content: SuvicharFrameDto[] };
			const schedJson = (await schedRes.json()) as { content: DailySuvicharDto[] };
			const activeTexts = textJson.content.filter((t) => t.status === "active");
			const activeFrames = frameJson.content.filter((f) => f.status === "active");
			setTexts(activeTexts);
			setFrames(activeFrames);
			setSchedule(schedJson.content);
			setSelectedTextId((prev) => prev ?? activeTexts[0]?.id ?? null);
			setSelectedFrameId((prev) => prev ?? activeFrames[0]?.id ?? null);
		} catch {
			toast.error("Failed to load scheduler data");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadAll();
	}, [loadAll]);

	const selectedText = texts.find((t) => t.id === selectedTextId);
	const selectedFrame = frames.find((f) => f.id === selectedFrameId);

	const frameDefaults = useMemo(
		() =>
			selectedFrame
				? frameDefaultsFromDto(selectedFrame)
				: { defaultTextColor: "#1a1a1a", defaultTextAlign: "center" },
		[selectedFrame],
	);

	const resolvedTextStyle = useMemo(
		() =>
			textStyle ??
			getFrameDefaultTextStyle(frameDefaults),
		[textStyle, frameDefaults],
	);

	useEffect(() => {
		const row = schedule.find((s) => s.scheduledDate === scheduledDate);
		if (row) {
			setSelectedTextId(row.suvicharTextId);
			setSelectedFrameId(row.frameId);
			const frame = frames.find((f) => f.id === row.frameId);
			if (frame) {
				const defaults = frameDefaultsFromDto(frame);
				setTextStyle(
					row.textStyleOverrides
						? mergeTextStyleOverrides(defaults, row.textStyleOverrides)
						: getFrameDefaultTextStyle(defaults),
				);
			}
			return;
		}
		const frame = frames.find((f) => f.id === selectedFrameId);
		if (frame) {
			setTextStyle(getFrameDefaultTextStyle(frameDefaultsFromDto(frame)));
		}
	}, [scheduledDate, schedule, frames, selectedFrameId]);

	const previewPayload = useMemo(() => {
		if (!selectedText || !selectedFrame) return null;
		const text: TodaySuvicharText = {
			blocknoteJson: JSON.parse(selectedText.blocknoteJson) as unknown,
			plainText: selectedText.plainText,
			title: selectedText.title,
		};
		const frame: TodaySuvicharFrame = {
			imageUrl: selectedFrame.imageUrl,
			width: selectedFrame.width,
			height: selectedFrame.height,
			safeArea: {
				x: selectedFrame.safeAreaX,
				y: selectedFrame.safeAreaY,
				width: selectedFrame.safeAreaWidth,
				height: selectedFrame.safeAreaHeight,
			},
			defaultTextColor: selectedFrame.defaultTextColor,
			defaultFontSize: selectedFrame.defaultFontSize,
			defaultTextAlign: selectedFrame.defaultTextAlign,
		};
		return { text, frame };
	}, [selectedText, selectedFrame]);

	const buildScheduleBody = (publishNow: boolean, replace: boolean) => {
		const storedOverrides = serializeTextStyleForDb(
			resolvedTextStyle,
			frameDefaults,
		);
		return {
			suvicharTextId: selectedTextId,
			frameId: selectedFrameId,
			scheduledDate,
			status: publishNow ? "published" : "scheduled",
			publishNow,
			replace,
			textStyleOverrides: storedOverrides,
		};
	};

	const addToQueue = async (publishNow = false, replace = false) => {
		if (!selectedTextId || !selectedFrameId) {
			toast.error("Select a quote and frame");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/suvichar/schedule", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildScheduleBody(publishNow, replace)),
			});
			const json = await res.json();
			if (res.status === 409 && json.requiresReplace) {
				setSaving(false);
				if (
					confirm(
						"A suvichar already exists for this date. Replace it?",
					)
				) {
					const replaceRes = await fetch("/api/suvichar/schedule", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(buildScheduleBody(publishNow, true)),
					});
					const replaceJson = await replaceRes.json();
					if (!replaceRes.ok) {
						throw new Error(replaceJson.error || "Failed to replace");
					}
					if (replaceJson.warning) toast.warning(replaceJson.warning);
					toast.success(publishNow ? "Published for today" : "Schedule updated");
					await loadAll();
				}
				return;
			}
			if (!res.ok) throw new Error(json.error || "Failed to schedule");
			if (json.warning) toast.warning(json.warning);
			toast.success(publishNow ? "Published for today" : "Added to queue");
			await loadAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Schedule failed");
		} finally {
			setSaving(false);
		}
	};

	const publishEntry = async (id: string) => {
		try {
			const res = await fetch(`/api/suvichar/schedule/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ publishNow: true }),
			});
			if (!res.ok) throw new Error("Publish failed");
			toast.success("Published");
			await loadAll();
		} catch {
			toast.error("Publish failed");
		}
	};

	const deleteEntry = async (id: string) => {
		if (!confirm("Remove from schedule?")) return;
		try {
			const res = await fetch(`/api/suvichar/schedule/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Delete failed");
			toast.success("Removed");
			await loadAll();
		} catch {
			toast.error("Delete failed");
		}
	};

	const loadQueueEntry = (row: DailySuvicharDto) => {
		setScheduledDate(row.scheduledDate);
		setSelectedTextId(row.suvicharTextId);
		setSelectedFrameId(row.frameId);
		const frame = frames.find((f) => f.id === row.frameId);
		if (frame) {
			const defaults = frameDefaultsFromDto(frame);
			setTextStyle(
				row.textStyleOverrides
					? mergeTextStyleOverrides(defaults, row.textStyleOverrides)
					: getFrameDefaultTextStyle(defaults),
			);
		}
	};

	if (loading) {
		return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
	}

	return (
		<div className="space-y-8">
			<div className="grid gap-4 lg:grid-cols-3">
				<div className="space-y-2 rounded-xl border p-3">
					<h2 className="text-sm font-semibold">Quote library</h2>
					<div className="max-h-64 space-y-1 overflow-y-auto">
						{texts.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setSelectedTextId(t.id)}
								className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
									selectedTextId === t.id
										? "bg-orange-100 text-orange-800"
										: "hover:bg-muted"
								}`}
							>
								{t.title}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-2 rounded-xl border p-3">
					<h2 className="text-sm font-semibold">Frame library</h2>
					<div className="max-h-64 space-y-1 overflow-y-auto">
						{frames.map((f) => (
							<button
								key={f.id}
								type="button"
								onClick={() => setSelectedFrameId(f.id)}
								className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
									selectedFrameId === f.id
										? "bg-orange-100 text-orange-800"
										: "hover:bg-muted"
								}`}
							>
								{f.name}
							</button>
						))}
					</div>
				</div>

				<div className="rounded-xl border p-3 text-sm text-muted-foreground">
					<p className="font-semibold text-foreground">Tips</p>
					<ul className="mt-2 list-inside list-disc space-y-1 text-xs">
						<li>Text auto-fits the frame safe area first.</li>
						<li>Use Text controls to fine-tune size, padding, and alignment.</li>
						<li>Settings are saved with each scheduled date.</li>
					</ul>
				</div>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<div className="flex flex-col items-center rounded-xl border p-4">
					{previewPayload ? (
						<SuvicharPreviewFullscreen
							text={previewPayload.text}
							frame={previewPayload.frame}
							textStyleOverrides={resolvedTextStyle}
							inlineSize={280}
						/>
					) : (
						<>
							<h2 className="mb-3 text-sm font-semibold">Live preview</h2>
							<p className="text-sm text-muted-foreground">
								Select quote and frame
							</p>
						</>
					)}
				</div>

				{selectedFrame ? (
					<SuvicharTextControls
						value={resolvedTextStyle}
						onChange={setTextStyle}
						frameDefaults={frameDefaults}
						className="max-h-[520px] overflow-y-auto"
					/>
				) : (
					<div className="flex items-center justify-center rounded-xl border p-8 text-sm text-muted-foreground">
						Select a frame to adjust text
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
				<div className="space-y-2">
					<Label htmlFor="schedule-date">Date</Label>
					<Input
						id="schedule-date"
						type="date"
						value={scheduledDate}
						onChange={(e) => setScheduledDate(e.target.value)}
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					disabled={saving}
					onClick={() => void addToQueue(false)}
				>
					Add to queue
				</Button>
				<Button
					type="button"
					className="bg-orange-500 hover:bg-orange-600"
					disabled={saving}
					onClick={() => void addToQueue(true)}
				>
					Publish today
				</Button>
			</div>

			<div className="space-y-3">
				<h2 className="text-sm font-semibold">Scheduled queue</h2>
				{schedule.length === 0 ? (
					<p className="text-sm text-muted-foreground">No scheduled suvichars yet.</p>
				) : (
					<div className="divide-y rounded-xl border">
						{schedule.map((row) => (
							<div
								key={row.id}
								className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
							>
								<button
									type="button"
									className="text-left hover:underline"
									onClick={() => loadQueueEntry(row)}
								>
									<span className="font-medium">{row.scheduledDate}</span>
									<span className="mx-2 text-muted-foreground">→</span>
									<span>{row.suvicharText?.title ?? "Quote"}</span>
									<span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
										{row.status}
									</span>
								</button>
								<div className="flex gap-2">
									{row.status !== "published" && (
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => void publishEntry(row.id)}
										>
											Publish now
										</Button>
									)}
									<Button
										type="button"
										size="sm"
										variant="destructive"
										onClick={() => void deleteEntry(row.id)}
									>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
