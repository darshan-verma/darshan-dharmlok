"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

type LiveBroadcast = {
	broadcastId: string;
	title: string;
	description?: string;
	status: "created" | "live" | "ended";
	startTime?: string;
	ingestUrl?: string;
	streamKey?: string;
	playbackPath?: string;
	viewerCount?: number;
};

function toLiveStatus(value: unknown): LiveBroadcast["status"] {
	const normalized = String(value || "").toLowerCase();
	if (normalized === "live") return "live";
	if (normalized === "ended" || normalized === "completed") return "ended";
	return "created";
}

export default function LiveStudio({ roleLabel }: { roleLabel: string }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [isLoadingList, setIsLoadingList] = useState(false);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [items, setItems] = useState<LiveBroadcast[]>([]);
	const [active, setActive] = useState<LiveBroadcast | null>(null);
	const [isTestPreviewing, setIsTestPreviewing] = useState(false);
	const [isStartingTestPreview, setIsStartingTestPreview] = useState(false);
	const [isLivePreviewing, setIsLivePreviewing] = useState(false);
	const [isStartingLivePreview, setIsStartingLivePreview] = useState(false);
	const [isBrowserPublishing, setIsBrowserPublishing] = useState(false);
	const [publishMode, setPublishMode] = useState<"mediasoup" | "legacy-webrtc" | null>(null);
	const [testPreviewError, setTestPreviewError] = useState<string | null>(null);
	const [livePreviewError, setLivePreviewError] = useState<string | null>(null);
	const [isFetchingPlayback, setIsFetchingPlayback] = useState(false);
	const [playbackManifestUrl, setPlaybackManifestUrl] = useState<string | null>(null);
	const [playbackError, setPlaybackError] = useState<string | null>(null);
	const testPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
	const testPreviewStreamRef = useRef<MediaStream | null>(null);
	const livePreviewVideoRef = useRef<HTMLVideoElement | null>(null);
	const livePreviewStreamRef = useRef<MediaStream | null>(null);
	const hostPeerMapRef = useRef<Map<string, RTCPeerConnection>>(new Map());
	const hostSignalingTimerRef = useRef<number | null>(null);
	const publishingBroadcastIdRef = useRef<string | null>(null);
	const mediasoupTransportRef = useRef<{
		close: () => void;
		on: (
			event: string,
			handler: (...args: unknown[]) => void
		) => void;
		produce: (args: {
			track: MediaStreamTrack;
			stopTracks?: boolean;
			encodings?: Array<{
				maxBitrate?: number;
				scalabilityMode?: string;
				scaleResolutionDownBy?: number;
			}>;
			appData?: Record<string, unknown>;
		}) => Promise<{ close: () => void }>;
	} | null>(null);
	const mediasoupProducersRef = useRef<Array<{ close: () => void }>>([]);

	const hasLive = useMemo(
		() => items.some((item) => item.status === "live"),
		[items]
	);
	const localPlaybackUrl = useMemo(() => {
		if (!active?.playbackPath) return "";
		return `http://localhost:8080/${active.playbackPath.replace(/^\/+/, "")}`;
	}, [active?.playbackPath]);

	const stopLivePreview = () => {
		stopMediasoupPublishing();
		stopBrowserPublishing();
		if (livePreviewStreamRef.current) {
			for (const track of livePreviewStreamRef.current.getTracks()) {
				track.stop();
			}
			livePreviewStreamRef.current = null;
		}
		if (livePreviewVideoRef.current) {
			livePreviewVideoRef.current.srcObject = null;
		}
		setIsLivePreviewing(false);
	};

	const stopTestPreview = () => {
		if (testPreviewStreamRef.current) {
			for (const track of testPreviewStreamRef.current.getTracks()) {
				track.stop();
			}
			testPreviewStreamRef.current = null;
		}
		if (testPreviewVideoRef.current) {
			testPreviewVideoRef.current.srcObject = null;
		}
		setIsTestPreviewing(false);
	};

	const stopMediasoupPublishing = () => {
		for (const producer of mediasoupProducersRef.current) {
			try {
				producer.close();
			} catch {
				// no-op
			}
		}
		mediasoupProducersRef.current = [];
		if (mediasoupTransportRef.current) {
			try {
				mediasoupTransportRef.current.close();
			} catch {
				// no-op
			}
			mediasoupTransportRef.current = null;
		}
	};

	const stopBrowserPublishing = () => {
		if (hostSignalingTimerRef.current) {
			window.clearInterval(hostSignalingTimerRef.current);
			hostSignalingTimerRef.current = null;
		}
		for (const peer of hostPeerMapRef.current.values()) {
			try {
				peer.close();
			} catch {
				// no-op
			}
		}
		hostPeerMapRef.current.clear();
		publishingBroadcastIdRef.current = null;
		setIsBrowserPublishing(false);
		setPublishMode(null);
	};

	const startTestPreview = async () => {
		if (
			typeof navigator === "undefined" ||
			!navigator.mediaDevices ||
			!navigator.mediaDevices.getUserMedia
		) {
			setTestPreviewError("Camera preview is not supported in this browser.");
			return;
		}
		setIsStartingTestPreview(true);
		setTestPreviewError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			stopTestPreview();
			testPreviewStreamRef.current = stream;
			if (testPreviewVideoRef.current) {
				testPreviewVideoRef.current.srcObject = stream;
				await testPreviewVideoRef.current.play().catch(() => {
					// Ignore autoplay block; controls still allow manual play.
				});
			}
			setIsTestPreviewing(true);
		} catch (error) {
			setTestPreviewError(
				error instanceof Error
					? error.message
					: "Failed to access camera/microphone."
			);
		} finally {
			setIsStartingTestPreview(false);
		}
	};

	const startLivePreview = async () => {
		if (
			typeof navigator === "undefined" ||
			!navigator.mediaDevices ||
			!navigator.mediaDevices.getUserMedia
		) {
			setLivePreviewError("Live preview is not supported in this browser.");
			return;
		}
		setIsStartingLivePreview(true);
		setLivePreviewError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			stopLivePreview();
			livePreviewStreamRef.current = stream;
			if (livePreviewVideoRef.current) {
				livePreviewVideoRef.current.srcObject = stream;
				await livePreviewVideoRef.current.play().catch(() => {
					// Ignore autoplay block; controls still allow manual play.
				});
			}
			setIsLivePreviewing(true);
		} catch (error) {
			setLivePreviewError(
				error instanceof Error
					? error.message
					: "Failed to access camera/microphone."
			);
		} finally {
			setIsStartingLivePreview(false);
		}
	};

	const startMediasoupPublishing = async (broadcastId: string) => {
		const localStream = livePreviewStreamRef.current;
		if (!localStream) {
			throw new Error("Live camera preview stream is not available");
		}

		stopMediasoupPublishing();
		const [capsRes, clientLib] = await Promise.all([
			fetch(`/api/live/mediasoup/${broadcastId}`, { cache: "no-store" }),
			import("mediasoup-client"),
		]);
		const capsData = await capsRes.json();
		if (!capsRes.ok) {
			throw new Error(capsData.error || "Failed to get mediasoup capabilities");
		}

		const DeviceCtor = clientLib.Device;
		const device = new DeviceCtor();
		await device.load({ routerRtpCapabilities: capsData.rtpCapabilities });

		const createTransportRes = await fetch(`/api/live/mediasoup/${broadcastId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "createHostTransport" }),
		});
		const createTransportData = await createTransportRes.json();
		if (!createTransportRes.ok) {
			throw new Error(createTransportData.error || "Failed to create host transport");
		}

		const sendTransport = device.createSendTransport(createTransportData.transport);
		mediasoupTransportRef.current = sendTransport as unknown as typeof mediasoupTransportRef.current;

		sendTransport.on(
			"connect",
			(
				{ dtlsParameters }: { dtlsParameters: unknown },
				callback: () => void,
				errback: (error: Error) => void
			) => {
				void (async () => {
					try {
						const res = await fetch(`/api/live/mediasoup/${broadcastId}`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								action: "connectHostTransport",
								dtlsParameters,
							}),
						});
						const data = await res.json();
						if (!res.ok) throw new Error(data.error || "Failed to connect transport");
						callback();
					} catch (error) {
						errback(error instanceof Error ? error : new Error("Transport connect failed"));
					}
				})();
			}
		);

		sendTransport.on(
			"produce",
			(
				{
					kind,
					rtpParameters,
				}: { kind: "audio" | "video"; rtpParameters: unknown },
				callback: ({ id }: { id: string }) => void,
				errback: (error: Error) => void
			) => {
				void (async () => {
					try {
						const res = await fetch(`/api/live/mediasoup/${broadcastId}`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								action: "produceHost",
								kind,
								rtpParameters,
							}),
						});
						const data = await res.json();
						if (!res.ok) throw new Error(data.error || "Failed to create producer");
						callback({ id: data.producer.id });
					} catch (error) {
						errback(error instanceof Error ? error : new Error("Produce failed"));
					}
				})();
			}
		);

		const videoTrack = localStream.getVideoTracks()[0];
		const audioTrack = localStream.getAudioTracks()[0];
		if (!videoTrack && !audioTrack) {
			throw new Error("No local media tracks available");
		}

		if (videoTrack) {
			const videoProducer = await sendTransport.produce({
				track: videoTrack,
				stopTracks: false,
				encodings: [
					{ maxBitrate: 350_000, scalabilityMode: "S1T3", scaleResolutionDownBy: 2 },
					{ maxBitrate: 750_000, scalabilityMode: "S1T3", scaleResolutionDownBy: 1.5 },
					{ maxBitrate: 1_500_000, scalabilityMode: "S1T3", scaleResolutionDownBy: 1 },
				],
				appData: { mediaTag: "camera-video" },
			});
			mediasoupProducersRef.current.push(videoProducer);
		}
		if (audioTrack) {
			const audioProducer = await sendTransport.produce({
				track: audioTrack,
				stopTracks: false,
				appData: { mediaTag: "camera-audio" },
			});
			mediasoupProducersRef.current.push(audioProducer);
		}
		setIsBrowserPublishing(true);
		setPublishMode("mediasoup");
	};

	const fetchPlaybackManifest = async () => {
		if (!active?.broadcastId) return;
		setIsFetchingPlayback(true);
		setPlaybackManifestUrl(null);
		setPlaybackError(null);
		try {
			const res = await fetch(`/api/live/broadcasts/${active.broadcastId}/playback`);
			const data = await res.json();
			if (!res.ok) {
				throw new Error(
					data.details
						? `${data.error || "Failed to fetch playback manifest"}: ${data.details}`
						: data.error || "Failed to fetch playback manifest"
				);
			}
			setPlaybackManifestUrl(String(data.manifestUrl || ""));
			toast.success("Playback manifest ready");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Playback fetch failed";
			setPlaybackError(message);
			toast.error(message);
		} finally {
			setIsFetchingPlayback(false);
		}
	};

	useEffect(() => {
		const testPreviewVideoEl = testPreviewVideoRef.current;
		const livePreviewVideoEl = livePreviewVideoRef.current;
		return () => {
			// Inline stopTestPreview to avoid stale function dependency.
			if (testPreviewStreamRef.current) {
				for (const track of testPreviewStreamRef.current.getTracks()) {
					track.stop();
				}
				testPreviewStreamRef.current = null;
			}
			if (testPreviewVideoEl) {
				testPreviewVideoEl.srcObject = null;
			}
			setIsTestPreviewing(false);

			// Inline stopLivePreview to avoid stale function dependency.
			stopMediasoupPublishing();
			stopBrowserPublishing();
			if (livePreviewStreamRef.current) {
				for (const track of livePreviewStreamRef.current.getTracks()) {
					track.stop();
				}
				livePreviewStreamRef.current = null;
			}
			if (livePreviewVideoEl) {
				livePreviewVideoEl.srcObject = null;
			}
			setIsLivePreviewing(false);
		};
	}, []);

	useEffect(() => {
		void loadList();
	}, []);

	useEffect(() => {
		const interval = window.setInterval(() => {
			void loadList();
		}, 10000);
		return () => window.clearInterval(interval);
	}, []);

	const loadList = async () => {
		setIsLoadingList(true);
		try {
			const res = await fetch("/api/live/broadcasts");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch broadcasts");
			const broadcasts: LiveBroadcast[] = (data.broadcasts || []).map((b: Record<string, unknown>) => ({
				broadcastId: String(b.id),
				title: String(b.title || ""),
				description: String(b.description || ""),
				status: toLiveStatus(b.status),
				startTime: String(b.startTime || ""),
				playbackPath: String(b.playbackPath || ""),
				viewerCount: Number(b.viewerCount || b.participantCount || 0),
			}));
			setItems(broadcasts);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load streams");
		} finally {
			setIsLoadingList(false);
		}
	};

	const createBroadcast = async () => {
		if (!title.trim()) {
			toast.error("Please enter a stream title");
			return;
		}
		setIsCreating(true);
		try {
			const res = await fetch("/api/live/broadcasts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.details || data.error || "Failed to create broadcast");
			}

			const created: LiveBroadcast = {
				broadcastId: data.broadcastId,
				title: data.title,
				description: data.description,
				status: data.status,
				startTime: data.startTime,
				ingestUrl: data.ingestUrl,
				streamKey: data.streamKey,
				playbackPath: data.playbackPath,
			};
			setActive(created);
			setTitle("");
			setDescription("");
			toast.success("Broadcast created. Start OBS with ingest URL + stream key.");
			await loadList();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to create stream");
		} finally {
			setIsCreating(false);
		}
	};

	const updateStatus = async (broadcastId: string, action: "go-live" | "end") => {
		try {
			setIsUpdatingStatus(true);
			if (action === "go-live") {
				// Match "Go Live" with immediate local camera/mic preview behavior.
				if (!isLivePreviewing) {
					await startLivePreview();
				}
			}
			const res = await fetch(`/api/live/broadcasts/${broadcastId}/${action}`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
			if (action === "go-live") {
				await startMediasoupPublishing(broadcastId);
			}
			if (action === "end") {
				stopMediasoupPublishing();
				stopBrowserPublishing();
			}
			toast.success(
				action === "go-live"
					? "Broadcast is live via Mediasoup."
					: "Stream ended"
			);
			await loadList();
			if (active?.broadcastId === broadcastId) {
				setActive((prev) =>
					prev
						? {
								...prev,
								status: action === "go-live" ? "live" : "ended",
								viewerCount: action === "go-live" ? prev.viewerCount || 0 : 0,
						  }
						: prev
				);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Status update failed");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const copy = async (value?: string) => {
		if (!value) return;
		await navigator.clipboard.writeText(value);
		toast.success("Copied");
	};

	const openManage = async (item: LiveBroadcast) => {
		try {
			const res = await fetch(`/api/live/broadcasts/${item.broadcastId}`);
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to load broadcast details");
			}
			setActive({
				broadcastId: String(data.id || item.broadcastId),
				title: String(data.title || item.title),
				description: String(data.description || item.description || ""),
				status: toLiveStatus(data.liveState?.status || data.status || item.status),
				startTime: String(data.startTime || item.startTime || ""),
				playbackPath: String(
					data.liveState?.playbackPath || item.playbackPath || ""
				),
				viewerCount: Number(data.viewerCount || item.viewerCount || 0),
				// Stream key and ingest URL are only returned right after create.
				ingestUrl: item.ingestUrl,
				streamKey: item.streamKey,
			});
			toast.success(`Loaded broadcast: ${String(data.title || item.title)}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to manage stream");
			// Fallback to partial data so controls still open.
			setActive(item);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Camera & Microphone Test</CardTitle>
					<CardDescription>
						Test local camera/mic in browser before starting encoder stream.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<video
						ref={testPreviewVideoRef}
						autoPlay
						muted
						playsInline
						controls
						className="w-full max-w-2xl rounded-md border bg-black aspect-video"
					/>
					<div className="flex gap-2">
						<Button onClick={startTestPreview} disabled={isStartingTestPreview}>
							{isStartingTestPreview ? "Starting..." : "Start Camera Test"}
						</Button>
						<Button variant="outline" onClick={stopTestPreview} disabled={!isTestPreviewing}>
							Stop Camera Test
						</Button>
					</div>
					{testPreviewError && (
						<p className="text-sm text-red-600">
							{testPreviewError}. Allow permissions and ensure no other app is locking camera.
						</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Start Live Stream</CardTitle>
					<CardDescription>
						Create and control real-time live broadcast for {roleLabel}. Creating a
						stream does not open browser camera automatically.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Live stream title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<Textarea
						placeholder="Optional description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<div className="flex gap-2">
						<Button onClick={createBroadcast} disabled={isCreating}>
							{isCreating ? "Creating..." : "Create Stream"}
						</Button>
						<Button variant="outline" onClick={loadList} disabled={isLoadingList}>
							{isLoadingList ? "Refreshing..." : "Refresh List"}
						</Button>
					</div>
					{hasLive && <Badge variant="destructive">Live session in progress</Badge>}
				</CardContent>
			</Card>

			{active && (
				<Card>
					<CardHeader>
						<CardTitle>Broadcast Setup</CardTitle>
						<CardDescription>
							Use these details in OBS/encoder. RTMP ingest URL is not playable in Chrome.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div>
							<strong>Broadcast ID:</strong> {active.broadcastId}
						</div>
						<div>
							<strong>Active Viewers:</strong> {active.viewerCount || 0}
						</div>
						<div className="space-y-2 rounded-md border p-3">
							<p className="font-medium">Live Stream Preview (for viewers)</p>
							<video
								ref={livePreviewVideoRef}
								autoPlay
								muted
								playsInline
								controls
								className="w-full max-w-2xl rounded-md border bg-black aspect-video"
							/>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={startLivePreview}
									disabled={isStartingLivePreview}
								>
									{isStartingLivePreview ? "Starting..." : "Start Live Preview"}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={stopLivePreview}
									disabled={!isLivePreviewing}
								>
									Stop Live Preview
								</Button>
							</div>
							{livePreviewError && (
								<p className="text-xs text-red-600">
									{livePreviewError}
								</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<strong>Ingest URL:</strong>
							<span className="break-all">{active.ingestUrl || "-"}</span>
							<Button
								size="sm"
								variant="outline"
								onClick={() => copy(active.ingestUrl)}
								disabled={!active.ingestUrl}
							>
								Copy
							</Button>
						</div>
						<div className="flex items-center gap-2">
							<strong>Stream Key:</strong>
							<span className="break-all">{active.streamKey || "-"}</span>
							<Button
								size="sm"
								variant="outline"
								onClick={() => copy(active.streamKey)}
								disabled={!active.streamKey}
							>
								Copy
							</Button>
						</div>
						{!active.streamKey && (
							<p className="text-xs text-muted-foreground">
								For security, stream key is shown only immediately after creating a
								stream.
							</p>
						)}
						<div className="flex items-center gap-2">
							<strong>Playback Path:</strong>
							<span className="break-all">{active.playbackPath || "-"}</span>
						</div>
						<div className="flex items-center gap-2">
							<strong>Local Playback URL:</strong>
							<span className="break-all">{localPlaybackUrl || "-"}</span>
							<Button
								size="sm"
								variant="outline"
								onClick={() => copy(localPlaybackUrl)}
								disabled={!localPlaybackUrl}
							>
								Copy
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => window.open(localPlaybackUrl, "_blank", "noopener,noreferrer")}
								disabled={!localPlaybackUrl}
							>
								Open
							</Button>
						</div>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={fetchPlaybackManifest}
								disabled={isFetchingPlayback || active.status !== "live"}
							>
								{isFetchingPlayback ? "Fetching..." : "Fetch Signed Playback URL"}
							</Button>
						</div>
						{playbackManifestUrl && (
							<p className="text-xs break-all">
								<strong>Signed Manifest:</strong> {playbackManifestUrl}
							</p>
						)}
						<p className="text-xs text-muted-foreground">
							Go Live publishes browser camera/mic directly for viewers. OBS ingest is
							optional and can still be used.
						</p>
						{isBrowserPublishing && (
							<p className="text-xs text-emerald-600">
								Browser publishing active ({publishMode || "unknown"}): viewers can connect
								without OBS.
							</p>
						)}
						{playbackError && (
							<p className="text-xs text-red-600 break-all">
								<strong>Playback error:</strong> {playbackError}
							</p>
						)}
						<div className="flex gap-2 pt-2">
							<Button
								onClick={() => updateStatus(active.broadcastId, "go-live")}
								disabled={active.status === "live" || isUpdatingStatus}
							>
								{isUpdatingStatus && active.status !== "live"
									? "Starting..."
									: "Go Live"}
							</Button>
							<Button
								variant="destructive"
								onClick={() => updateStatus(active.broadcastId, "end")}
								disabled={active.status === "ended" || isUpdatingStatus}
							>
								End Stream
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Recent Live Broadcasts</CardTitle>
				</CardHeader>
				<CardContent>
					{items.length === 0 ? (
						<p className="text-sm text-muted-foreground">No broadcasts yet.</p>
					) : (
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={item.broadcastId}
									className={`border rounded-md p-3 flex items-center justify-between gap-4 ${
										active?.broadcastId === item.broadcastId ? "border-primary" : ""
									}`}
								>
									<div>
										<p className="font-medium">{item.title}</p>
										<p className="text-xs text-muted-foreground">{item.broadcastId}</p>
										<p className="text-xs text-muted-foreground">
											Viewers: {item.viewerCount || 0}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												item.status === "live"
													? "destructive"
													: item.status === "ended"
														? "secondary"
														: "outline"
											}
										>
											{item.status}
										</Badge>
										<Button
											size="sm"
											variant="outline"
											onClick={() => openManage(item)}
										>
											Manage
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
