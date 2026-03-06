"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { Socket } from "socket.io-client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ChatMessageType } from "@/types/chat";

export default function ChatRoomPage({
	params,
}: {
	params: Promise<{ roomId: string }>;
}) {
	const { data: session, status } = useSession();
	const [roomId, setRoomId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessageType[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [_socket, setSocket] = useState<Socket | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		params.then((p) => setRoomId(p.roomId));
	}, [params]);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Fetch messages
	useEffect(() => {
		if (!roomId || status !== "authenticated") {
			setLoading(false);
			return;
		}
		const fetchMessages = async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
				if (res.status === 401 || res.status === 403) {
					setError("Unauthorized");
					return;
				}
				if (res.status === 404) {
					setError("Chat not found");
					return;
				}
				if (!res.ok) throw new Error("Failed to load messages");
				const data = await res.json();
				setMessages(data.messages ?? []);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to load messages");
			} finally {
				setLoading(false);
			}
		};
		fetchMessages();
	}, [roomId, status]);

	// Socket: get token, connect, join room, listen for message
	useEffect(() => {
		if (!roomId || status !== "authenticated") return;
		const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
		if (!socketUrl) return;

		let s: Socket | null = null;
		(async () => {
			try {
				const tokenRes = await fetch("/api/chat/socket-token");
				if (!tokenRes.ok) return;
				const { token } = await tokenRes.json();
				const { io: ioClient } = await import("socket.io-client");
				s = ioClient(socketUrl, {
					auth: { token },
					transports: ["websocket", "polling"],
				});
				socketRef.current = s;
				setSocket(s);
				s.emit("join", roomId);
				s.on("message", (msg: ChatMessageType) => {
					setMessages((prev) => {
						if (prev.some((m) => m.id === msg.id)) return prev;
						return [...prev, msg];
					});
				});
			} catch {
				// Socket optional; chat still works via API
			}
		})();
		return () => {
			if (s) {
				s.emit("leave", roomId);
				s.disconnect();
			}
			socketRef.current = null;
			setSocket(null);
		};
	}, [roomId, status]);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roomId || !text.trim() || !session?.user) return;
		setSending(true);
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: text.trim() }),
			});
			const data = await res.json();
			if (res.ok && data.message) {
				setMessages((prev) => [...prev, data.message]);
				setText("");
			}
		} finally {
			setSending(false);
		}
	};

	if (!roomId) return null;

	return (
		<div className="min-h-screen bg-[#f5f5f0] flex flex-col">
			<Header />
			<div className="container mx-auto px-4 py-4 max-w-2xl flex-1 flex flex-col">
				<div className="flex items-center gap-2 mb-4">
					<Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-orange-500">
						<Link href="/community" className="flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Community
						</Link>
					</Button>
				</div>

				{status !== "authenticated" && (
					<div className="rounded-xl border bg-white p-4 text-center text-gray-600">
						Sign in to chat.
					</div>
				)}

				{error && (
					<div className="rounded-xl border bg-red-50 p-4 text-red-700">{error}</div>
				)}

				{status === "authenticated" && !error && (
					<>
						<div className="flex-1 rounded-xl border bg-white flex flex-col min-h-[400px]">
							{loading ? (
								<div className="flex items-center justify-center flex-1">
									<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
								</div>
							) : (
								<div className="flex-1 overflow-y-auto p-4 space-y-3">
									{messages.map((msg) => (
										<div
											key={msg.id}
											className={`flex gap-2 ${
												msg.senderId === session.user?.id
													? "flex-row-reverse"
													: ""
											}`}
										>
											<Avatar className="h-8 w-8 shrink-0">
												<AvatarFallback className="text-xs">
													{(msg.sender?.name || "U").slice(0, 1)}
												</AvatarFallback>
											</Avatar>
											<div
												className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
													msg.senderId === session.user?.id
														? "bg-primary text-primary-foreground"
														: "bg-gray-100 text-gray-900"
												}`}
											>
												<p>{msg.text}</p>
											</div>
										</div>
									))}
									<div ref={messagesEndRef} />
								</div>
							)}
							<form
								onSubmit={handleSend}
								className="flex gap-2 p-3 border-t"
							>
								<input
									type="text"
									value={text}
									onChange={(e) => setText(e.target.value)}
									placeholder="Type a message..."
									className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
								/>
								<Button type="submit" size="icon" disabled={sending || !text.trim()}>
									{sending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Send className="h-4 w-4" />
									)}
								</Button>
							</form>
						</div>
					</>
				)}
			</div>
			<Footer />
		</div>
	);
}
