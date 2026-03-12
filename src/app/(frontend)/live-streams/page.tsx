"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PageBanner } from "@/components/shared/PageBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublicLiveStream = {
	id: string;
	title: string;
	description?: string | null;
	startTime?: string | null;
	playbackPath?: string | null;
	viewerCount?: number;
	instructor?: {
		id: string;
		name: string;
		userType?: string | null;
		profileImageUrl?: string | null;
	} | null;
};

type StreamQuality = "auto" | "360p" | "480p" | "720p";

export default function LiveStreamsPage() {
	const [streams, setStreams] = useState<PublicLiveStream[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
	const [isWebRtcWatching, setIsWebRtcWatching] = useState(false);
	const [watchError, setWatchError] = useState<string | null>(null);
	const [isPreparingPlayback, setIsPreparingPlayback] = useState(false);
	const [qualityPreference, setQualityPreference] = useState<StreamQuality>("auto");
	const playerVideoRef = useRef<HTMLVideoElement | null>(null);
	const viewerPeerRef = useRef<RTCPeerConnection | null>(null);
	const viewerCandidateTimerRef = useRef<number | null>(null);
	const viewerRemoteStreamRef = useRef<MediaStream | null>(null);
	const mediasoupRecvTransportRef = useRef<{
		close: () => void;
		consume: (args: {
			id: string;
			producerId: string;
			kind: "audio" | "video";
			rtpParameters: unknown;
		}) => Promise<{ track: MediaStreamTrack; close: () => void }>;
		on: (
			event: string,
			handler: (...args: unknown[]) => void
		) => void;
	} | null>(null);
	const mediasoupConsumersRef = useRef<Array<{ close: () => void }>>([]);
	const videoConsumerRef = useRef<{
		setPreferredLayers?: (layers: { spatialLayer?: number; temporalLayer?: number }) => Promise<void>;
	} | null>(null);

	const selectedStream = useMemo(
		() => streams.find((stream) => stream.id === selectedStreamId) || null,
		[selectedStreamId, streams]
	);

	const loadStreams = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/live/public/streams", { cache: "no-store" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch live streams");
			setStreams(Array.isArray(data.streams) ? data.streams : []);
		} catch (error) {
			setWatchError(error instanceof Error ? error.message : "Failed to load streams");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadStreams();
		const interval = setInterval(loadStreams, 15000);
		return () => clearInterval(interval);
	}, []);

	const stopWatchingSession = () => {
		if (viewerCandidateTimerRef.current) {
			window.clearInterval(viewerCandidateTimerRef.current);
			viewerCandidateTimerRef.current = null;
		}
		if (viewerPeerRef.current) {
			try {
				viewerPeerRef.current.close();
			} catch {
				// no-op
			}
			viewerPeerRef.current = null;
		}
		for (const consumer of mediasoupConsumersRef.current) {
			try {
				consumer.close();
			} catch {
				// no-op
			}
		}
		mediasoupConsumersRef.current = [];
		videoConsumerRef.current = null;
		if (mediasoupRecvTransportRef.current) {
			try {
				mediasoupRecvTransportRef.current.close();
			} catch {
				// no-op
			}
			mediasoupRecvTransportRef.current = null;
		}
		if (playerVideoRef.current) {
			playerVideoRef.current.srcObject = null;
			playerVideoRef.current.removeAttribute("src");
			playerVideoRef.current.load();
		}
		viewerRemoteStreamRef.current = null;
		setIsWebRtcWatching(false);
	};

	useEffect(() => {
		return () => {
			stopWatchingSession();
		};
	}, []);

	const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
	const applyVideoQualityPreference = useCallback(async (quality: StreamQuality) => {
		const consumer = videoConsumerRef.current;
		if (!consumer?.setPreferredLayers) return;

		// Resolve "auto" by inspecting the network connection each time.
		const resolved =
			quality === "auto"
				? (() => {
						const connection = (
							navigator as Navigator & {
								connection?: { downlink?: number; effectiveType?: string };
							}
						).connection;
						const downlink = Number(connection?.downlink || 0);
						const effectiveType = String(connection?.effectiveType || "");
						if (downlink > 0) {
							if (downlink < 1.2) return "360p";
							if (downlink < 2.5) return "480p";
							return "720p";
						}
						if (effectiveType === "slow-2g" || effectiveType === "2g") return "360p";
						if (effectiveType === "3g") return "480p";
						return "720p";
				  })()
				: quality;

		const spatialLayer = resolved === "360p" ? 0 : resolved === "480p" ? 1 : 2;
		await consumer.setPreferredLayers({ spatialLayer, temporalLayer: 2 });
	}, []);
	const waitForVideoToStart = (video: HTMLVideoElement, timeoutMs = 10000) =>
		new Promise<void>((resolve, reject) => {
			let settled = false;
			const timer = window.setTimeout(() => {
				cleanup();
				reject(new Error("Live stream is taking too long to start. Please try again."));
			}, timeoutMs);

			const cleanup = () => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timer);
				video.removeEventListener("playing", handlePlaying);
				video.removeEventListener("loadeddata", handleLoadedData);
				video.removeEventListener("error", handleError);
			};

			const handlePlaying = () => {
				cleanup();
				resolve();
			};
			const handleLoadedData = () => {
				if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
					cleanup();
					resolve();
				}
			};
			const handleError = () => {
				cleanup();
				reject(new Error("Failed to play live stream in this browser."));
			};

			video.addEventListener("playing", handlePlaying);
			video.addEventListener("loadeddata", handleLoadedData);
			video.addEventListener("error", handleError);

			if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
				cleanup();
				resolve();
			}
		});

	const fetchJsonWithTimeout = async (
		input: RequestInfo | URL,
		init?: RequestInit,
		timeoutMs = 8000
	) => {
		const controller = new AbortController();
		const timer = window.setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(input, {
				...init,
				signal: controller.signal,
			});
			const data = await res.json().catch(() => ({}));
			return { res, data };
		} finally {
			window.clearTimeout(timer);
		}
	};

	const startMediasoupWatch = async (broadcastId: string): Promise<boolean> => {
		// Mediasoup viewer checklist (WebView / web page):
		// 1. Device loaded with routerRtpCapabilities from GET /api/live/mediasoup/:id
		// 2. consumeViewer requests send rtpCapabilities: device.rtpCapabilities
		// 3. Transport connect completes (connect event → connectViewerTransport → callback) before consume resolves
		// 4. Render consumer tracks on <video> via srcObject (MediaStream), not a URL
		let video = playerVideoRef.current;
		for (let i = 0; i < 10 && !video; i++) {
			await sleep(100);
			video = playerVideoRef.current;
		}
		if (!video) return false;
		stopWatchingSession();
		videoConsumerRef.current = null;

		const [capsResult, clientLib] = await Promise.all([
			fetchJsonWithTimeout(
				`/api/live/mediasoup/${broadcastId}`,
				{ cache: "no-store" },
				7000
			),
			import("mediasoup-client"),
		]);
		const { res: capsRes, data: capsData } = capsResult;
		if (!capsRes.ok || !capsData.rtpCapabilities) return false;

		const DeviceCtor = clientLib.Device;
		const device = new DeviceCtor();
		await device.load({ routerRtpCapabilities: capsData.rtpCapabilities });
		const viewerId =
			typeof crypto !== "undefined" && crypto.randomUUID
				? crypto.randomUUID()
				: `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

		const { res: createTransportRes, data: createTransportData } =
			await fetchJsonWithTimeout(
				`/api/live/mediasoup/${broadcastId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "createViewerTransport", viewerId }),
				},
				7000
			);
		if (!createTransportRes.ok) return false;

		const recvTransport = device.createRecvTransport(createTransportData.transport);
		mediasoupRecvTransportRef.current = recvTransport as unknown as typeof mediasoupRecvTransportRef.current;

		recvTransport.on(
			"connect",
			(
				{ dtlsParameters }: { dtlsParameters: unknown },
				callback: () => void,
				errback: (error: Error) => void
			) => {
				void (async () => {
					try {
						const { res, data } = await fetchJsonWithTimeout(
							`/api/live/mediasoup/${broadcastId}`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									action: "connectViewerTransport",
									viewerId,
									dtlsParameters,
								}),
							},
							7000
						);
						if (!res.ok) throw new Error(data.error || "Failed to connect viewer transport");
						callback();
					} catch (error) {
						errback(error instanceof Error ? error : new Error("Viewer transport connect failed"));
					}
				})();
			}
		);

		const localMediaStream = new MediaStream();
		let consumedTracks = 0;
		for (const kind of ["video", "audio"] as const) {
			const { res: consumeRes, data: consumeData } = await fetchJsonWithTimeout(
				`/api/live/mediasoup/${broadcastId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "consumeViewer",
						viewerId,
						rtpCapabilities: device.rtpCapabilities,
						kind,
					}),
				},
				7000
			);
			if (!consumeRes.ok || !consumeData.consumer) continue;
			const consumer = await recvTransport.consume({
				id: consumeData.consumer.id,
				producerId: consumeData.consumer.producerId,
				kind: consumeData.consumer.kind,
				rtpParameters: consumeData.consumer.rtpParameters,
			});
			mediasoupConsumersRef.current.push(consumer);
			if (consumeData.consumer.kind === "video") {
				videoConsumerRef.current = consumer as unknown as typeof videoConsumerRef.current;
				await applyVideoQualityPreference(qualityPreference).catch(() => {
					// Layer preference is best-effort.
				});
			}
			localMediaStream.addTrack(consumer.track);
			consumedTracks++;
		}

		if (!consumedTracks) {
			stopWatchingSession();
			return false;
		}

		video.srcObject = localMediaStream;
		await video.play().catch(() => {});
		await waitForVideoToStart(video, 10000);
		setIsWebRtcWatching(true);
		return true;
	};

	useEffect(() => {
		if (!isWebRtcWatching) return;
		void applyVideoQualityPreference(qualityPreference);
	}, [qualityPreference, isWebRtcWatching, applyVideoQualityPreference]);

	useEffect(() => {
		if (qualityPreference !== "auto" || !isWebRtcWatching) return;
		const connection = (
			navigator as Navigator & {
				connection?: {
					addEventListener?: (type: string, listener: () => void) => void;
					removeEventListener?: (type: string, listener: () => void) => void;
				};
			}
		).connection;
		if (!connection?.addEventListener) return;
		const onConnectionChange = () => {
			void applyVideoQualityPreference("auto");
		};
		connection.addEventListener("change", onConnectionChange);
		return () => {
			connection.removeEventListener?.("change", onConnectionChange);
		};
	}, [qualityPreference, isWebRtcWatching, applyVideoQualityPreference]);

	useEffect(() => {
		if (!selectedStreamId) return;
		const timer = window.setInterval(async () => {
			try {
				const res = await fetch(`/api/live/mediasoup/${selectedStreamId}?stats=1`, {
					cache: "no-store",
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) return;
				setStreams((prev) =>
					prev.map((stream) =>
						stream.id === selectedStreamId
							? { ...stream, viewerCount: Number(data.viewerCount || 0) }
							: stream
					)
				);
			} catch {
				// no-op
			}
		}, 5000);
		return () => window.clearInterval(timer);
	}, [selectedStreamId]);

	const startWatching = async (stream: PublicLiveStream) => {
		setSelectedStreamId(stream.id);
		setWatchError(null);
		setIsWebRtcWatching(false);
		setIsPreparingPlayback(true);
		try {
			// Let React render the player container so video ref exists for WebRTC attach.
			await sleep(0);
			const mediasoupStarted = await startMediasoupWatch(stream.id);
			if (mediasoupStarted) {
				return;
			}
			throw new Error("Mediasoup stream is unavailable right now.");
		} catch (error) {
			setWatchError(error instanceof Error ? error.message : "Failed to prepare playback");
		} finally {
			setIsPreparingPlayback(false);
		}
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />
			<PageBanner
				pageSlug="live-streams"
				title="Live Streams"
				description="Watch ongoing spiritual live sessions in real time."
				alt="Live Streams"
				className="h-[320px] md:h-[420px]"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
				descriptionClassName="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
			/>

			<section className="py-12 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl space-y-8">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
							Available Live Streams
						</h2>
						<Button onClick={loadStreams} disabled={isLoading}>
							{isLoading ? "Refreshing..." : "Refresh"}
						</Button>
					</div>

					{streams.length === 0 ? (
						<Card>
							<CardContent className="py-10 text-center text-muted-foreground">
								No live streams available right now.
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{streams.map((stream) => (
								<Card key={stream.id}>
									<CardHeader>
										<CardTitle className="text-lg">{stream.title}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<p className="text-muted-foreground">
											{stream.description || "Live session in progress."}
										</p>
										<p>
											<strong>Host:</strong> {stream.instructor?.name || "Creator"}
										</p>
										{stream.startTime && (
											<p>
												<strong>Started:</strong>{" "}
												{new Date(stream.startTime).toLocaleString()}
											</p>
										)}
										<Button onClick={() => startWatching(stream)} disabled={isPreparingPlayback}>
											{isPreparingPlayback && selectedStreamId === stream.id
												? "Preparing..."
												: "Watch Live"}
										</Button>
								<p className="text-xs text-muted-foreground">
									Viewers: {stream.viewerCount || 0}
								</p>
									</CardContent>
								</Card>
							))}
						</div>
					)}

					{selectedStream && (
						<Card>
							<CardHeader>
								<CardTitle>Now Watching: {selectedStream.title}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
									<p className="text-muted-foreground">
										Active viewers: {selectedStream.viewerCount || 0}
									</p>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">Quality</span>
										{(["auto", "360p", "480p", "720p"] as const).map((option) => (
											<Button
												key={option}
												size="sm"
												variant={qualityPreference === option ? "default" : "outline"}
												onClick={() => setQualityPreference(option)}
											>
												{option === "auto" ? "Auto" : option}
											</Button>
										))}
									</div>
								</div>
							<video
								ref={playerVideoRef}
								className="video-self-view w-full rounded-md border bg-black aspect-video"
								controls
								autoPlay
								playsInline
							/>
								<p className="text-xs text-muted-foreground break-all">
									{isWebRtcWatching
										? "Playing via Mediasoup SFU"
										: "Preparing live player..."}
								</p>
							</CardContent>
						</Card>
					)}

					{watchError && <p className="text-sm text-red-600">{watchError}</p>}
				</div>
			</section>

			<Footer />
		</div>
	);
}
