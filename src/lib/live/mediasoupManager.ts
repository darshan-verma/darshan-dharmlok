import * as mediasoup from "mediasoup";
import { existsSync } from "node:fs";
import path from "node:path";
import type {
	Consumer,
	Producer,
	RtpCapabilities,
	Router,
	Worker,
	WebRtcTransport,
} from "mediasoup/types";

type RoomState = {
	router: Router;
	hostTransport?: WebRtcTransport;
	hostProducers: Map<"audio" | "video", Producer>;
	viewerTransports: Map<string, WebRtcTransport>;
};

type TransportParams = {
	id: string;
	iceParameters: WebRtcTransport["iceParameters"];
	iceCandidates: WebRtcTransport["iceCandidates"];
	dtlsParameters: WebRtcTransport["dtlsParameters"];
};

class MediasoupLiveManager {
	private worker: Worker | null = null;
	private rooms = new Map<string, RoomState>();

	private removeViewerTransportIfMatch(
		room: RoomState,
		viewerId: string,
		transportId: string
	) {
		if (room.viewerTransports.get(viewerId)?.id === transportId) {
			room.viewerTransports.delete(viewerId);
		}
	}

	private async getWorker(): Promise<Worker> {
		if (this.worker) return this.worker;
		const explicitWorkerBin = path.resolve(
			process.cwd(),
			"node_modules/mediasoup/worker/out/Release/mediasoup-worker"
		);
		if (existsSync(explicitWorkerBin)) {
			// Turbopack can rewrite module paths as "[project]/...".
			// Pin worker binary path explicitly to keep mediasoup spawn stable.
			process.env.MEDIASOUP_WORKER_BIN = explicitWorkerBin;
		}
		this.worker = await mediasoup.createWorker({
			logLevel: "warn",
			workerBin: existsSync(explicitWorkerBin) ? explicitWorkerBin : undefined,
		});
		this.worker.on("died", () => {
			this.worker = null;
			this.rooms.clear();
		});
		return this.worker;
	}

	private async createRouter(): Promise<Router> {
		const worker = await this.getWorker();
		return worker.createRouter({
			mediaCodecs: [
				{
					kind: "audio",
					mimeType: "audio/opus",
					clockRate: 48000,
					channels: 2,
				},
				{
					kind: "video",
					mimeType: "video/VP8",
					clockRate: 90000,
					parameters: {},
				},
				{
					kind: "video",
					mimeType: "video/H264",
					clockRate: 90000,
					parameters: {
						"packetization-mode": 1,
						"profile-level-id": "42e01f",
						"level-asymmetry-allowed": 1,
					},
				},
			],
		});
	}

	private async createWebRtcTransport(router: Router): Promise<WebRtcTransport> {
		const announcedAddress = process.env.MEDIASOUP_ANNOUNCED_IP?.trim();
		const configuredListenIp = process.env.MEDIASOUP_LISTEN_IP?.trim();
		// In local development, avoid 0.0.0.0 candidates which can stall ICE for browser viewers.
		const listenIp =
			configuredListenIp || (process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0");
		const transport = await router.createWebRtcTransport({
			listenInfos: [
				{
					ip: listenIp,
					announcedAddress: announcedAddress || undefined,
					protocol: "udp",
				},
				{
					ip: listenIp,
					announcedAddress: announcedAddress || undefined,
					protocol: "tcp",
				},
			],
			enableUdp: true,
			enableTcp: true,
			preferUdp: true,
		});
		return transport;
	}

	private toTransportParams(transport: WebRtcTransport): TransportParams {
		return {
			id: transport.id,
			iceParameters: transport.iceParameters,
			iceCandidates: transport.iceCandidates,
			dtlsParameters: transport.dtlsParameters,
		};
	}

	async ensureRoom(broadcastId: string): Promise<RoomState> {
		const existing = this.rooms.get(broadcastId);
		if (existing) return existing;
		const router = await this.createRouter();
		const state: RoomState = {
			router,
			hostProducers: new Map(),
			viewerTransports: new Map(),
		};
		this.rooms.set(broadcastId, state);
		return state;
	}

	async getRouterRtpCapabilities(broadcastId: string) {
		const room = await this.ensureRoom(broadcastId);
		return room.router.rtpCapabilities;
	}

	async createHostTransport(broadcastId: string): Promise<TransportParams> {
		const room = await this.ensureRoom(broadcastId);
		if (room.hostTransport) {
			try {
				room.hostTransport.close();
			} catch {
				// no-op
			}
		}
		const transport = await this.createWebRtcTransport(room.router);
		room.hostTransport = transport;
		transport.on("routerclose", () => {
			if (room.hostTransport?.id === transport.id) {
				room.hostTransport = undefined;
			}
		});
		return this.toTransportParams(transport);
	}

	private async getHostTransportOrThrow(broadcastId: string): Promise<WebRtcTransport> {
		const room = await this.ensureRoom(broadcastId);
		if (!room.hostTransport) {
			throw new Error("Host transport not found");
		}
		return room.hostTransport;
	}

	async connectHostTransport(input: {
		broadcastId: string;
		dtlsParameters: WebRtcTransport["dtlsParameters"];
	}) {
		const transport = await this.getHostTransportOrThrow(input.broadcastId);
		await transport.connect({ dtlsParameters: input.dtlsParameters });
	}

	async createHostProducer(input: {
		broadcastId: string;
		kind: "audio" | "video";
		rtpParameters: Producer["rtpParameters"];
		appData?: Record<string, unknown>;
	}) {
		const room = await this.ensureRoom(input.broadcastId);
		const transport = await this.getHostTransportOrThrow(input.broadcastId);
		const existing = room.hostProducers.get(input.kind);
		if (existing) {
			try {
				existing.close();
			} catch {
				// no-op
			}
		}
		const producer = await transport.produce({
			kind: input.kind,
			rtpParameters: input.rtpParameters,
			appData: input.appData,
		});
		room.hostProducers.set(input.kind, producer);
		producer.on("transportclose", () => {
			if (room.hostProducers.get(input.kind)?.id === producer.id) {
				room.hostProducers.delete(input.kind);
			}
		});
		producer.on("transportclose", () => {
			if (room.hostProducers.get(input.kind)?.id === producer.id) {
				room.hostProducers.delete(input.kind);
			}
		});
		return { id: producer.id };
	}

	async createViewerTransport(input: { broadcastId: string; viewerId: string }) {
		const room = await this.ensureRoom(input.broadcastId);
		const existing = room.viewerTransports.get(input.viewerId);
		if (existing) {
			try {
				existing.close();
			} catch {
				// no-op
			}
		}
		const transport = await this.createWebRtcTransport(room.router);
		room.viewerTransports.set(input.viewerId, transport);
		const cleanup = () => {
			this.removeViewerTransportIfMatch(room, input.viewerId, transport.id);
		};
		// mediasoup typings use "@close" for the transport close event
		transport.on("@close", cleanup);
		transport.on("routerclose", () => {
			cleanup();
		});
		transport.on("dtlsstatechange", (state) => {
			if (state === "closed" || state === "failed") {
				cleanup();
			}
		});
		transport.on("icestatechange", (state) => {
			if (state === "closed" || state === "disconnected") {
				cleanup();
			}
		});
		return this.toTransportParams(transport);
	}

	private async getViewerTransportOrThrow(input: {
		broadcastId: string;
		viewerId: string;
	}) {
		const room = await this.ensureRoom(input.broadcastId);
		const transport = room.viewerTransports.get(input.viewerId);
		if (!transport) throw new Error("Viewer transport not found");
		return transport;
	}

	async connectViewerTransport(input: {
		broadcastId: string;
		viewerId: string;
		dtlsParameters: WebRtcTransport["dtlsParameters"];
	}) {
		const transport = await this.getViewerTransportOrThrow(input);
		await transport.connect({ dtlsParameters: input.dtlsParameters });
	}

	async createViewerConsumer(input: {
		broadcastId: string;
		viewerId: string;
		rtpCapabilities: RtpCapabilities;
		kind: "audio" | "video";
	}) {
		const room = await this.ensureRoom(input.broadcastId);
		const producer = room.hostProducers.get(input.kind);
		if (!producer) {
			throw new Error(`No ${input.kind} producer available`);
		}
		if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: input.rtpCapabilities })) {
			throw new Error(`Cannot consume ${input.kind} producer`);
		}
		const transport = await this.getViewerTransportOrThrow(input);
		const consumer: Consumer = await transport.consume({
			producerId: producer.id,
			rtpCapabilities: input.rtpCapabilities,
			paused: false,
		});
		return {
			id: consumer.id,
			producerId: producer.id,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
		};
	}

	async closeRoom(broadcastId: string) {
		const room = this.rooms.get(broadcastId);
		if (!room) return;
		for (const producer of room.hostProducers.values()) {
			try {
				producer.close();
			} catch {
				// no-op
			}
		}
		if (room.hostTransport) {
			try {
				room.hostTransport.close();
			} catch {
				// no-op
			}
		}
		for (const transport of room.viewerTransports.values()) {
			try {
				transport.close();
			} catch {
				// no-op
			}
		}
		try {
			room.router.close();
		} catch {
			// no-op
		}
		this.rooms.delete(broadcastId);
	}

	getViewerCount(broadcastId: string): number {
		return this.rooms.get(broadcastId)?.viewerTransports.size || 0;
	}
}

const globalForMediasoup = globalThis as unknown as {
	mediasoupLiveManager?: MediasoupLiveManager;
};

export function getMediasoupLiveManager(): MediasoupLiveManager {
	if (!globalForMediasoup.mediasoupLiveManager) {
		globalForMediasoup.mediasoupLiveManager = new MediasoupLiveManager();
	}
	return globalForMediasoup.mediasoupLiveManager;
}
